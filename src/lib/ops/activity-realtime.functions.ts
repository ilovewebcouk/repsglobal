// Admin Activity v1.2 — realtime GA-style summary aggregations.
//
// All numbers are logged-in-member-only. Public/anonymous analytics is
// disabled in v1.2 (see docs/privacy/activity-analytics-privacy-plan.md).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SupaCtx = { supabase: unknown; userId: string };

async function assertAdmin(ctx: SupaCtx) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface RealtimeSummary {
  online_now: number;
  members_last_30min: number;
  activity_last_30min: number;
  per_minute: Array<{ minute_ago: number; count: number }>;
  devices: { mobile: number; desktop: number; tablet: number; unknown: number };
  sign_ins_today: number;
  member_views_24h: number;
  new_members_24h: number;
  generated_at: string;
  /** Amendment 1: keep source-of-truth labels visible in tooltips. */
  scope_label: string;
}

export const getRealtimeSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RealtimeSummary> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const iso5 = new Date(now - 5 * 60_000).toISOString();
    const iso30 = new Date(now - 30 * 60_000).toISOString();
    const iso24h = new Date(now - 86_400_000).toISOString();
    const isoDayStart = new Date(); isoDayStart.setHours(0, 0, 0, 0);

    const [online, active30, events30, signInsToday, views24, newMembers24] = await Promise.all([
      supabaseAdmin.from("user_sessions").select("user_id, device").gte("last_seen_at", iso5).is("ended_at", null),
      supabaseAdmin.from("user_sessions").select("user_id").gte("last_seen_at", iso30),
      supabaseAdmin.from("member_session_events").select("created_at, user_id").gte("created_at", iso30),
      supabaseAdmin.from("auth_events").select("id").eq("event", "sign_in").gte("created_at", isoDayStart.toISOString()),
      supabaseAdmin.from("member_session_events").select("id").gte("created_at", iso24h),
      supabaseAdmin.from("subscriptions").select("id").gte("created_at", iso24h),
    ]);

    const onlineRows = ((online.data ?? []) as Array<{ user_id: string | null; device: string | null }>);
    const onlineUsers = new Set(onlineRows.map((r) => r.user_id).filter(Boolean));
    const activeUsers = new Set(((active30.data ?? []) as Array<{ user_id: string | null }>).map((r) => r.user_id).filter(Boolean));

    // Per-minute buckets (last 30 min, oldest first for chart left→right)
    const eventRows = ((events30.data ?? []) as Array<{ created_at: string }>);
    const buckets = new Array(30).fill(0) as number[];
    for (const r of eventRows) {
      const minAgo = Math.floor((now - new Date(r.created_at).getTime()) / 60_000);
      if (minAgo >= 0 && minAgo < 30) buckets[29 - minAgo]++;
    }
    const perMinute = buckets.map((count, i) => ({ minute_ago: 29 - i, count }));

    // Device breakdown from currently online
    const devices = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    for (const r of onlineRows) {
      const d = (r.device ?? "").toLowerCase();
      if (d === "mobile") devices.mobile++;
      else if (d === "tablet") devices.tablet++;
      else if (d === "desktop") devices.desktop++;
      else devices.unknown++;
    }

    return {
      online_now: onlineUsers.size,
      members_last_30min: activeUsers.size,
      activity_last_30min: eventRows.length,
      per_minute: perMinute,
      devices,
      sign_ins_today: (signInsToday.data ?? []).length,
      member_views_24h: (views24.data ?? []).length,
      new_members_24h: (newMembers24.data ?? []).length,
      generated_at: new Date().toISOString(),
      scope_label: "Logged-in member activity only",
    };
  });
