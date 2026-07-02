// Admin-only backfill: enrich last-30-day sessions/events with derived
// city/region/country using ip_geolocation_cache + ipapi.co.
// Rate-limited (batched) so the free tier holds. Never touches events
// where raw IP was not stored — no fake backfill.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RATE_MS = 1500; // ~40/min, well under ipapi.co free tier (~30k/mo)

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const runGeoBackfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { lookupIpGeo, isPrivateIp } = await import("@/lib/activity/ip-geo.server");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const sources = [
      { table: "user_sessions", ts: "last_seen_at" },
      { table: "member_session_events", ts: "created_at" },
      { table: "auth_events", ts: "created_at" },
    ] as const;

    // Collect unique public IPs across sources.
    const ips = new Set<string>();
    for (const s of sources) {
      const { data: rows } = await supabaseAdmin
        .from(s.table)
        .select("ip")
        .gte(s.ts, since)
        .not("ip", "is", null)
        .limit(5000);
      for (const r of rows ?? []) {
        const ip = (r as { ip: string | null }).ip;
        if (ip && !isPrivateIp(ip)) ips.add(ip);
      }
    }

    const summary = {
      window_days: data.days,
      unique_ips: ips.size,
      cache_hits: 0,
      provider_calls: 0,
      ok: 0,
      failed: 0,
      rows_updated: 0,
      rows_skipped: 0,
      rate_limited: 0,
    };

    // Map ip → geo (cache-first). Rate-limit only on live calls.
    const geoByIp = new Map<string, Awaited<ReturnType<typeof lookupIpGeo>>>();
    for (const ip of ips) {
      // Peek cache directly to attribute hits vs misses.
      const { data: cached } = await supabaseAdmin
        .from("ip_geolocation_cache")
        .select("expires_at, lookup_status")
        .eq("ip_hash", (await import("@/lib/activity/ip-geo.server")).hashIp(ip)!)
        .maybeSingle();
      const fresh = cached && new Date(cached.expires_at as string).getTime() > Date.now();
      const g = await lookupIpGeo(ip);
      if (fresh) summary.cache_hits += 1;
      else {
        summary.provider_calls += 1;
        if (g?.countryCode || g?.city) summary.ok += 1;
        else summary.failed += 1;
        await sleep(RATE_MS);
      }
      geoByIp.set(ip, g);
    }

    // Backfill rows on each source table.
    for (const s of sources) {
      const { data: rows } = await supabaseAdmin
        .from(s.table)
        .select("id,ip,city")
        .gte(s.ts, since)
        .not("ip", "is", null)
        .is("city", null)
        .limit(5000);
      for (const r of rows ?? []) {
        const row = r as { id: string; ip: string | null; city: string | null };
        if (!row.ip) { summary.rows_skipped += 1; continue; }
        const g = geoByIp.get(row.ip);
        if (!g) { summary.rows_skipped += 1; continue; }
        const { error } = await supabaseAdmin
          .from(s.table)
          .update({
            country_code: g.countryCode,
            region: g.region,
            city: g.city,
            latitude: g.latitude,
            longitude: g.longitude,
            timezone: g.timezone,
            geo_source: g.source,
          })
          .eq("id", row.id);
        if (error) summary.rows_skipped += 1;
        else summary.rows_updated += 1;
      }
    }

    return summary;
  });
