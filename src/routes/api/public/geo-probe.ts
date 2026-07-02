// Owner-only probe: returns only geo/edge fields needed for the audit.
// Auth: one-time shared secret via ?token= (GEO_PROBE_TOKEN).
// - Does NOT return raw IP or any identifying headers.
// - Auto-expires: set GEO_PROBE_EXPIRES_AT (ISO date) or leave default 24h from deploy.
// - Delete this file after the audit is complete.
import { createFileRoute } from "@tanstack/react-router";

// Hard expiry — safety net. Update or delete file after use.
const HARD_EXPIRY = Date.parse("2026-07-05T00:00:00Z");

export const Route = createFileRoute("/api/public/geo-probe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (Date.now() > HARD_EXPIRY) {
          return new Response("probe expired", { status: 410 });
        }
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const expected = process.env.GEO_PROBE_TOKEN;
        if (!expected || !token || token !== expected) {
          return new Response("forbidden", { status: 403 });
        }

        const h = request.headers;
        const pick = (k: string) => h.get(k) ?? null;

        // Cloudflare exposes a request.cf object in Workers runtime.
        // Type it loosely — TanStack's Request may not include it in TS defs.
        const cf = (request as unknown as { cf?: Record<string, unknown> }).cf ?? {};
        const cfVal = (k: string) => {
          const v = cf[k];
          return typeof v === "string" || typeof v === "number" ? String(v) : null;
        };

        const hasRawIp = Boolean(
          h.get("cf-connecting-ip") ||
            h.get("x-forwarded-for") ||
            h.get("true-client-ip"),
        );

        return Response.json({
          ok: true,
          source: "production",
          headers: {
            cf_ipcountry: pick("cf-ipcountry"),
            cf_ipcity: pick("cf-ipcity"),
            cf_region: pick("cf-region"),
            cf_region_code: pick("cf-region-code"),
            cf_iplatitude: pick("cf-iplatitude"),
            cf_iplongitude: pick("cf-iplongitude"),
            cf_postal_code: pick("cf-postal-code"),
            cf_timezone: pick("cf-timezone"),
          },
          cf_object: {
            country: cfVal("country"),
            city: cfVal("city"),
            region: cfVal("region"),
            regionCode: cfVal("regionCode"),
            latitude: cfVal("latitude"),
            longitude: cfVal("longitude"),
            postalCode: cfVal("postalCode"),
            timezone: cfVal("timezone"),
          },
          has_raw_ip: hasRawIp,
          ts: new Date().toISOString(),
        });
      },
    },
  },
});
