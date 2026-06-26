import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DiscoverabilityKpis = {
  views_30d: number;
  views_prev_30d: number;
  views_delta_pct: number | null;
  impressions_30d: number;
  avg_position: number | null;
  ctr_pct: number | null;
  /** Last 14 days, oldest → newest. Each entry is a UTC YYYY-MM-DD and count. */
  daily_views: Array<{ date: string; count: number }>;
};

/**
 * Aggregates the signed-in professional's discoverability KPIs over the
 * last 30 days, compared with the prior 30 days. Empty/zero shape is
 * intentional so the strip renders even before any tracking lands.
 *
 * Also returns a 14-day daily series for the header sparkline.
 */
export const getDiscoverabilityKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiscoverabilityKpis> => {
    const { supabase, userId } = context;

    const now = Date.now();
    const d14 = new Date(now - 14 * 86_400_000).toISOString();
    const d30 = new Date(now - 30 * 86_400_000).toISOString();
    const d60 = new Date(now - 60 * 86_400_000).toISOString();

    const [viewsRecent, viewsPrev, appearances, dailyRows] = await Promise.all([
      supabase
        .from("profile_view_events")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", userId)
        .gte("created_at", d30),
      supabase
        .from("profile_view_events")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", userId)
        .gte("created_at", d60)
        .lt("created_at", d30),
      supabase
        .from("search_appearance_events")
        .select("position")
        .eq("professional_id", userId)
        .gte("created_at", d30),
      supabase
        .from("profile_view_events")
        .select("created_at")
        .eq("professional_id", userId)
        .gte("created_at", d14),
    ]);

    const views_30d = viewsRecent.count ?? 0;
    const views_prev_30d = viewsPrev.count ?? 0;
    const views_delta_pct =
      views_prev_30d > 0
        ? Math.round(((views_30d - views_prev_30d) / views_prev_30d) * 100)
        : null;

    const positions = (appearances.data ?? [])
      .map((r) => (r as { position: number | null }).position)
      .filter((n): n is number => typeof n === "number");
    const impressions_30d = positions.length;
    const avg_position =
      positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null;
    const ctr_pct =
      impressions_30d > 0 ? Math.round((views_30d / impressions_30d) * 1000) / 10 : null;

    // 14-day daily bucket, UTC days, oldest → newest.
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const row of dailyRows.data ?? []) {
      const at = (row as { created_at: string }).created_at;
      const key = new Date(at).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const daily_views = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));

    return {
      views_30d,
      views_prev_30d,
      views_delta_pct,
      impressions_30d,
      avg_position,
      ctr_pct,
      daily_views,
    };
  });
