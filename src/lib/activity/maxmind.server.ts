// MaxMind GeoIP2 Precision City provider (server-only).
//
// HTTP API (works in Cloudflare Workers — no MMDB binary needed).
// Docs: https://dev.maxmind.com/geoip/docs/web-services
//
// Endpoint (configurable via MAXMIND_HOST):
//   - "geoip.maxmind.com" — Precision City (paid, higher accuracy, ASN)
//   - "geolite.info"      — GeoLite2 City (free web service, requires account)
//
// Auth: HTTP Basic — base64("<account_id>:<license_key>").

const DEFAULT_HOST = "geoip.maxmind.com";
const LOOKUP_TIMEOUT_MS = 1500;

export type MaxmindResult =
  | { status: "ok"; geo: MaxmindGeo; raw: unknown }
  | { status: "failed" | "rate_limited" | "unauthorized" | "not_configured"; raw: unknown };

export interface MaxmindGeo {
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
  accuracyRadiusKm: number | null;
}

function b64(s: string): string {
  if (typeof btoa === "function") {
    try {
      const bytes = new TextEncoder().encode(s);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    } catch { /* fall through */ }
  }
  return Buffer.from(s, "utf-8").toString("base64");
}

export async function fetchMaxmind(ip: string): Promise<MaxmindResult> {
  const accountId = process.env.MAXMIND_ACCOUNT_ID;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;
  const host = process.env.MAXMIND_HOST || DEFAULT_HOST;
  if (!accountId || !licenseKey) {
    console.log("[maxmind] not_configured", { host, has_account_id: !!accountId, has_license_key: !!licenseKey });
    return { status: "not_configured", raw: null };
  }
  const auth = "Basic " + b64(`${accountId}:${licenseKey}`);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${host}/geoip/v2.1/city/${encodeURIComponent(ip)}`, {
      signal: ctrl.signal,
      headers: {
        authorization: auth,
        accept: "application/json",
        "user-agent": "repsuk.org/1.0 (+admin)",
      },
    });
    const raw = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403) {
      console.log("[maxmind] unauthorized", { host, status: res.status });
      return { status: "unauthorized", raw };
    }
    if (res.status === 429) {
      console.log("[maxmind] rate_limited", { host });
      return { status: "rate_limited", raw };
    }
    if (!res.ok) {
      console.log("[maxmind] failed", { host, status: res.status });
      return { status: "failed", raw };
    }
    const j = (raw ?? {}) as Record<string, unknown>;
    const country = (j.country ?? {}) as Record<string, unknown>;
    const registered = (j.registered_country ?? {}) as Record<string, unknown>;
    const subs = Array.isArray(j.subdivisions) ? (j.subdivisions as Array<Record<string, unknown>>) : [];
    const sub0 = subs[0] ?? {};
    const city = (j.city ?? {}) as Record<string, unknown>;
    const postal = (j.postal ?? {}) as Record<string, unknown>;
    const loc = (j.location ?? {}) as Record<string, unknown>;
    const traits = (j.traits ?? {}) as Record<string, unknown>;
    const names = (o: Record<string, unknown>) =>
      ((o.names as Record<string, unknown> | undefined)?.en as string | undefined) ?? null;
    const num = (v: unknown) => (typeof v === "number" ? v : v != null ? Number(v) : null);
    const asn = traits.autonomous_system_number as number | undefined;
    const geo: MaxmindGeo = {
      countryCode: (country.iso_code as string | undefined) ?? (registered.iso_code as string | undefined) ?? null,
      countryName: names(country) ?? names(registered),
      region: names(sub0 as Record<string, unknown>) ?? ((sub0.iso_code as string | undefined) ?? null),
      city: names(city),
      postalCode: (postal.code as string | undefined) ?? null,
      latitude: num(loc.latitude),
      longitude: num(loc.longitude),
      timezone: (loc.time_zone as string | undefined) ?? null,
      asn: typeof asn === "number" ? `AS${asn}` : null,
      org: (traits.autonomous_system_organization as string | undefined)
        ?? (traits.isp as string | undefined) ?? null,
      accuracyRadiusKm: num(loc.accuracy_radius),
    };
    console.log("[maxmind] ok", { host, city: geo.city, region: geo.region, cc: geo.countryCode });
    return { status: "ok", geo, raw };
  } catch (err) {
    console.log("[maxmind] threw", { host, err: (err as Error)?.name });
    return { status: "failed", raw: null };
  } finally {
    clearTimeout(t);
  }
}
