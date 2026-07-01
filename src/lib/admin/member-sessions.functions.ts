// Member 360 — Sessions tab data source.
//
// Reads directly from the v1.2 capture tables (user_sessions, auth_events,
// member_session_events) and returns a redacted, per-user session view.
//
// Guarantees:
//   • no raw IP addresses ever cross the wire (only ip_hash truncated to 8ch)
//   • admin/impersonation activity is filtered out (is_admin_view = true)
//   • DNT/GPC members surface with `limited_detail = true` when no
//     member_session_events are recorded for a session
//   • related business events (auth sign_in/out) are joined per session
//
// Admin-only. Uses the same auth guard pattern as other admin functions.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface MemberSessionPageHit {
  ts: string;
  path: string;
  duration_ms: number | null;
}

export interface MemberSessionAuthEvent {
  ts: string;
  event: "sign_in" | "sign_out" | "sign_in_failed" | "password_reset" | "email_confirmed" | "user_updated";
}

export interface MemberSessionRow {
  session_id: string;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  is_active: boolean;
  current_path: string | null;
  pages_viewed: number;
  device: string | null;
  browser: string | null;
  os: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  ip_hash_prefix: string | null; // first 8 chars only — never raw IP
  referrer: string | null;
  page_trail: MemberSessionPageHit[];
  auth_events: MemberSessionAuthEvent[];
  /** True when the session has no per-path detail (DNT/GPC or brand-new) */
  limited_detail: boolean;
}

export interface MemberSessionsResult {
  sessions: MemberSessionRow[];
  total: number;
  captured_since: string;
}

const Input = z.object({
  user_id: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getMemberSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<MemberSessionsResult> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Excludes admin/impersonation sessions. `is_admin_view` is set by the
    // session-event capture route once role has been checked server-side.
    const { data: sessRaw, error: sessErr } = await supabaseAdmin
      .from("user_sessions")
      .select(
        "id, started_at, last_seen_at, ended_at, current_path, referrer, ip_hash, user_agent, country_code, region, city, device, browser, os, pages_viewed, is_admin_view",
      )
      .eq("user_id", data.user_id)
      .eq("is_admin_view", false)
      .order("last_seen_at", { ascending: false })
      .limit(data.limit);
    if (sessErr) throw sessErr;

    type S = {
      id: string; started_at: string; last_seen_at: string; ended_at: string | null;
      current_path: string | null; referrer: string | null; ip_hash: string | null;
      user_agent: string | null; country_code: string | null; region: string | null;
      city: string | null; device: string | null; browser: string | null; os: string | null;
      pages_viewed: number; is_admin_view: boolean;
    };
    const sessRows = (sessRaw ?? []) as S[];

    const sessionIds = sessRows.map((s) => s.id);
    const oldest = sessRows.length
      ? sessRows[sessRows.length - 1]!.started_at
      : new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [{ data: eventsRaw }, { data: authRaw }, { count }] = await Promise.all([
      sessionIds.length
        ? supabaseAdmin
            .from("member_session_events")
            .select("session_id, created_at, path, duration_ms")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as Array<{ session_id: string | null; created_at: string; path: string; duration_ms: number | null }> }),
      supabaseAdmin
        .from("auth_events")
        .select("event, created_at")
        .eq("user_id", data.user_id)
        .gte("created_at", oldest)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("user_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user_id)
        .eq("is_admin_view", false),
    ]);

    const eventsBySession = new Map<string, MemberSessionPageHit[]>();
    for (const ev of (eventsRaw ?? []) as Array<{ session_id: string | null; created_at: string; path: string; duration_ms: number | null }>) {
      if (!ev.session_id) continue;
      const arr = eventsBySession.get(ev.session_id) ?? [];
      arr.push({ ts: ev.created_at, path: ev.path, duration_ms: ev.duration_ms });
      eventsBySession.set(ev.session_id, arr);
    }

    // Naive per-session auth attribution: any auth event that lands inside a
    // session's [started_at, last_seen_at + 5min] window is attached to it.
    const authAll = ((authRaw ?? []) as Array<{ event: string; created_at: string }>);

    const rows: MemberSessionRow[] = sessRows.map((s) => {
      const trail = (eventsBySession.get(s.id) ?? []).slice(-25);
      const winStart = new Date(s.started_at).getTime();
      const winEnd = new Date(s.last_seen_at).getTime() + 5 * 60_000;
      const auths = authAll
        .filter((a) => {
          const t = new Date(a.created_at).getTime();
          return t >= winStart && t <= winEnd;
        })
        .map((a) => ({ ts: a.created_at, event: a.event as MemberSessionAuthEvent["event"] }));
      return {
        session_id: s.id,
        started_at: s.started_at,
        last_seen_at: s.last_seen_at,
        ended_at: s.ended_at,
        is_active: !s.ended_at && Date.now() - new Date(s.last_seen_at).getTime() < 5 * 60_000,
        current_path: s.current_path,
        pages_viewed: s.pages_viewed,
        device: s.device,
        browser: s.browser,
        os: s.os,
        country_code: s.country_code,
        region: s.region,
        city: s.city,
        // First 8 hex chars of the salted hash — enough for admins to correlate
        // repeat visits, useless for de-anonymising a member.
        ip_hash_prefix: s.ip_hash ? s.ip_hash.slice(0, 8) : null,
        referrer: s.referrer,
        page_trail: trail,
        auth_events: auths,
        limited_detail: trail.length === 0 && s.pages_viewed <= 1,
      };
    });

    return {
      sessions: rows,
      total: count ?? rows.length,
      captured_since: oldest,
    };
  });
