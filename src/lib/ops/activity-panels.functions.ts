// Admin Activity v1.1 — focused panel server functions.
//
// Each panel has its own query with a hard time window, admin gate, and
// safeFetch degradation. Read-only. Not source-of-truth for billing or
// visibility. Timing is measured per panel and returned in the result so the
// UI can surface a partial-source warning if one panel degrades.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SupaCtx = { supabase: unknown; userId: string };

async function assertAdmin(ctx: SupaCtx) {
  const supa = ctx.supabase as {
    rpc: (n: string, p: object) => Promise<{ data: unknown }>;
  };
  const { data } = await supa.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

/** Bucket rows by ISO day string, back-filling zeros for the last `days` days. */
function sparklineFromRows(
  rows: Array<{ created_at?: string; ts?: string }>,
  days = 14,
): number[] {
  const buckets = new Map<string, number>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const iso = (r.created_at ?? r.ts ?? "").slice(0, 10);
    if (buckets.has(iso)) buckets.set(iso, (buckets.get(iso) ?? 0) + 1);
  }
  return Array.from(buckets.values());
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface KpiTileData {
  key: string;
  label: string;
  value: number;
  delta_pct: number | null;
  sparkline: number[];
  tone?: "info" | "success" | "warning" | "critical";
}

export interface OnlineNowUser {
  session_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  avatar_url: string | null;
  current_path: string | null;
  device: string | null;
  browser: string | null;
  country_code: string | null;
  city: string | null;
  started_at: string;
  last_seen_at: string;
  pages_viewed: number;
  tier: string | null;
  badges: string[];
}

export interface CurrentPageRow {
  path: string;
  online_count: number;
  avatars: Array<{ user_id: string; name: string; avatar_url: string | null }>;
  views_24h: number;
  trend_pct: number | null;
}

export interface TopPageRow {
  path: string;
  views: number;
  unique_members: number;
  last_viewed_at: string;
  trend_pct: number | null;
}

export interface GeoRow {
  country_code: string;
  online_now: number;
  page_views_24h: number;
  sign_ins_24h: number;
  share_pct: number;
}

export interface AttentionRow {
  id: string;
  source: string;
  severity: "critical" | "warning";
  title: string;
  subtitle: string | null;
  member_label: string | null;
  amount_pence: number | null;
  ts: string;
  action_label: string;
  action_url: string;
}

export interface PanelTiming {
  panel: string;
  ms: number;
  degraded: boolean;
  reason?: string;
}

async function measure<T>(
  panel: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; timing: PanelTiming }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { result, timing: { panel, ms: Date.now() - t0, degraded: false } };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    console.error(`[activity-panels] ${panel} failed`, err);
    return { result: null, timing: { panel, ms: Date.now() - t0, degraded: true, reason } };
  }
}

// ────────────────────────────────────────────────────────────── KPI STRIP ──

