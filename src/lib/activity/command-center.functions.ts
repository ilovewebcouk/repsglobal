// getActivityCommandCenter — THE single server function that powers /admin/activity.
//
// One admin-only, Supabase-only server function. No PostHog. No second live source.
// Everything the page renders (map, realtime card, online now, pages being viewed
// now) is derived from this payload so numbers cannot disagree.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LIVE_MS, RECENT_MS, formatLocationLabel, maskIp,
} from "./command-center.server";

// ─────────────────────────────────────────────────────── types (client-safe) ──

export interface PublicVisitorLive {
  journey_id: string;
  session_id: string | null;
  user_id: string | null;
  member_name: string | null;
  masked_ip: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  latest_path: string | null;
  latest_event: string | null;
  path_history: Array<{ path?: string; at?: string; event?: string }>;
  referrer: string | null;
  source: string | null;
  first_seen_at: string;
  last_seen_at: string;
  event_count: number;
  page_count: number;
  status: "live" | "recent" | "stale";
  location_label: string;
}

export interface MemberLive {
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
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  started_at: string;
  last_seen_at: string;
  location_label: string;
  status: "live" | "recent";
  tier: "member" | "public";
}

export interface PageRow {
  path: string;
  members: number;
  public: number;
  total: number;
  last_activity_at: string;
  member_avatars: Array<{ user_id: string; name: string; avatar_url: string | null }>;
}

export interface MapMarker {
  key: string;                    // dedupe key
  city: string | null;
  region: string | null;
  country_code: string;
  latitude: number;
  longitude: number;
  members: number;
  public: number;
  total: number;
}

export interface RealtimeSummarySlice {
  visitors_members_online_now: number;
  public_now: number;
  members_now: number;
  events_30m: number;
  per_minute: Array<{ minute_ago: number; count: number }>;
  peak_per_minute: number;
  devices: { mobile: number; desktop: number; tablet: number; unknown: number };
  stale: boolean;
  updated_at: string;
}

export interface CommandCenterPayload {
  last_updated: string;
  stale: boolean;
  live_now: { public: number; members: number; total: number };
  public_live: PublicVisitorLive[];
  members_live: MemberLive[];
  pages_being_viewed_now: PageRow[];
  map_markers: MapMarker[];
  realtime_summary: RealtimeSummarySlice;
  ingest: { last_journey_at: string | null; last_member_event_at: string | null };
}

// ─────────────────────────────────────────────────────── helpers ──

