// Admin-only diagnostic snapshot for Public Analytics v1.2 pipeline.
// Temporary while we prove MaxMind + observation write end-to-end.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SupaCtx = { supabase: unknown; userId: string };

async function assertAdmin(ctx: SupaCtx) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const getAnalyticsDebug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as SupaCtx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [obsLatest, cacheLatest, obsAll, cacheAll] = await Promise.all([
      supabaseAdmin
        .from("security_visitor_ip_observations")
        .select("event_context,session_id,posthog_distinct_id,path,referrer,country_code,region,city,latitude,longitude,location_source,location_confidence,last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("ip_geolocation_cache")
        .select("provider,lookup_status,country_code,region,city,latitude,longitude,timezone,asn,org,expires_at,last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(10),
      supabaseAdmin.from("security_visitor_ip_observations").select("event_context").limit(2000),
      supabaseAdmin.from("ip_geolocation_cache").select("provider").limit(2000),
    ]);

    const obsByContext = (() => {
      const m = new Map<string, number>();
      for (const r of obsAll.data ?? []) {
        const k = (r as { event_context: string | null }).event_context ?? "unknown";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([event_context, count]) => ({ event_context, count }));
    })();

    const cacheByProvider = (() => {
      const m = new Map<string, number>();
      for (const r of cacheAll.data ?? []) {
        const k = (r as { provider: string | null }).provider ?? "unknown";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([provider, count]) => ({ provider, count }));
    })();

    return {
      generated_at: new Date().toISOString(),
      env: {
        has_maxmind_account_id: !!process.env.MAXMIND_ACCOUNT_ID,
        has_maxmind_license_key: !!process.env.MAXMIND_LICENSE_KEY,
        maxmind_host: process.env.MAXMIND_HOST || "geoip.maxmind.com",
        has_activity_ip_salt: !!process.env.ACTIVITY_IP_SALT,
      },
      observations: { latest: obsLatest.data ?? [], by_context: obsByContext },
      geo_cache: { latest: cacheLatest.data ?? [], by_provider: cacheByProvider },
    };
  });
