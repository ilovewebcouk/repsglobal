// Activity feed server functions for /admin/activity and the per-member Activity tab.
// Reads from auth_events, page_view_events and user_sessions captured by the
// public activity endpoints. Admin-only.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (n: string, p: Record<string, unknown>) => Promise<{ data: boolean | null }>;
  };
  const { data: isAdmin } = await sb.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export type ActivityKpis = {
  onlineNow: number;             // sessions with last_seen_at within 5 minutes
  sessions24h: number;
  pageViews24h: number;
  uniqueVisitors24h: number;
  signins24h: number;
  signinsFailed24h: number;
  newSignups24h: number;
  topCountry24h: string | null;
};

export const getActivityKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActivityKpis> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since24 = new Date(Date.now() - 24 * 3600_000).toISOString();
    const since5m = new Date(Date.now() - 5 * 60_000).toISOString();

    const [
      onlineRes,
      sessionsRes,
      pvRes,
      uniqRes,
      signinRes,
      failRes,
      signupsRes,
      countryRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("user_sessions")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", since5m),
      supabaseAdmin
        .from("user_sessions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", since24),
      supabaseAdmin
        .from("page_view_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24),
      supabaseAdmin
        .from("page_view_events")
        .select("anon_id")
        .gte("created_at", since24)
        .limit(50_000),
      supabaseAdmin
        .from("auth_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "sign_in")
        .gte("created_at", since24),
      supabaseAdmin
        .from("auth_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "sign_in_failed")
        .gte("created_at", since24),
      supabaseAdmin
        .from("professionals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24)
        .eq("is_demo", false),
      supabaseAdmin
        .from("page_view_events")
        .select("country_code")
        .gte("created_at", since24)
        .not("country_code", "is", null)
        .limit(20_000),
    ]);

    const uniq = new Set<string>();
    for (const r of (uniqRes.data ?? []) as Array<{ anon_id: string }>) uniq.add(r.anon_id);

    const countryCounts = new Map<string, number>();
    for (const r of (countryRes.data ?? []) as Array<{ country_code: string }>) {
      countryCounts.set(r.country_code, (countryCounts.get(r.country_code) ?? 0) + 1);
    }
    const topCountry = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      onlineNow: onlineRes.count ?? 0,
      sessions24h: sessionsRes.count ?? 0,
      pageViews24h: pvRes.count ?? 0,
      uniqueVisitors24h: uniq.size,
      signins24h: signinRes.count ?? 0,
      signinsFailed24h: failRes.count ?? 0,
      newSignups24h: signupsRes.count ?? 0,
      topCountry24h: topCountry,
    };
  });

// ---------------------------------------------------------------------------
// Live activity feed (unified: page views + auth events)
// ---------------------------------------------------------------------------

export type FeedKind = "page_view" | "auth";

export type ActivityFeedRow = {
  id: string;
  kind: FeedKind;
  createdAt: string;
  // who
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  // what
  event: string;                  // 'page_view' | 'sign_in' | 'sign_in_failed' | ...
  path: string | null;
  referrer: string | null;
  // where + how
  countryCode: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  isAdminView: boolean;
};

const FeedInput = z.object({
  rangeHours: z.number().int().min(1).max(168).default(24),
  kind: z.enum(["all", "page_view", "auth"]).default("all"),
  userId: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
  limit: z.number().int().min(1).max(500).default(150),
});

export const getActivityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => FeedInput.parse(input ?? {}))
  .handler(async ({ context, data }): Promise<ActivityFeedRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.rangeHours * 3600_000).toISOString();

    const rows: ActivityFeedRow[] = [];

    if (data.kind !== "auth") {
      let pvQuery = supabaseAdmin
        .from("page_view_events")
        .select(
          "id, created_at, user_id, path, referrer, country_code, city, device, browser, os, is_admin_view",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.userId) pvQuery = pvQuery.eq("user_id", data.userId);
      if (data.search) pvQuery = pvQuery.ilike("path", `%${data.search}%`);
      const { data: pv } = await pvQuery;
      for (const r of (pv ?? []) as Array<Record<string, unknown>>) {
        rows.push({
          id: `pv:${r.id as string}`,
          kind: "page_view",
          createdAt: r.created_at as string,
          userId: (r.user_id as string | null) ?? null,
          userName: null,
          userEmail: null,
          event: "page_view",
          path: (r.path as string) ?? null,
          referrer: (r.referrer as string | null) ?? null,
          countryCode: (r.country_code as string | null) ?? null,
          city: (r.city as string | null) ?? null,
          device: (r.device as string | null) ?? null,
          browser: (r.browser as string | null) ?? null,
          os: (r.os as string | null) ?? null,
          isAdminView: Boolean(r.is_admin_view),
        });
      }
    }

    if (data.kind !== "page_view") {
      let authQuery = supabaseAdmin
        .from("auth_events")
        .select(
          "id, created_at, user_id, event, email, country_code, city, device, browser, os",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.userId) authQuery = authQuery.eq("user_id", data.userId);
      if (data.search) authQuery = authQuery.ilike("email", `%${data.search}%`);
      const { data: ae } = await authQuery;
      for (const r of (ae ?? []) as Array<Record<string, unknown>>) {
        rows.push({
          id: `ae:${r.id as string}`,
          kind: "auth",
          createdAt: r.created_at as string,
          userId: (r.user_id as string | null) ?? null,
          userName: null,
          userEmail: (r.email as string | null) ?? null,
          event: r.event as string,
          path: null,
          referrer: null,
          countryCode: (r.country_code as string | null) ?? null,
          city: (r.city as string | null) ?? null,
          device: (r.device as string | null) ?? null,
          browser: (r.browser as string | null) ?? null,
          os: (r.os as string | null) ?? null,
          isAdminView: false,
        });
      }
    }

    // Hydrate names
    const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("professionals")
        .select("id, full_name, email")
        .in("id", ids);
      const map = new Map<string, { full_name: string | null; email: string | null }>();
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
        map.set(p.id, { full_name: p.full_name, email: p.email });
      }
      for (const r of rows) {
        if (r.userId && map.has(r.userId)) {
          const m = map.get(r.userId)!;
          r.userName = m.full_name;
          r.userEmail = r.userEmail ?? m.email;
        }
      }
    }

    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return rows.slice(0, data.limit);
  });