export const getActivityKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tiles: KpiTileData[]; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { result, timing } = await measure("getActivityKpis", async () => {
      const now = Date.now();
      const day = 86_400_000;
      const iso14 = new Date(now - 14 * day).toISOString();
      const iso24 = new Date(now - day).toISOString();
      const iso48 = new Date(now - 2 * day).toISOString();
      const iso5min = new Date(now - 5 * 60_000).toISOString();

      const [
        online, sessions14, auth14, sessionEvents14,
        subs14, payFail24, payFailPrev, disputes24,
      ] = await Promise.all([
        supabaseAdmin.from("user_sessions").select("user_id").gte("last_seen_at", iso5min).is("ended_at", null),
        supabaseAdmin.from("user_sessions").select("started_at").gte("started_at", iso14),
        supabaseAdmin.from("auth_events").select("created_at, event").gte("created_at", iso14),
        supabaseAdmin.from("member_session_events").select("created_at").gte("created_at", iso14),
        supabaseAdmin.from("subscriptions").select("id, created_at, status").gte("created_at", iso14),
        supabaseAdmin.from("payment_events").select("id").gte("created_at", iso24).ilike("event_type", "%failed%"),
        supabaseAdmin.from("payment_events").select("id").gte("created_at", iso48).lt("created_at", iso24).ilike("event_type", "%failed%"),
        supabaseAdmin.from("disputes").select("id, opened_at").gte("opened_at", iso14),
      ]);

      const onlineCount = new Set(((online.data ?? []) as Array<{ user_id: string | null }>).map((r) => r.user_id).filter(Boolean)).size;
      const activeSessionsToday = ((sessions14.data ?? []) as Array<{ started_at: string }>).filter((r) => r.started_at >= iso24).length;
      const memberViews24 = ((sessionEvents14.data ?? []) as Array<{ created_at: string }>).filter((r) => r.created_at >= iso24).length;
      const memberViewsPrev = ((sessionEvents14.data ?? []) as Array<{ created_at: string }>).filter((r) => r.created_at >= iso48 && r.created_at < iso24).length;
      const signInsToday = ((auth14.data ?? []) as Array<{ created_at: string; event: string }>).filter((r) => r.created_at >= iso24 && r.event === "sign_in").length;
      const signInsPrev = ((auth14.data ?? []) as Array<{ created_at: string; event: string }>).filter((r) => r.created_at >= iso48 && r.created_at < iso24 && r.event === "sign_in").length;
      const newMembers24 = ((subs14.data ?? []) as Array<{ created_at: string }>).filter((r) => r.created_at >= iso24).length;
      const newMembersPrev = ((subs14.data ?? []) as Array<{ created_at: string }>).filter((r) => r.created_at >= iso48 && r.created_at < iso24).length;
      const failed24 = (payFail24.data ?? []).length;
      const failedPrev = (payFailPrev.data ?? []).length;
      const disputes24Count = ((disputes24.data ?? []) as Array<{ opened_at: string }>).filter((r) => r.opened_at >= iso24).length;

      const signInRows = ((auth14.data ?? []) as Array<{ created_at: string; event: string }>).filter((r) => r.event === "sign_in");
      const newMemberRows = ((subs14.data ?? []) as Array<{ created_at: string }>);

      const tiles: KpiTileData[] = [
        { key: "online_now", label: "Online now", value: onlineCount, delta_pct: null, sparkline: [], tone: "success" },
        { key: "active_sessions", label: "Active sessions 24h", value: activeSessionsToday, delta_pct: null, sparkline: sparklineFromRows(((sessions14.data ?? []) as Array<{ started_at: string }>).map((r) => ({ created_at: r.started_at }))) },
        { key: "member_views", label: "Member page views 24h", value: memberViews24, delta_pct: pctDelta(memberViews24, memberViewsPrev), sparkline: sparklineFromRows((sessionEvents14.data ?? []) as Array<{ created_at: string }>) },
        { key: "sign_ins", label: "Sign-ins today", value: signInsToday, delta_pct: pctDelta(signInsToday, signInsPrev), sparkline: sparklineFromRows(signInRows) },
        { key: "new_members", label: "New members 24h", value: newMembers24, delta_pct: pctDelta(newMembers24, newMembersPrev), sparkline: sparklineFromRows(newMemberRows), tone: "success" },
        { key: "high_value", label: "High-value events today", value: newMembers24 + disputes24Count, delta_pct: null, sparkline: [] },
        { key: "failed_payments", label: "Failed payments 24h", value: failed24, delta_pct: pctDelta(failed24, failedPrev), sparkline: [], tone: failed24 > 0 ? "warning" : "info" },
        { key: "disputes_open", label: "Open disputes", value: disputes24Count, delta_pct: null, sparkline: [], tone: disputes24Count > 0 ? "critical" : "info" },
      ];
      return tiles;
    });

    return { tiles: result ?? [], timing };
  });

// ────────────────────────────────────────────────────────────── ONLINE NOW ──