type Sup = { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const { data } = await (ctx.supabase as Sup).rpc("has_role", {
    _user_id: ctx.userId, _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

function statusFrom(iso: string): "live" | "recent" | "stale" {
  const age = Date.now() - new Date(iso).getTime();
  if (age < LIVE_MS) return "live";
  if (age < RECENT_MS) return "recent";
  return "stale";
}

// ─────────────────────────────────────────────────────── the function ──

export const getActivityCommandCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommandCenterPayload> => {
    await assertAdmin(context as { supabase: unknown; userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const iso5 = new Date(now - LIVE_MS).toISOString();
    const iso30 = new Date(now - RECENT_MS).toISOString();

    // Parallel read pass — all Supabase, no PostHog anywhere.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [journeys, memberSessions, memberEvents30] = await Promise.all([
      supabaseAdmin
        .from("visitor_journeys")
        .select("id, session_id, user_id, entry_referrer, source, latest_path, latest_event, page_count, event_count, path_history, first_seen_at, last_seen_at, latest_observation_id")
        .gte("last_seen_at", iso30)
        .order("last_seen_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("user_sessions")
        .select("id, user_id, current_path, device, browser, country_code, city, region, latitude, longitude, started_at, last_seen_at, ended_at")
        .gte("last_seen_at", iso30)
        .is("ended_at", null)
        .order("last_seen_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("member_session_events")
        .select("created_at, user_id, path, device")
        .gte("created_at", iso30),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const journeyRows = ((journeys.data ?? []) as any[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionRows = ((memberSessions.data ?? []) as any[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventRows = ((memberEvents30.data ?? []) as any[]);

    // Resolve latest_observation_id → observation (city / country / masked IP).
    const obsIds = journeyRows.map((j) => j.latest_observation_id).filter(Boolean) as string[];
    // Resolve profiles for signed-in visitors + members.
    const userIds = Array.from(new Set([
      ...journeyRows.map((j) => j.user_id).filter(Boolean),
      ...sessionRows.map((s) => s.user_id).filter(Boolean),
    ])) as string[];

    const [obsRes, profRes] = await Promise.all([
      obsIds.length
        ? supabaseAdmin.from("security_visitor_ip_observations")
            .select("id, raw_ip, city, region, country_code, latitude, longitude")
            .in("id", obsIds)
        : Promise.resolve({ data: [] as unknown[] }),
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obsMap = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const o of ((obsRes.data ?? []) as any[])) obsMap.set(o.id, o);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profMap = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of ((profRes.data ?? []) as any[])) profMap.set(p.id, p);

    // ── Build public_live (all recent journeys — includes signed-in via user_id).
    const public_live: PublicVisitorLive[] = journeyRows.map((j) => {
      const o = j.latest_observation_id ? obsMap.get(j.latest_observation_id) : null;
      const prof = j.user_id ? profMap.get(j.user_id) : null;
      const history = Array.isArray(j.path_history) ? j.path_history.slice(-6) : [];
      const s = statusFrom(j.last_seen_at);
      const city = o?.city ?? null;
      const region = o?.region ?? null;
      const country_code = o?.country_code ?? null;
      return {
        journey_id: j.id,
        session_id: j.session_id,
        user_id: j.user_id,
        member_name: prof?.full_name ?? prof?.email ?? null,
        masked_ip: o ? maskIp(o.raw_ip) : null,
        city, region, country_code,
        latitude: o?.latitude ?? null,
        longitude: o?.longitude ?? null,
        latest_path: j.latest_path,
        latest_event: j.latest_event,
        path_history: history,
        referrer: j.entry_referrer,
        source: j.source,
        first_seen_at: j.first_seen_at,
        last_seen_at: j.last_seen_at,
        event_count: j.event_count ?? 0,
        page_count: j.page_count ?? 0,
        status: s,
        location_label: formatLocationLabel({ city, region, country_code }),
      };
    });

    // ── Build members_live from user_sessions.
    const members_live: MemberLive[] = sessionRows.map((s) => {
      const prof = s.user_id ? profMap.get(s.user_id) : null;
      const status = statusFrom(s.last_seen_at) === "live" ? "live" : "recent";
      return {
        session_id: s.id,
        user_id: s.user_id,
        name: prof?.full_name ?? prof?.email ?? "Member",
        email: prof?.email ?? null,
        avatar_url: prof?.avatar_url ?? null,
        current_path: s.current_path,
        device: s.device,
        browser: s.browser,
        country_code: s.country_code,
        city: s.city,
        region: s.region,
        latitude: s.latitude,
        longitude: s.longitude,
        started_at: s.started_at,
        last_seen_at: s.last_seen_at,
        status,
        tier: "member",
        location_label: formatLocationLabel({
          city: s.city, region: s.region, country_code: s.country_code,
        }),
      } satisfies MemberLive;
    });

    // ── live_now counts (5-minute window only).
    const publicLiveCount = public_live.filter((v) => v.status === "live" && !v.user_id).length;
    const membersLiveCount = members_live.filter((m) => m.status === "live").length;

    // ── pages_being_viewed_now — union of member current_path and journey latest_path
    // for LIVE rows only. Zero rows never render.
    const pageMap = new Map<string, PageRow>();
    for (const m of members_live) {
      if (m.status !== "live" || !m.current_path) continue;
      const row = pageMap.get(m.current_path) ?? {
        path: m.current_path, members: 0, public: 0, total: 0,
        last_activity_at: m.last_seen_at,
        member_avatars: [],
      };
      row.members += 1; row.total += 1;
      if (m.last_seen_at > row.last_activity_at) row.last_activity_at = m.last_seen_at;
      if (m.user_id && row.member_avatars.length < 4) {
        row.member_avatars.push({
          user_id: m.user_id, name: m.name, avatar_url: m.avatar_url,
        });
      }
      pageMap.set(m.current_path, row);
    }
    for (const v of public_live) {
      if (v.status !== "live" || v.user_id || !v.latest_path) continue;
      const row = pageMap.get(v.latest_path) ?? {
        path: v.latest_path, members: 0, public: 0, total: 0,
        last_activity_at: v.last_seen_at, member_avatars: [],
      };
      row.public += 1; row.total += 1;
      if (v.last_seen_at > row.last_activity_at) row.last_activity_at = v.last_seen_at;
      pageMap.set(v.latest_path, row);
    }
    const pages_being_viewed_now = Array.from(pageMap.values())
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ── map_markers — city-level dedupe, members + public overlaid.
    const markerMap = new Map<string, MapMarker>();
    const addMarker = (
      city: string | null, region: string | null, cc: string | null,
      lat: number | null, lng: number | null, kind: "members" | "public",
    ) => {
      if (!cc || typeof lat !== "number" || typeof lng !== "number") return;
      const key = `${city ?? ""}|${cc}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
      const row = markerMap.get(key) ?? {
        key, city, region, country_code: cc,
        latitude: lat, longitude: lng, members: 0, public: 0, total: 0,
      };
      row[kind] += 1; row.total += 1;
      markerMap.set(key, row);
    };
    for (const m of members_live) {
      if (m.status !== "live") continue;
      addMarker(m.city, m.region, m.country_code, m.latitude, m.longitude, "members");
    }
    for (const v of public_live) {
      if (v.status !== "live" || v.user_id) continue;
      addMarker(v.city, v.region, v.country_code, v.latitude, v.longitude, "public");
    }
    const map_markers = Array.from(markerMap.values()).sort((a, b) => b.total - a.total);

    // ── realtime_summary — the KEPT card feeds off this slice.
    const buckets = new Array(30).fill(0) as number[];
    for (const e of eventRows) {
      const minAgo = Math.floor((now - new Date(e.created_at).getTime()) / 60_000);
      if (minAgo >= 0 && minAgo < 30) buckets[29 - minAgo]++;
    }
    // Add public journey activity into the same per-minute chart.
    for (const j of journeyRows) {
      const minAgo = Math.floor((now - new Date(j.last_seen_at).getTime()) / 60_000);
      if (minAgo >= 0 && minAgo < 30) buckets[29 - minAgo]++;
    }
    const per_minute = buckets.map((count, i) => ({ minute_ago: 29 - i, count }));
    const peak_per_minute = Math.max(1, ...buckets);

    // Devices: union of member sessions currently live + public journey UAs is
    // more work than the card needs — keep the card scoped to member sessions,
    // matching the previous behaviour.
    const devices = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    for (const s of sessionRows) {
      if (statusFrom(s.last_seen_at) !== "live") continue;
      const d = String(s.device ?? "").toLowerCase();
      if (d === "mobile") devices.mobile++;
      else if (d === "tablet") devices.tablet++;
      else if (d === "desktop") devices.desktop++;
      else devices.unknown++;
    }

    const lastJourneyAt = journeyRows[0]?.last_seen_at ?? null;
    const lastMemberEventAt = eventRows[0]?.created_at ?? null;
    const newestLiveTs = [lastJourneyAt, lastMemberEventAt]
      .filter(Boolean)
      .sort()
      .slice(-1)[0] ?? null;
    const stale = !newestLiveTs || Date.now() - new Date(newestLiveTs).getTime() > LIVE_MS;

    const generated_at = new Date().toISOString();
    return {
      last_updated: generated_at,
      stale,
      live_now: {
        public: publicLiveCount,
        members: membersLiveCount,
        total: publicLiveCount + membersLiveCount,
      },
      public_live,
      members_live,
      pages_being_viewed_now,
      map_markers,
      realtime_summary: {
        visitors_members_online_now: publicLiveCount + membersLiveCount,
        public_now: publicLiveCount,
        members_now: membersLiveCount,
        events_30m: eventRows.length + journeyRows.length,
        per_minute,
        peak_per_minute,
        devices,
        stale,
        updated_at: generated_at,
      },
      ingest: {
        last_journey_at: lastJourneyAt,
        last_member_event_at: lastMemberEventAt,
      },
    };
  });
