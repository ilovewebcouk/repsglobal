// Server-only IP → geo enrichment via ipapi.co (free tier, no key, ~30k req/mo).
// Bounded by a /24 subnet cache in public.ip_geo_cache (30-day TTL) so we
// barely touch the quota — same subnet from the same visitor = 1 lookup / month.

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const LOOKUP_TIMEOUT_MS = 1500;

export interface IpGeo {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  source: string; // 'ipapi' | 'ipapi-cache'
}

function subnetOf(ip: string): string {
  // IPv4: /24. IPv6: /48. Anything else: raw.
  if (ip.includes(".")) {
    const p = ip.split(".");
    if (p.length === 4) return `${p[0]}.${p[1]}.${p[2]}.0/24`;
  }
  if (ip.includes(":")) {
    const p = ip.split(":");
    return `${p.slice(0, 3).join(":")}::/48`;
  }
  return ip;
}

async function readCache(subnet: string): Promise<IpGeo | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("ip_geo_cache")
    .select("country_code,region,city,latitude,longitude,timezone,source,looked_up_at")
    .eq("subnet", subnet)
    .maybeSingle();
  if (!data) return null;
  const age = Date.now() - new Date(data.looked_up_at as string).getTime();
  if (age > CACHE_TTL_MS) return null;
  return {
    countryCode: data.country_code,
    region: data.region,
    city: data.city,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    source: "ipapi-cache",
  };
}

async function writeCache(subnet: string, geo: IpGeo): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("ip_geo_cache").upsert({
    subnet,
    country_code: geo.countryCode,
    region: geo.region,
    city: geo.city,
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone,
    source: "ipapi",
    looked_up_at: new Date().toISOString(),
  });
}

async function fetchIpapi(ip: string): Promise<IpGeo | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: ctrl.signal,
      headers: { "user-agent": "repsuk.org/1.0 (+admin)" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    if (j.error) return null;
    const num = (v: unknown) => (typeof v === "number" ? v : v ? Number(v) : null);
    return {
      countryCode: (j.country_code as string) || null,
      region: (j.region as string) || null,
      city: (j.city as string) || null,
      latitude: num(j.latitude),
      longitude: num(j.longitude),
      timezone: (j.timezone as string) || null,
      source: "ipapi",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function lookupIpGeo(ip: string | null | undefined): Promise<IpGeo | null> {
  if (!ip) return null;
  const subnet = subnetOf(ip);
  try {
    const cached = await readCache(subnet);
    if (cached) return cached;
  } catch {
    // fall through to live lookup
  }
  const live = await fetchIpapi(ip);
  if (!live) return null;
  try { await writeCache(subnet, live); } catch { /* ignore */ }
  return live;
}