export const getOnlineNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ users: OnlineNowUser[]; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { result, timing } = await measure("getOnlineNow", async () => {
      const iso5min = new Date(Date.now() - 5 * 60_000).toISOString();
      const iso30min = new Date(Date.now() - 30 * 60_000).toISOString();
      const { data: sessions, error } = await supabaseAdmin
        .from("user_sessions")
        .select("id, user_id, started_at, last_seen_at, current_path, device, browser, country_code, city, pages_viewed")
        .gte("last_seen_at", iso30min)
        .is("ended_at", null)
        .order("last_seen_at", { ascending: false })
        .limit(data.limit);
      if (error) throw error;
      const rows = (sessions ?? []) as Array<{
        id: string; user_id: string | null; started_at: string; last_seen_at: string;
        current_path: string | null; device: string | null; browser: string | null;
        country_code: string | null; city: string | null; pages_viewed: number;
      }>;
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((x): x is string => Boolean(x))));
      const [profilesRes, subsRes] = await Promise.all([
        userIds.length ? supabaseAdmin.from("profiles").select("id, full_name, display_name, avatar_url, email").in("id", userIds) : Promise.resolve({ data: [] as unknown[] }),
        userIds.length ? supabaseAdmin.from("subscriptions").select("user_id, tier, status, created_at").in("user_id", userIds) : Promise.resolve({ data: [] as unknown[] }),
      ]);
      const pMap = new Map<string, { name: string; email: string | null; avatar_url: string | null }>();
      for (const p of (profilesRes.data ?? []) as Array<{ id: string; full_name: string | null; display_name: string | null; avatar_url: string | null; email: string | null }>) {
        pMap.set(p.id, { name: p.full_name || p.display_name || p.id.slice(0, 8), email: p.email, avatar_url: p.avatar_url });
      }
      const sMap = new Map<string, { tier: string | null; created_at: string }>();
      for (const s of (subsRes.data ?? []) as Array<{ user_id: string; tier: string | null; created_at: string }>) {
        sMap.set(s.user_id, { tier: s.tier, created_at: s.created_at });
      }
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      return rows.map<OnlineNowUser>((r) => {
        const p = r.user_id ? pMap.get(r.user_id) : undefined;
        const s = r.user_id ? sMap.get(r.user_id) : undefined;
        const isOnline = r.last_seen_at >= iso5min;
        const isLong = Date.now() - new Date(r.started_at).getTime() > 45 * 60_000;
        const isNew = s && s.created_at >= sevenDaysAgo;
        const badges = [
          isOnline ? "Online" : "Idle",
          ...(isLong ? ["Long session"] : []),
          ...(isNew ? ["New member"] : []),
        ];
        return {
          session_id: r.id,
          user_id: r.user_id,
          name: p?.name ?? "Anonymous session",
          email: p?.email ?? null,
          avatar_url: p?.avatar_url ?? null,
          current_path: r.current_path,
          device: r.device,
          browser: r.browser,
          country_code: r.country_code,
          city: r.city,
          started_at: r.started_at,
          last_seen_at: r.last_seen_at,
          pages_viewed: r.pages_viewed ?? 0,
          tier: s?.tier ?? null,
          badges,
        };
      });
    });
    return { users: result ?? [], timing };
  });

// ────────────────────────────────────────────────────────── CURRENT PAGES ──

