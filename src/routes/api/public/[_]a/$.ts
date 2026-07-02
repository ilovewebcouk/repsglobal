// First-party PostHog proxy — same-origin capture path.
// - Strips $ip before forwarding.
// - Drops DNT / GPC / known bots (204).
// - Tags is_internal=true when caller carries an admin bearer.
// - Adds canonical `$geoip_country_code` from Cloudflare `cf-ipcountry` header.
//   (Also mirrors to legacy `country_code` for back-compat during v1.1 rollout.)
//
// posthog-js posts events one of three ways depending on options:
//   1. Content-Type: application/json   → body is JSON  (or { batch: [...] })
//   2. Content-Type: application/x-www-form-urlencoded → body is `data=<base64 JSON>[&compression=...]`
//   3. GET beacon → ?data=<base64 JSON> in query string
// v1.1 audit found (2) was the real prod shape; the proxy was JSON.parse-ing
// form bodies, throwing, and forwarding raw → all mutations silently no-op'd.

import { createFileRoute } from "@tanstack/react-router";

const POSTHOG_INGEST_HOST = "https://eu.i.posthog.com";
const POSTHOG_ASSET_HOST = "https://eu-assets.i.posthog.com";
const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|pingdom|uptimerobot|headless|puppeteer|playwright|lighthouse|semrush|ahrefs|dataforseo|screaming\s?frog|preview\s?bot/i;

async function isAdmin(request: Request): Promise<boolean> {
  const authz = request.headers.get("authorization");
  if (!authz) return false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData } = await supabaseAdmin.auth.getUser(authz.replace(/^Bearer\s+/i, ""));
    const userId = userData?.user?.id;
    if (!userId) return false;
    const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    return data === true;
  } catch {
    return false;
  }
}

function isBot(ua: string | null): boolean {
  if (!ua) return true; // no UA = suspicious, drop
  return BOT_UA.test(ua);
}

function b64decode(s: string): string {
  // Handle URL-safe base64 too.
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    try {
      // atob returns latin1; decode as UTF-8.
      const bin = atob(norm);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      /* fall through */
    }
  }
  return Buffer.from(norm, "base64").toString("utf-8");
}

function b64encode(s: string): string {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    try {
      return btoa(bin);
    } catch {
      /* fall through */
    }
  }
  return Buffer.from(s, "utf-8").toString("base64");
}

type Mutator = (props: Record<string, unknown>) => void;

function mutateEvent(evt: unknown, mutate: Mutator) {
  if (!evt || typeof evt !== "object") return;
  const e = evt as Record<string, unknown>;
  if (!e.properties || typeof e.properties !== "object") e.properties = {};
  mutate(e.properties as Record<string, unknown>);
}

function mutateParsed(parsed: unknown, mutate: Mutator) {
  if (!parsed) return;
  // Bare array body: posthog-js sends `[{event, properties}, ...]` to /e/ in
  // some versions. Previously we assigned `.properties` on the Array itself
  // (lost by JSON.stringify) so enrichment silently no-op'd for every real
  // browser event.
  if (Array.isArray(parsed)) {
    for (const e of parsed) mutateEvent(e, mutate);
    return;
  }
  if (typeof parsed !== "object") return;
  const p = parsed as Record<string, unknown>;
  if (Array.isArray(p.batch)) {
    for (const e of p.batch as unknown[]) mutateEvent(e, mutate);
  } else {
    mutateEvent(p, mutate);
  }
}

