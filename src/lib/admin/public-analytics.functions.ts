// Admin-only read APIs for /admin/activity Public Visitors panels.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SupaCtx = { supabase: unknown; userId: string };

async function assertAdmin(ctx: SupaCtx) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface PublicAnalyticsRollup {
  date: string;
  public_page_views: number;
  public_profile_views: number;
  public_unique_sessions: number;
  directory_searches: number;
  searches_no_results: number;
  result_clicks: number;
  enquiries_created: number;
  signup_starts: number;
  checkout_starts: number;
  top_pages: Array<{ key: string; count: number }>;
  top_profiles: Array<{ key: string; count: number }>;
  top_searches: Array<{ key: string; count: number }>;
  top_no_result_searches: Array<{ key: string; count: number }>;
  top_referrers: Array<{ key: string; count: number }>;
  countries: Array<{ key: string; count: number }>;
  devices: Record<string, number>;
}

export interface PublicAnalyticsSummary {
  configured: boolean;
  today: PublicAnalyticsRollup | null;
  yesterday: PublicAnalyticsRollup | null;
  last_7d: {
    public_page_views: number;
    public_profile_views: number;
    public_unique_sessions: number;
    enquiries_created: number;
    signup_starts: number;
    checkout_starts: number;
  };
  conversions_24h: {
    total: number;
    enquiries_created: number;
    signup_starts: number;
    checkout_starts: number;
    signup_completes: number;
  };
  last_ingest: {
    last_pulled_date: string | null;
    last_run_at: string | null;
    last_status: string | null;
    last_error: string | null;
  } | null;
}

export const getPublicAnalyticsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicAnalyticsSummary> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const configured = Boolean(process.env.POSTHOG_PERSONAL_API_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const iso24h = new Date(Date.now() - 86_400_000).toISOString();

    const [rollupsRes, convRes, ingestRes] = await Promise.all([
      supabaseAdmin
        .from("metrics_daily_public_analytics")
        .select("*")
        .gte("metric_date", sevenDaysAgo)
        .order("metric_date", { ascending: false }),
      supabaseAdmin
        .from("public_visitor_conversions")
        .select("event_kind")
        .gte("occurred_at", iso24h),
      supabaseAdmin
        .from("public_analytics_ingest_state")
        .select("*")
        .eq("id", "posthog_daily")
        .maybeSingle(),
    ]);

    const rollups = (rollupsRes.data ?? []) as Array<Record<string, unknown>>;
    const findRollup = (d: string): PublicAnalyticsRollup | null => {
      const row = rollups.find((r) => r.metric_date === d);
      if (!row) return null;
      return {
        date: String(row.metric_date),
        public_page_views: Number(row.public_page_views ?? 0),
        public_profile_views: Number(row.public_profile_views ?? 0),
        public_unique_sessions: Number(row.public_unique_sessions ?? 0),
        directory_searches: Number(row.directory_searches ?? 0),
        searches_no_results: Number(row.searches_no_results ?? 0),
        result_clicks: Number(row.result_clicks ?? 0),
        enquiries_created: Number(row.enquiries_created ?? 0),
        signup_starts: Number(row.signup_starts ?? 0),
        checkout_starts: Number(row.checkout_starts ?? 0),
        top_pages: (row.top_pages as PublicAnalyticsRollup["top_pages"]) ?? [],
        top_profiles: (row.top_profiles as PublicAnalyticsRollup["top_profiles"]) ?? [],
        top_searches: (row.top_searches as PublicAnalyticsRollup["top_searches"]) ?? [],
        top_no_result_searches:
          (row.top_no_result_searches as PublicAnalyticsRollup["top_no_result_searches"]) ?? [],
        top_referrers: (row.top_referrers as PublicAnalyticsRollup["top_referrers"]) ?? [],
        countries: (row.countries as PublicAnalyticsRollup["countries"]) ?? [],
        devices: (row.devices as Record<string, number>) ?? {},
      };
    };

    const last_7d: PublicAnalyticsSummary["last_7d"] = {
      public_page_views: 0,
      public_profile_views: 0,
      public_unique_sessions: 0,
      enquiries_created: 0,
      signup_starts: 0,
      checkout_starts: 0,
    };
    for (const r of rollups) {
      last_7d.public_page_views += Number(r.public_page_views ?? 0);
      last_7d.public_profile_views += Number(r.public_profile_views ?? 0);
      last_7d.public_unique_sessions += Number(r.public_unique_sessions ?? 0);
      last_7d.enquiries_created += Number(r.enquiries_created ?? 0);
      last_7d.signup_starts += Number(r.signup_starts ?? 0);
      last_7d.checkout_starts += Number(r.checkout_starts ?? 0);
    }

    const convs = (convRes.data ?? []) as Array<{ event_kind: string }>;
    const conversions_24h = {
      total: convs.length,
      enquiries_created: convs.filter((c) => c.event_kind === "enquiry_created").length,
      signup_starts: convs.filter((c) => c.event_kind === "signup_started").length,
      checkout_starts: convs.filter((c) => c.event_kind === "checkout_started").length,
      signup_completes: convs.filter((c) => c.event_kind === "signup_complete").length,
    };

    const ingest = ingestRes.data as Record<string, unknown> | null;

    return {
      configured,
      today: findRollup(today),
      yesterday: findRollup(yesterday),
      last_7d,
      conversions_24h,
      last_ingest: ingest
        ? {
            last_pulled_date: (ingest.last_pulled_date as string | null) ?? null,
            last_run_at: (ingest.last_run_at as string | null) ?? null,
            last_status: (ingest.last_status as string | null) ?? null,
            last_error: (ingest.last_error as string | null) ?? null,
          }
        : null,
    };
  });