export const getCurrentPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(15) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ pages: CurrentPageRow[]; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { result, timing } = await measure("getCurrentPages", async () => {
      const iso5min = new Date(Date.now() - 5 * 60_000).toISOString();
      const iso24 = new Date(Date.now() - 86_400_000).toISOString();
      const iso48 = new Date(Date.now() - 2 * 86_400_000).toISOString();
      const [liveRes, views24Res, views48Res] = await Promise.all([
        supabaseAdmin.from("user_sessions").select("user_id, current_path").gte("last_seen_at", iso5min).is("ended_at", null).not("current_path", "is", null),
        supabaseAdmin.from("member_session_events").select("path, user_id").gte("created_at", iso24),
        supabaseAdmin.from("member_session_events").select("path").gte("created_at", iso48).lt("created_at", iso24),
      ]);
      const live = (liveRes.data ?? []) as Array<{ user_id: string | null; current_path: string | null }>;
      const views24 = (views24Res.data ?? []) as Array<{ path: string; user_id: string | null }>;
      const views48 = (views48Res.data ?? []) as Array<{ path: string }>;

      const perPage = new Map<string, { online: Set<string>; views24: number; views48: number }>();
      for (const r of live) {
        const path = r.current_path ?? "";
        if (!path) continue;
        const b = perPage.get(path) ?? { online: new Set(), views24: 0, views48: 0 };
        if (r.user_id) b.online.add(r.user_id);
        perPage.set(path, b);
      }
      for (const r of views24) {
        const b = perPage.get(r.path) ?? { online: new Set(), views24: 0, views48: 0 };
        b.views24++;
        perPage.set(r.path, b);
      }
      for (const r of views48) {
        const b = perPage.get(r.path) ?? { online: new Set(), views24: 0, views48: 0 };
        b.views48++;
        perPage.set(r.path, b);
      }

      const allUserIds = Array.from(new Set(live.map((r) => r.user_id).filter((x): x is string => Boolean(x))));
      const profilesRes = allUserIds.length
        ? await supabaseAdmin.from("profiles").select("id, full_name, display_name, avatar_url").in("id", allUserIds)
        : { data: [] as unknown[] };
      const pMap = new Map<string, { name: string; avatar_url: string | null }>();
      for (const p of (profilesRes.data ?? []) as Array<{ id: string; full_name: string | null; display_name: string | null; avatar_url: string | null }>) {
        pMap.set(p.id, { name: p.full_name || p.display_name || p.id.slice(0, 8), avatar_url: p.avatar_url });
      }

      const rows: CurrentPageRow[] = Array.from(perPage.entries()).map(([path, b]) => {
        const avatars = Array.from(b.online).slice(0, 4).map((uid) => {
          const p = pMap.get(uid);
          return { user_id: uid, name: p?.name ?? uid.slice(0, 8), avatar_url: p?.avatar_url ?? null };
        });
        return {
          path,
          online_count: b.online.size,
          avatars,
          views_24h: b.views24,
          trend_pct: pctDelta(b.views24, b.views48),
        };
      });
      rows.sort((a, b) => b.online_count - a.online_count || b.views_24h - a.views_24h);
      return rows.slice(0, data.limit);
    });
    return { pages: result ?? [], timing };
  });

// ─────────────────────────────────────────────────────── TOP MEMBER PAGES ──

export const getTopMemberPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(15) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ pages: TopPageRow[]; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { result, timing } = await measure("getTopMemberPages", async () => {
      const iso24 = new Date(Date.now() - 86_400_000).toISOString();
      const iso48 = new Date(Date.now() - 2 * 86_400_000).toISOString();
      const [cur, prev] = await Promise.all([
        supabaseAdmin.from("member_session_events").select("path, user_id, created_at").gte("created_at", iso24),
        supabaseAdmin.from("member_session_events").select("path").gte("created_at", iso48).lt("created_at", iso24),
      ]);
      const curRows = (cur.data ?? []) as Array<{ path: string; user_id: string | null; created_at: string }>;
      const prevRows = (prev.data ?? []) as Array<{ path: string }>;
      const bucket = new Map<string, { views: number; users: Set<string>; last: string; prev: number }>();
      for (const r of curRows) {
        const b = bucket.get(r.path) ?? { views: 0, users: new Set(), last: r.created_at, prev: 0 };
        b.views++;
        if (r.user_id) b.users.add(r.user_id);
        if (r.created_at > b.last) b.last = r.created_at;
        bucket.set(r.path, b);
      }
      for (const r of prevRows) {
        const b = bucket.get(r.path) ?? { views: 0, users: new Set(), last: "", prev: 0 };
        b.prev++;
        bucket.set(r.path, b);
      }
      const rows: TopPageRow[] = Array.from(bucket.entries()).map(([path, b]) => ({
        path,
        views: b.views,
        unique_members: b.users.size,
        last_viewed_at: b.last,
        trend_pct: pctDelta(b.views, b.prev),
      }));
      rows.sort((a, b) => b.views - a.views);
      return rows.slice(0, data.limit);
    });
    return { pages: result ?? [], timing };
  });

// ────────────────────────────────────────────────────────── GEO ACTIVITY ──

