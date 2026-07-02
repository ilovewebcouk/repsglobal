// Server-only IP → geo enrichment (Public Analytics v1.2).
//
// Priority: Cloudflare visitor headers (handled upstream in capture.server) →
// ip_geolocation_cache (hashed key) → ipapi.co live → country-only → none.
//
// Rules:
//   - Never call ipapi.co for private/reserved IPs.
//   - Cache successes for 24h, failures for 1h, private/reserved as "unavailable"
//     (no provider call ever) for 30d.
//   - Cache row is keyed by ip_hash (HMAC-SHA256 with ACTIVITY_IP_SALT).
//     We do NOT store raw IPs in the cache table.
//   - Emits location_source + location_confidence for downstream UI.

import { createHmac } from "node:crypto";

const TTL_OK_MS = 24 * 60 * 60 * 1000;
const TTL_FAIL_MS = 60 * 60 * 1000;
const TTL_PRIVATE_MS = 30 * 24 * 60 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 1500;

export type LocationConfidence = "city" | "region" | "country" | "unknown";
export type LocationSource =
  | "cloudflare-headers"
  | "maxmind"
  | "maxmind-cache"
  | "ipapi"
  | "ipapi-cache"
  | "country-only"
  | "none";

export interface IpGeo {
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  asn: string | null;
  org: string | null;
  source: LocationSource;
  confidence: LocationConfidence;
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.ACTIVITY_IP_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex");
}

export function prefixHash(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.ACTIVITY_IP_SALT;
  if (!salt) return null;
  let prefix = ip;
  if (ip.includes(".")) {
    const p = ip.split(".");
    if (p.length === 4) prefix = `${p[0]}.${p[1]}.${p[2]}.0/24`;
  } else if (ip.includes(":")) {
    const p = ip.split(":");
    prefix = `${p.slice(0, 3).join(":")}::/48`;
  }
  return createHmac("sha256", salt).update(prefix).digest("hex");
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^fc[0-9a-f]{2}:/i.test(ip)) return true;
  if (/^fd[0-9a-f]{2}:/i.test(ip)) return true;
  if (/^fe80:/i.test(ip)) return true;
  return false;
}

export function computeConfidence(geo: {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}): LocationConfidence {
  if (geo.city && geo.region && geo.countryCode && geo.latitude !== null && geo.longitude !== null)
    return "city";
  if (geo.region && geo.countryCode) return "region";
  if (geo.countryCode) return "country";
  return "unknown";
}

async function readCache(ipHash: string): Promise<IpGeo | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("ip_geolocation_cache")
    .select("provider,country_code,country_name,region,city,postal_code,latitude,longitude,timezone,asn,org,lookup_status,expires_at")
    .eq("ip_hash", ipHash)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;
  if (data.lookup_status === "failed" || data.lookup_status === "rate_limited") return null;
  if (data.lookup_status === "private") {
    return {
      countryCode: null, countryName: null, region: null, city: null, postalCode: null,
      latitude: null, longitude: null, timezone: null, asn: null, org: null,
      source: "none", confidence: "unknown",
    };
  }
  const geo = {
    countryCode: (data.country_code as string | null) ?? null,
    countryName: (data.country_name as string | null) ?? null,
    region: (data.region as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    postalCode: (data.postal_code as string | null) ?? null,
    latitude: (data.latitude as number | null) ?? null,
    longitude: (data.longitude as number | null) ?? null,
    timezone: (data.timezone as string | null) ?? null,
    asn: (data.asn as string | null) ?? null,
    org: (data.org as string | null) ?? null,
  };
  const src: LocationSource = data.provider === "maxmind" ? "maxmind-cache" : "ipapi-cache";
  return { ...geo, source: src, confidence: computeConfidence(geo) };
}

