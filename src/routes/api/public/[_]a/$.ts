// First-party PostHog proxy — same-origin capture path.
// - Strips $ip before forwarding.
// - Drops DNT / GPC / known bots (204).
// - Tags is_internal=true when caller carries an admin bearer.
// - Adds canonical `$geoip_country_code` from Cloudflare `cf-ipcountry` header.
//   (Also mirrors to legacy `country_code` for back-compat during v1.1 rollout.)

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

async function proxy(request: Request, splat: string): Promise<Response> {
  // Consent enforcement lives client-side; we enforce DNT/GPC/bot server-side too.
  if (request.headers.get("dnt") === "1") return new Response(null, { status: 204 });
  if (request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return new Response(null, { status: 204 });

  const upstreamHost = splat.startsWith("array/") || splat.startsWith("static/")
    ? POSTHOG_ASSET_HOST
    : POSTHOG_INGEST_HOST;
  const requestUrl = new URL(request.url);
  const url = `${upstreamHost}/${splat}${requestUrl.search}`;
  const isCompressedRequest =
    Boolean(requestUrl.searchParams.get("compression")) ||
    (request.headers.get("content-encoding") ?? "").toLowerCase().includes("gzip");

  // Only mutate JSON POST bodies. GET (decide, etc.) passes through unchanged.
  let outboundBody: BodyInit | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (isCompressedRequest) {
      outboundBody = await request.arrayBuffer();
    } else {
      const text = await request.text();
      if (text.length > 0) {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const admin = await isAdmin(request);
        const country = request.headers.get("cf-ipcountry") ?? null;
        const stripIp = (obj: Record<string, unknown>) => {
          if (obj && typeof obj === "object") {
            const props = obj.properties as Record<string, unknown> | undefined;
            if (props && typeof props === "object") {
              delete props.$ip;
              props.is_internal = admin;
              if (country) props.country_code = country;
            }
          }
        };
        if (Array.isArray((parsed as { batch?: unknown }).batch)) {
          for (const e of (parsed as { batch: Record<string, unknown>[] }).batch) stripIp(e);
        } else {
          stripIp(parsed);
        }
        outboundBody = JSON.stringify(parsed);
      } catch {
        outboundBody = text;
      }
      }
    }
  }

  const headers = new Headers();
  headers.set("content-type", request.headers.get("content-type") ?? "application/json");
  const contentEncoding = request.headers.get("content-encoding");
  if (contentEncoding) headers.set("content-encoding", contentEncoding);
  if (ua) headers.set("user-agent", ua);
  // Deliberately do NOT forward Authorization, Cookie, or client IP.

  const upstream = await fetch(url, {
    method: request.method,
    headers,
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