export const getGeoActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ countries: GeoRow[]; total_views: number; total_online: number; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { result, timing } = await measure("getGeoActivity", async () => {
      const iso5min = new Date(Date.now() - 5 * 60_000).toISOString();
      const iso24 = new Date(Date.now() - 86_400_000).toISOString();
      const [online, views, signins] = await Promise.all([
        supabaseAdmin.from("user_sessions").select("country_code, user_id").gte("last_seen_at", iso5min).is("ended_at", null),
        supabaseAdmin.from("member_session_events").select("country_code").gte("created_at", iso24),
        supabaseAdmin.from("auth_events").select("country_code, event").gte("created_at", iso24).eq("event", "sign_in"),
      ]);
      const bucket = new Map<string, { online: Set<string>; views: number; signins: number }>();
      for (const r of ((online.data ?? []) as Array<{ country_code: string | null; user_id: string | null }>)) {
        const cc = r.country_code ?? "??";
        const b = bucket.get(cc) ?? { online: new Set(), views: 0, signins: 0 };
        if (r.user_id) b.online.add(r.user_id);
        bucket.set(cc, b);
      }
      for (const r of ((views.data ?? []) as Array<{ country_code: string | null }>)) {
        const cc = r.country_code ?? "??";
        const b = bucket.get(cc) ?? { online: new Set(), views: 0, signins: 0 };
        b.views++;
        bucket.set(cc, b);
      }
      for (const r of ((signins.data ?? []) as Array<{ country_code: string | null }>)) {
        const cc = r.country_code ?? "??";
        const b = bucket.get(cc) ?? { online: new Set(), views: 0, signins: 0 };
        b.signins++;
        bucket.set(cc, b);
      }
      const totalViews = Array.from(bucket.values()).reduce((a, b) => a + b.views, 0) || 1;
      const rows: GeoRow[] = Array.from(bucket.entries()).map(([cc, b]) => ({
        country_code: cc,
        online_now: b.online.size,
        page_views_24h: b.views,
        sign_ins_24h: b.signins,
        share_pct: Math.round((b.views / totalViews) * 100),
      }));
      rows.sort((a, b) => b.online_now - a.online_now || b.page_views_24h - a.page_views_24h);
      return { rows, totalViews, totalOnline: Array.from(bucket.values()).reduce((a, b) => a + b.online.size, 0) };
    });
    return {
      countries: result?.rows ?? [],
      total_views: result?.totalViews ?? 0,
      total_online: result?.totalOnline ?? 0,
      timing,
    };
  });

// ────────────────────────────────────────────────────── NEEDS ATTENTION ──