async function writeCache(
  ipHash: string,
  ipPrefixHash: string | null,
  provider: "maxmind" | "ipapi",
  status: "ok" | "failed" | "private" | "rate_limited",
  geo: Partial<IpGeo> | null,
  raw: unknown,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const ttl = status === "ok" ? TTL_OK_MS : status === "private" ? TTL_PRIVATE_MS : TTL_FAIL_MS;
  const expires = new Date(now.getTime() + ttl);
  await supabaseAdmin.from("ip_geolocation_cache").upsert(
    {
      ip_hash: ipHash,
      ip_prefix_hash: ipPrefixHash,
      provider,
      country_code: geo?.countryCode ?? null,
      country_name: geo?.countryName ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
      postal_code: geo?.postalCode ?? null,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      timezone: geo?.timezone ?? null,
      asn: geo?.asn ?? null,
      org: geo?.org ?? null,
      lookup_status: status,
      raw_response_jsonb: (raw ?? null) as never,
      last_seen_at: now.toISOString(),
      expires_at: expires.toISOString(),
    },
    { onConflict: "ip_hash" },
  );
}

async function fetchIpapi(ip: string): Promise<{ geo: IpGeo | null; raw: unknown; status: "ok" | "failed" | "rate_limited" }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: ctrl.signal,
      headers: { "user-agent": "repsuk.org/1.0 (+admin)" },
    });
    const raw = await res.json().catch(() => null);
    if (!res.ok) {
      const status = res.status === 429 ? "rate_limited" : "failed";
      return { geo: null, raw, status };
    }
    const j = (raw ?? {}) as Record<string, unknown>;
    if (j.error) return { geo: null, raw, status: "failed" };
    const num = (v: unknown) => (typeof v === "number" ? v : v != null ? Number(v) : null);
    const geoPartial = {
      countryCode: (j.country_code as string) || null,
      countryName: (j.country_name as string) || null,
      region: (j.region as string) || null,
      city: (j.city as string) || null,
      postalCode: (j.postal as string) || null,
      latitude: num(j.latitude),
      longitude: num(j.longitude),
      timezone: (j.timezone as string) || null,
      asn: (j.asn as string) || null,
      org: (j.org as string) || null,
    };
    return {
      geo: { ...geoPartial, source: "ipapi", confidence: computeConfidence(geoPartial) },
      raw,
      status: "ok",
    };
  } catch {
    return { geo: null, raw: null, status: "failed" };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Server-side IP lookup. Cache-first; MaxMind primary, ipapi.co fallback.
 * Never called from the browser. Returns null when no ACTIVITY_IP_SALT
 * is configured or IP missing.
 */
export async function lookupIpGeo(ip: string | null | undefined): Promise<IpGeo | null> {
  if (!ip) return null;
  const ipHash = hashIp(ip);
  const ipPfx = prefixHash(ip);
  if (!ipHash) return null;

  if (isPrivateIp(ip)) {
    try { await writeCache(ipHash, ipPfx, "maxmind", "private", null, null); } catch { /* ignore */ }
    return { countryCode: null, countryName: null, region: null, city: null, postalCode: null,
      latitude: null, longitude: null, timezone: null, asn: null, org: null,
      source: "none", confidence: "unknown" };
  }

  try {
    const cached = await readCache(ipHash);
    if (cached) return cached;
  } catch { /* fall through */ }

  // Primary: MaxMind Precision City (or GeoLite2 web service).
  try {
    const { fetchMaxmind } = await import("./maxmind.server");
    const mm = await fetchMaxmind(ip);
    if (mm.status === "ok") {
      const geo: IpGeo = { ...mm.geo, source: "maxmind", confidence: computeConfidence(mm.geo) };
      try { await writeCache(ipHash, ipPfx, "maxmind", "ok", geo, mm.raw); } catch { /* ignore */ }
      return geo;
    }
    if (mm.status === "not_configured") {
      // fall through to ipapi
    } else if (mm.status === "unauthorized") {
      console.error("[ip-geo] MaxMind unauthorized — check MAXMIND_ACCOUNT_ID / MAXMIND_LICENSE_KEY");
      // fall through to ipapi
    } else {
      // failed / rate_limited — try ipapi as backup
    }
  } catch (err) {
    console.error("[ip-geo] MaxMind lookup threw", err);
  }

  // Fallback: ipapi.co
  const { geo, raw, status } = await fetchIpapi(ip);
  try { await writeCache(ipHash, ipPfx, "ipapi", status, geo, raw); } catch { /* ignore */ }
  return geo;
}