async function proxy(request: Request, splat: string): Promise<Response> {
  if (request.headers.get("dnt") === "1") return new Response(null, { status: 204 });
  if (request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return new Response(null, { status: 204 });

  const upstreamHost =
    splat.startsWith("array/") || splat.startsWith("static/")
      ? POSTHOG_ASSET_HOST
      : POSTHOG_INGEST_HOST;
  const requestUrl = new URL(request.url);
  const country = request.headers.get("cf-ipcountry") ?? null;
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  const contentEncoding = (request.headers.get("content-encoding") ?? "").toLowerCase();

  const admin = await isAdmin(request);

  // Server-side geo enrichment for capture endpoints only (skip static/assets/decide).
  // Uses CF headers first, then ip_geolocation_cache/ipapi (server-only, never exposed).
  let derivedGeo: {
    country: string | null; region: string | null; city: string | null;
    lat: number | null; lng: number | null; postal: string | null;
    tz: string | null; asn: string | null; org: string | null;
    source: string; confidence: string;
  } | null = null;

  const isCaptureEndpoint = splat.startsWith("e") || splat.startsWith("batch") || splat.startsWith("capture");
  if (isCaptureEndpoint) {
    try {
      const cfIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const { lookupIpGeo } = await import("@/lib/activity/ip-geo.server");
      const g = cfIp ? await lookupIpGeo(cfIp) : null;
      const cc = country || g?.countryCode || null;
      const region = request.headers.get("cf-region") || g?.region || null;
      const city = request.headers.get("cf-ipcity") || g?.city || null;
      const latStr = request.headers.get("cf-iplatitude");
      const lngStr = request.headers.get("cf-iplongitude");
      const lat = latStr ? Number.parseFloat(latStr) : g?.latitude ?? null;
      const lng = lngStr ? Number.parseFloat(lngStr) : g?.longitude ?? null;
      const postal = request.headers.get("cf-postal-code") || g?.postalCode || null;
      const tz = request.headers.get("cf-timezone") || g?.timezone || null;
      let confidence: string;
      if (city && region && cc && lat !== null && lng !== null) confidence = "city";
      else if (region && cc) confidence = "region";
      else if (cc) confidence = "country";
      else confidence = "unknown";
      const source = city ? (request.headers.get("cf-ipcity") ? "cloudflare-headers" : (g?.source ?? "none")) :
        cc ? "country-only" : "none";
      derivedGeo = { country: cc, region, city, lat, lng, postal, tz, asn: g?.asn ?? null, org: g?.org ?? null, source, confidence };
    } catch {
      derivedGeo = null;
    }
  }

  // Strip all raw-IP-adjacent props; inject only derived reps_* props.
  const mutate: Mutator = (props) => {
    delete props.$ip;
    delete props.ip;
    delete (props as Record<string, unknown>).raw_ip;
    delete (props as Record<string, unknown>)["cf-connecting-ip"];
    delete (props as Record<string, unknown>)["x-forwarded-for"];
    delete (props as Record<string, unknown>)["true-client-ip"];
    delete (props as Record<string, unknown>)["x-real-ip"];
    props.reps_is_internal = admin;
    props.is_internal = admin; // legacy mirror
    props.reps_proxy_v = 4;
    if (derivedGeo) {
      if (derivedGeo.country) {
        props.reps_country_code = derivedGeo.country;
        props.country_code = derivedGeo.country;
        props.$geoip_country_code = derivedGeo.country; // may be overridden by PostHog GeoIP
      }
      if (derivedGeo.region) props.reps_region = derivedGeo.region;
      if (derivedGeo.city) props.reps_city = derivedGeo.city;
      if (derivedGeo.lat !== null) props.reps_lat = derivedGeo.lat;
      if (derivedGeo.lng !== null) props.reps_lng = derivedGeo.lng;
      if (derivedGeo.postal) props.reps_postal_code = derivedGeo.postal;
      if (derivedGeo.tz) props.reps_timezone = derivedGeo.tz;
      if (derivedGeo.asn) props.reps_asn = derivedGeo.asn;
      if (derivedGeo.org) props.reps_org = derivedGeo.org;
      props.reps_location_source = derivedGeo.source;
      props.reps_location_confidence = derivedGeo.confidence;
    } else if (country) {
      props.reps_country_code = country;
      props.country_code = country;
      props.$geoip_country_code = country;
      props.reps_location_source = "country-only";
      props.reps_location_confidence = "country";
    }
  };

  // Rebuild an outbound URL (mutating ?data= for GET beacons).
  const outboundUrl = new URL(`${upstreamHost}/${splat}${requestUrl.search}`);

  let outboundBody: BodyInit | null = null;
  const outboundHeaders = new Headers();
  let pathTaken = "none";

  if (request.method === "GET" || request.method === "HEAD") {
    pathTaken = "get-beacon";
    const dataParam = outboundUrl.searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = b64decode(dataParam);
        const parsed = JSON.parse(decoded);
        mutateParsed(parsed, mutate);
        outboundUrl.searchParams.set("data", b64encode(JSON.stringify(parsed)));
      } catch (err) {
        console.error("[posthog-proxy] GET data decode failed", err);
        return new Response(null, { status: 204 });
      }
    }
  } else {
    const isCompressed =
      Boolean(requestUrl.searchParams.get("compression")) ||
      contentEncoding.includes("gzip") ||
      contentEncoding.includes("br");

    if (isCompressed) {
      console.error(
        "[posthog-proxy] compressed body received; failing closed to preserve mutation guarantees",
      );
      return new Response(null, { status: 204 });
    }

    const raw = await request.text();
    // posthog-js sends form-encoded bodies but often labels them `text/plain`
    // (to avoid a CORS preflight). Detect on the body shape, not just the header.
    const looksLikeForm =
      contentType.includes("application/x-www-form-urlencoded") ||
      /^data=/.test(raw);
    if (raw.length === 0) {
      pathTaken = "empty";
      outboundBody = raw;
      outboundHeaders.set("content-type", contentType || "application/json");
    } else if (looksLikeForm) {
      pathTaken = "form";
      try {
        const form = new URLSearchParams(raw);
        const dataParam = form.get("data");
        if (!dataParam) {
          console.error("[posthog-proxy] form body missing data=", { contentType, len: raw.length });
          return new Response(null, { status: 204 });
        }
        const decoded = b64decode(dataParam);
        const parsed = JSON.parse(decoded);
        mutateParsed(parsed, mutate);
        form.set("data", b64encode(JSON.stringify(parsed)));
        outboundBody = form.toString();
        // Forward as form-urlencoded regardless of incoming label — that's the
        // shape PostHog's ingestion actually parses.
        outboundHeaders.set("content-type", "application/x-www-form-urlencoded");
      } catch (err) {
        console.error("[posthog-proxy] form decode failed", err, { contentType });
        return new Response(null, { status: 204 });
      }
    } else {
      pathTaken = "json";
      try {
        const parsed = JSON.parse(raw);
        mutateParsed(parsed, mutate);
        outboundBody = JSON.stringify(parsed);
        outboundHeaders.set("content-type", "application/json");
      } catch (err) {
        console.error("[posthog-proxy] JSON body parse failed", err, { contentType, len: raw.length, head: raw.slice(0, 60) });
        return new Response(null, { status: 204 });
      }
    }
  }

  console.log("[posthog-proxy]", { path: `/${splat}`, method: request.method, ct: contentType, taken: pathTaken, cc: country, admin });

  if (ua) outboundHeaders.set("user-agent", ua);
  // Deliberately do NOT forward: authorization, cookie, x-forwarded-for,
  // cf-connecting-ip, true-client-ip, x-real-ip, or content-encoding.

  const upstream = await fetch(outboundUrl.toString(), {
    method: request.method,
    headers: outboundHeaders,
    body: outboundBody,
  });

  const resHeaders = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/json",
    "cache-control": "no-store",
  });
  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const Route = createFileRoute("/api/public/_a/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => proxy(request, params._splat ?? ""),
      POST: async ({ request, params }) => proxy(request, params._splat ?? ""),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
    },
  },
});