export const getNeedsAttention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: AttentionRow[]; timing: PanelTiming }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { result, timing } = await measure("getNeedsAttention", async () => {
      const iso48 = new Date(Date.now() - 2 * 86_400_000).toISOString();
      const iso7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const iso15m = new Date(Date.now() - 15 * 60_000).toISOString();

      const [disputes, failed, support, verif, failedAuth] = await Promise.all([
        supabaseAdmin.from("disputes").select("id, user_id, status, reason, amount_pence, opened_at").in("status", ["needs_response", "warning_needs_response", "under_review", "warning_under_review"]).order("opened_at", { ascending: false }).limit(20),
        supabaseAdmin.from("payment_events").select("id, user_id, event_type, created_at, payload").ilike("event_type", "%failed%").gte("created_at", iso48).order("created_at", { ascending: false }).limit(20),
        supabaseAdmin.from("support_tickets").select("id, ticket_number, subject, status, priority, requester_user_id, requester_name, last_message_at, created_at").in("status", ["open", "pending", "waiting_customer", "new"]).order("last_message_at", { ascending: false, nullsFirst: false }).limit(20),
        supabaseAdmin.from("verification_submissions").select("id, professional_id, status, created_at").in("status", ["under_review", "pending", "submitted"]).order("created_at", { ascending: false }).limit(20),
        supabaseAdmin.from("auth_events").select("user_id, email, created_at").eq("event", "sign_in_failed").gte("created_at", iso15m),
      ]);

      const disputeRows = ((disputes.data ?? []) as Array<{ id: string; user_id: string | null; status: string; reason: string | null; amount_pence: number | null; opened_at: string }>);
      const failedRows = ((failed.data ?? []) as Array<{ id: string; user_id: string | null; event_type: string; created_at: string; payload: unknown }>);
      const supportRows = ((support.data ?? []) as Array<{ id: string; ticket_number: string | number | null; subject: string; status: string; priority: string | null; requester_user_id: string | null; requester_name: string | null; last_message_at: string | null; created_at: string }>);
      const verifRows = ((verif.data ?? []) as Array<{ id: string; professional_id: string; status: string; created_at: string }>);
      const failedAuthRows = ((failedAuth.data ?? []) as Array<{ user_id: string | null; email: string | null; created_at: string }>);

      const userIds = Array.from(new Set([
        ...disputeRows.map((r) => r.user_id),
        ...failedRows.map((r) => r.user_id),
        ...supportRows.map((r) => r.requester_user_id),
        ...verifRows.map((r) => r.professional_id),
      ].filter((x): x is string => Boolean(x))));
      const profilesRes = userIds.length
        ? await supabaseAdmin.from("profiles").select("id, full_name, display_name").in("id", userIds)
        : { data: [] as unknown[] };
      const pMap = new Map<string, string>();
      for (const p of (profilesRes.data ?? []) as Array<{ id: string; full_name: string | null; display_name: string | null }>) {
        pMap.set(p.id, p.full_name || p.display_name || p.id.slice(0, 8));
      }
      void iso7d;

      const rows: AttentionRow[] = [];

      for (const d of disputeRows) {
        rows.push({
          id: `dispute:${d.id}`,
          source: "dispute",
          severity: "critical",
          title: "Open dispute",
          subtitle: d.reason,
          member_label: d.user_id ? pMap.get(d.user_id) ?? null : null,
          amount_pence: d.amount_pence,
          ts: d.opened_at,
          action_label: "Open dispute",
          action_url: `/admin/billing/disputes/${d.id}`,
        });
      }
      for (const f of failedRows) {
        const amount = (f.payload as { data?: { object?: { amount?: number } } } | null)?.data?.object?.amount ?? null;
        rows.push({
          id: `payfail:${f.id}`,
          source: "payment",
          severity: "warning",
          title: "Failed payment",
          subtitle: f.event_type,
          member_label: f.user_id ? pMap.get(f.user_id) ?? null : null,
          amount_pence: amount,
          ts: f.created_at,
          action_label: f.user_id ? "Open Member 360" : "Open Billing",
          action_url: f.user_id ? `/admin/members/${f.user_id}` : `/admin/billing`,
        });
      }
      for (const s of supportRows) {
        rows.push({
          id: `support:${s.id}`,
          source: "support",
          severity: s.priority === "urgent" || s.priority === "high" ? "critical" : "warning",
          title: `Support · ${s.subject ?? "Ticket"}`,
          subtitle: s.status,
          member_label: s.requester_user_id ? pMap.get(s.requester_user_id) ?? s.requester_name : s.requester_name,
          amount_pence: null,
          ts: s.last_message_at ?? s.created_at,
          action_label: "Open support",
          action_url: `/admin/support/${s.id}`,
        });
      }
      for (const v of verifRows) {
        rows.push({
          id: `verif:${v.id}`,
          source: "verification",
          severity: "warning",
          title: "Verification pending",
          subtitle: v.status,
          member_label: pMap.get(v.professional_id) ?? null,
          amount_pence: null,
          ts: v.created_at,
          action_label: "Open verification",
          action_url: `/admin/members/${v.professional_id}?tab=verification`,
        });
      }
      // Repeated failed sign-ins: group by user/email within 15 min
      const failGroup = new Map<string, number>();
      for (const a of failedAuthRows) {
        const k = a.user_id ?? a.email ?? "unknown";
        failGroup.set(k, (failGroup.get(k) ?? 0) + 1);
      }
      for (const [k, count] of failGroup) {
        if (count < 3) continue;
        rows.push({
          id: `authfail:${k}`,
          source: "auth",
          severity: "warning",
          title: `Repeated failed sign-in · ${count} in 15 min`,
          subtitle: k,
          member_label: pMap.get(k) ?? k,
          amount_pence: null,
          ts: new Date().toISOString(),
          action_label: k.length === 36 ? "Open Member 360" : "Open Billing",
          action_url: k.length === 36 ? `/admin/members/${k}` : `/admin/billing`,
        });
      }

      rows.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
        return a.ts < b.ts ? 1 : -1;
      });
      return rows.slice(0, 30);
    });
    return { rows: result ?? [], timing };
  });