// ---------------------------------------------------------------------------
// Right-rail aggregates: top pages, referrers, devices, countries (24h)
// ---------------------------------------------------------------------------

export type Bucket = { key: string; count: number };
export type ActivityAggregates = {
  topPaths: Bucket[];
  topReferrers: Bucket[];
  byDevice: Bucket[];
  byBrowser: Bucket[];
  byCountry: Bucket[];
};

export const getActivityAggregates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ rangeHours: z.number().int().min(1).max(168).default(24) })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<ActivityAggregates> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.rangeHours * 3600_000).toISOString();

    const { data: pv } = await supabaseAdmin
      .from("page_view_events")
      .select("path, referrer, device, browser, country_code")
      .gte("created_at", since)
      .eq("is_admin_view", false)
      .limit(50_000);

    const paths = new Map<string, number>();
    const refs = new Map<string, number>();
    const devs = new Map<string, number>();
    const brs = new Map<string, number>();
    const cs = new Map<string, number>();

    for (const r of (pv ?? []) as Array<Record<string, string | null>>) {
      if (r.path) paths.set(r.path, (paths.get(r.path) ?? 0) + 1);
      const ref = r.referrer ? safeHost(r.referrer) : "(direct)";
      refs.set(ref, (refs.get(ref) ?? 0) + 1);
      const d = r.device ?? "unknown";
      devs.set(d, (devs.get(d) ?? 0) + 1);
      const b = r.browser ?? "unknown";
      brs.set(b, (brs.get(b) ?? 0) + 1);
      if (r.country_code) cs.set(r.country_code, (cs.get(r.country_code) ?? 0) + 1);
    }

    const top = (m: Map<string, number>, n = 8): Bucket[] =>
      [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([key, count]) => ({ key, count }));

    return {
      topPaths: top(paths, 10),
      topReferrers: top(refs, 8),
      byDevice: top(devs, 6),
      byBrowser: top(brs, 6),
      byCountry: top(cs, 8),
    };
  });

function safeHost(url: string): string {
  try {
    return new URL(url).hostname || "(direct)";
  } catch {
    return "(direct)";
  }
}

// ---------------------------------------------------------------------------
// Online now (sessions in last 5 minutes)
// ---------------------------------------------------------------------------

export type OnlineRow = {
  sessionId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  currentPath: string | null;
  lastSeenAt: string;
  startedAt: string;
  pagesViewed: number;
  countryCode: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  isAdminView: boolean;
};

export const getOnlineNow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OnlineRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 5 * 60_000).toISOString();

    const { data } = await supabaseAdmin
      .from("user_sessions")
      .select(
        "id, user_id, current_path, last_seen_at, started_at, pages_viewed, country_code, city, device, browser, os, is_admin_view",
      )
      .gte("last_seen_at", since)
      .order("last_seen_at", { ascending: false })
      .limit(200);

    const rows: OnlineRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
      sessionId: r.id as string,
      userId: (r.user_id as string | null) ?? null,
      userName: null,
      userEmail: null,
      currentPath: (r.current_path as string | null) ?? null,
      lastSeenAt: r.last_seen_at as string,
      startedAt: r.started_at as string,
      pagesViewed: (r.pages_viewed as number) ?? 0,
      countryCode: (r.country_code as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      device: (r.device as string | null) ?? null,
      browser: (r.browser as string | null) ?? null,
      os: (r.os as string | null) ?? null,
      isAdminView: Boolean(r.is_admin_view),
    }));

    const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("professionals")
        .select("id, full_name, email")
        .in("id", ids);
      const map = new Map<string, { full_name: string | null; email: string | null }>();
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
        map.set(p.id, { full_name: p.full_name, email: p.email });
      }
      for (const r of rows) {
        if (r.userId && map.has(r.userId)) {
          const m = map.get(r.userId)!;
          r.userName = m.full_name;
          r.userEmail = m.email;
        }
      }
    }

    return rows;
  });

// ---------------------------------------------------------------------------
// Hourly traffic sparkline (last 24h)
// ---------------------------------------------------------------------------

export type HourBucket = { hour: string; views: number; visitors: number };

export const getHourlyTraffic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HourBucket[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 3600_000);
    const { data } = await supabaseAdmin
      .from("page_view_events")
      .select("created_at, anon_id")
      .gte("created_at", since.toISOString())
      .eq("is_admin_view", false)
      .limit(100_000);

    const buckets = new Map<string, { views: number; visitors: Set<string> }>();
    // Pre-populate 24 buckets
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3600_000);
      d.setMinutes(0, 0, 0);
      buckets.set(d.toISOString(), { views: 0, visitors: new Set() });
    }
    for (const r of (data ?? []) as Array<{ created_at: string; anon_id: string }>) {
      const d = new Date(r.created_at);
      d.setMinutes(0, 0, 0);
      const k = d.toISOString();
      const b = buckets.get(k);
      if (!b) continue;
      b.views += 1;
      b.visitors.add(r.anon_id);
    }
    return [...buckets.entries()].map(([hour, b]) => ({
      hour,
      views: b.views,
      visitors: b.visitors.size,
    }));
  });