// ─────────────────────────────────────────────────────── SESSION TRAIL ──

export interface SessionTrailEvent {
  ts: string;
  path: string;
  duration_ms: number | null;
  referrer: string | null;
}

export const getSessionTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid().optional(), user_id: z.string().uuid().optional(), limit: z.number().int().min(1).max(200).default(50) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ events: SessionTrailEvent[] }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("member_session_events")
      .select("created_at, path, duration_ms, referrer")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.session_id) query = query.eq("session_id", data.session_id);
    else if (data.user_id) query = query.eq("user_id", data.user_id);
    else return { events: [] };
    const { data: rows, error } = await query;
    if (error) throw error;
    return {
      events: ((rows ?? []) as Array<{ created_at: string; path: string; duration_ms: number | null; referrer: string | null }>).map((r) => ({
        ts: r.created_at, path: r.path, duration_ms: r.duration_ms, referrer: r.referrer,
      })),
    };
  });

// ─────────────────────────────────────────────────────── EVENT DETAIL ──

export interface EventDetail {
  source: string;
  id: string;
  ts: string;
  summary: string;
  member: { user_id: string; name: string; email: string | null; avatar_url: string | null } | null;
  metadata: Record<string, unknown>;
  stripe_url: string | null;
  related_url: string | null;
}

export const getActivityEventDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ source: z.string(), id: z.string() }).parse(d))
  .handler(async ({ data, context }): Promise<EventDetail | null> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tableMap: Record<string, { table: string; ts: string; userCol?: string; url?: (id: string) => string; stripe?: (row: Record<string, unknown>) => string | null }> = {
      payment: { table: "payment_events", ts: "created_at", userCol: "user_id" },
      dispute: { table: "disputes", ts: "opened_at", userCol: "user_id", url: (id) => `/admin/billing/disputes/${id}` },
      subscription: { table: "subscriptions", ts: "updated_at", userCol: "user_id" },
      auth: { table: "auth_events", ts: "created_at", userCol: "user_id" },
      review: { table: "reviews", ts: "created_at", userCol: "client_user_id" },
      support: { table: "support_tickets", ts: "created_at", userCol: "requester_user_id", url: (id) => `/admin/support/${id}` },
      verification: { table: "verification_decisions", ts: "created_at", userCol: "professional_id" },
      enquiry: { table: "enquiries", ts: "created_at" },
      email: { table: "email_send_log", ts: "created_at" },
      session: { table: "user_sessions", ts: "started_at", userCol: "user_id" },
    };
    const cfg = tableMap[data.source];
    if (!cfg) return null;
    const { data: row } = await supabaseAdmin.from(cfg.table).select("*").eq("id", data.id).maybeSingle();
    if (!row) return null;
    const r = row as Record<string, unknown>;
    const userId = cfg.userCol ? (r[cfg.userCol] as string | null) : null;
    let member: EventDetail["member"] = null;
    if (userId) {
      const { data: p } = await supabaseAdmin.from("profiles").select("id, full_name, display_name, avatar_url, email").eq("id", userId).maybeSingle();
      if (p) {
        const pp = p as { id: string; full_name: string | null; display_name: string | null; avatar_url: string | null; email: string | null };
        member = { user_id: pp.id, name: pp.full_name || pp.display_name || pp.id.slice(0, 8), email: pp.email, avatar_url: pp.avatar_url };
      }
    }
    return {
      source: data.source,
      id: data.id,
      ts: (r[cfg.ts] as string) ?? new Date().toISOString(),
      summary: `${data.source} · ${data.id.slice(0, 8)}`,
      member,
      metadata: r,
      stripe_url: null,
      related_url: cfg.url ? cfg.url(data.id) : (userId ? `/admin/members/${userId}` : null),
    };
  });
