// Phase UI-1 — Supabase-backed live visitor server functions.
// Admin-only. Raw IP is never returned except by revealVisitorIp (audited).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (n: string, p: object) => Promise<{ data: unknown }> }; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

function maskIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.includes(":")) {
    const parts = raw.split(":");
    return parts.slice(0, 3).join(":") + ":****";
  }
  const p = raw.split(".");
  if (p.length !== 4) return "****";
  return `${p[0]}.${p[1]}.${p[2]}.***`;
}

const STALE_MS = 5 * 60_000;

// ----------------------------------------------------------------------------
// 1. getPublicVisitorsLive
// ----------------------------------------------------------------------------
export const getPublicVisitorsLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - 30 * 60_000).toISOString();

    const { data: journeys, error } = await supabaseAdmin
      .from("visitor_journeys")
      .select("id, session_id, posthog_distinct_id, user_id, entry_path, entry_referrer, latest_path, latest_event, source, page_count, event_count, path_history, first_seen_at, last_seen_at, latest_observation_id")
      .gte("last_seen_at", sinceIso)
      .order("last_seen_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;

    const obsIds = (journeys ?? []).map((j) => j.latest_observation_id).filter(Boolean) as string[];
    const userIds = (journeys ?? []).map((j) => j.user_id).filter(Boolean) as string[];

    const [obsRes, profRes] = await Promise.all([
      obsIds.length
        ? supabaseAdmin.from("security_visitor_ip_observations")
            .select("id, raw_ip, city, region, country_code, latitude, longitude, location_source, location_confidence, user_agent, timezone")
            .in("id", obsIds)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, display_name, email").in("id", userIds)
        : Promise.resolve({ data: [] as unknown[], error: null }),
    ]);

    const obsMap = new Map<string, any>();
    for (const o of ((obsRes.data ?? []) as any[])) obsMap.set(o.id, o);
    const profMap = new Map<string, any>();
    for (const p of ((profRes.data ?? []) as any[])) profMap.set(p.id, p);

    const now = Date.now();
    return (journeys ?? []).map((j: any) => {
      const o = j.latest_observation_id ? obsMap.get(j.latest_observation_id) : null;
      const prof = j.user_id ? profMap.get(j.user_id) : null;
      const last = new Date(j.last_seen_at).getTime();
      const first = new Date(j.first_seen_at).getTime();
      const history = Array.isArray(j.path_history) ? j.path_history.slice(-6) : [];
      return {
        journey_id: j.id,
        session_id: j.session_id,
        posthog_distinct_id: j.posthog_distinct_id,
        user_id: j.user_id,
        member_name: prof?.display_name ?? prof?.email ?? null,
        masked_ip: o ? maskIp(o.raw_ip) : null,
        city: o?.city ?? null,
        region: o?.region ?? null,
        country_code: o?.country_code ?? null,
        latitude: o?.latitude ?? null,
        longitude: o?.longitude ?? null,
        location_source: o?.location_source ?? null,
        location_confidence: o?.location_confidence ?? null,
        entry_path: j.entry_path,
        latest_path: j.latest_path,
        latest_event: j.latest_event,
        path_history: history,
        event_count: j.event_count ?? 0,
        page_count: j.page_count ?? 0,
        referrer: j.entry_referrer,
        source: j.source,
        first_seen_at: j.first_seen_at,
        last_seen_at: j.last_seen_at,
        session_duration_s: Math.max(0, Math.round((last - first) / 1000)),
        status: now - last < STALE_MS ? "live" : "stale",
      };
    });
  });

// ----------------------------------------------------------------------------
// 2. getPublicVisitorDetail
// ----------------------------------------------------------------------------
export const getPublicVisitorDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ journey_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: j, error } = await supabaseAdmin
      .from("visitor_journeys")
      .select("*")
      .eq("id", data.journey_id)
      .maybeSingle();
    if (error) throw error;
    if (!j) throw new Error("Journey not found");

    const [obsRes, convRes, profRes] = await Promise.all([
      supabaseAdmin.from("security_visitor_ip_observations")
        .select("id, session_id, event_context, path, referrer, raw_ip, ip_hash, user_agent, country_code, region, city, postal_code, latitude, longitude, timezone, asn, org, location_source, location_confidence, first_seen_at, last_seen_at")
        .eq("session_id", j.session_id)
        .order("last_seen_at", { ascending: false }),
      supabaseAdmin.from("public_visitor_conversions")
        .select("id, event_kind, path, professional_id, enquiry_id, pending_signup_id, occurred_at")
        .eq("session_id", j.session_id)
        .order("occurred_at", { ascending: false }),
      j.user_id
        ? supabaseAdmin.from("profiles").select("id, display_name, email").eq("id", j.user_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const observations = ((obsRes.data ?? []) as any[]).map((o) => ({
      id: o.id,
      session_id: o.session_id,
      event_context: o.event_context,
      path: o.path,
      referrer: o.referrer,
      masked_ip: maskIp(o.raw_ip),
      ip_hash: o.ip_hash,
      user_agent: o.user_agent,
      country_code: o.country_code,
      region: o.region,
      city: o.city,
      postal_code: o.postal_code,
      latitude: o.latitude,
      longitude: o.longitude,
      timezone: o.timezone,
      asn: o.asn,
      org: o.org,
      location_source: o.location_source,
      location_confidence: o.location_confidence,
      first_seen_at: o.first_seen_at,
      last_seen_at: o.last_seen_at,
    }));

    return {
      journey: {
        id: j.id,
        session_id: j.session_id,
        posthog_distinct_id: j.posthog_distinct_id,
        user_id: j.user_id,
        entry_path: j.entry_path,
        entry_referrer: j.entry_referrer,
        latest_path: j.latest_path,
        latest_event: j.latest_event,
        source: j.source,
        page_count: j.page_count,
        event_count: j.event_count,
        path_history: j.path_history,
        event_history: j.event_history,
        first_seen_at: j.first_seen_at,
        last_seen_at: j.last_seen_at,
      },
      member: (profRes.data as any) ?? null,
      observations,
      conversions: convRes.data ?? [],
    };
  });

// ----------------------------------------------------------------------------
// 3. revealVisitorIp — audited raw IP disclosure
// ----------------------------------------------------------------------------
export const revealVisitorIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    observation_id: z.string().uuid(),
    reason: z.string().trim().min(8, "Reason must be at least 8 characters").max(500),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: obs, error } = await supabaseAdmin
      .from("security_visitor_ip_observations")
      .select("id, session_id, raw_ip, ip_hash")
      .eq("id", data.observation_id)
      .maybeSingle();
    if (error) throw error;
    if (!obs) throw new Error("Observation not found");

    // Look up related journey id (metadata only, no raw IP).
    const { data: j } = await supabaseAdmin
      .from("visitor_journeys")
      .select("id")
      .eq("session_id", obs.session_id)
      .maybeSingle();

    // Write audit row FIRST — raw IP is not stored in audit metadata.
    const { data: auditId, error: auditErr } = await (supabaseAdmin as any).rpc("log_admin_action", {
      _actor_id: (context as Ctx).userId,
      _action: "reveal_raw_ip",
      _target_table: "security_visitor_ip_observations",
      _target_id: obs.id,
      _after_state: {
        related_journey_id: j?.id ?? null,
        ip_hash: obs.ip_hash,
        session_id: obs.session_id,
      },
      _reason: data.reason,
    });
    if (auditErr) throw new Error(`Audit failed: ${auditErr.message}`);

    return {
      observation_id: obs.id,
      raw_ip: obs.raw_ip,
      audit_id: auditId as string,
    };
  });

// ----------------------------------------------------------------------------
// 4. getPublicGeoLive — MaxMind city dots from Supabase
// ----------------------------------------------------------------------------
export const getPublicGeoLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ window_minutes: z.number().int().min(1).max(1440).default(30) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - data.window_minutes * 60_000).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("security_visitor_ip_observations")
      .select("id, session_id, city, region, country_code, latitude, longitude, location_source, location_confidence, last_seen_at")
      .gte("last_seen_at", sinceIso)
      .order("last_seen_at", { ascending: false })
      .limit(1000);
    if (error) throw error;

    const cityDots: any[] = [];
    const countryOnly: Record<string, { country_code: string; count: number; last_seen_at: string }> = {};
    const seenSessions = new Set<string>();

    for (const r of (rows ?? []) as any[]) {
      if (r.session_id) seenSessions.add(r.session_id);
      const hasCity = r.city && Number.isFinite(r.latitude) && Number.isFinite(r.longitude);
      if (hasCity) {
        cityDots.push({
          observation_id: r.id,
          session_id: r.session_id,
          city: r.city,
          region: r.region,
          country_code: r.country_code,
          latitude: r.latitude,
          longitude: r.longitude,
          location_source: r.location_source,
          location_confidence: r.location_confidence,
          last_seen_at: r.last_seen_at,
        });
      } else if (r.country_code) {
        const c = countryOnly[r.country_code] ??= { country_code: r.country_code, count: 0, last_seen_at: r.last_seen_at };
        c.count += 1;
        if (r.last_seen_at > c.last_seen_at) c.last_seen_at = r.last_seen_at;
      }
    }

    return {
      city_dots: cityDots,
      country_fallback: Object.values(countryOnly),
      online_sessions: seenSessions.size,
      total_observations: rows?.length ?? 0,
    };
  });

// ----------------------------------------------------------------------------
// 5. getPublicConversionsLive
// ----------------------------------------------------------------------------
export const getPublicConversionsLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("public_visitor_conversions")
      .select("id, event_kind, session_id, posthog_distinct_id, professional_id, path, referrer, country_code, device, browser, occurred_at, created_at")
      .order("occurred_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

// ----------------------------------------------------------------------------
// 6. getPublicIngestHealth
// ----------------------------------------------------------------------------
export const getPublicIngestHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - 60 * 60_000).toISOString();

    const [diag, lastObs, lastJourney, lastConv, phState] = await Promise.all([
      supabaseAdmin.from("proxy_ingest_diagnostics")
        .select("created_at, result, journey_result, error_code, error_message")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("security_visitor_ip_observations").select("last_seen_at").order("last_seen_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("visitor_journeys").select("last_seen_at").order("last_seen_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("public_visitor_conversions").select("occurred_at").order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("public_analytics_ingest_state").select("*").order("last_run_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const diagRows = ((diag.data ?? []) as any[]);
    const total = diagRows.length;
    const obsOk = diagRows.filter((r) => r.result === "ok").length;
    const jOk = diagRows.filter((r) => r.journey_result === "ok").length;
    const lastError = diagRows.find((r) => r.error_code) ?? null;

    const now = Date.now();
    const staleLive = (ts?: string | null) => (ts ? now - new Date(ts).getTime() > STALE_MS : true);

    const lastObsAt = (lastObs.data as any)?.last_seen_at ?? null;
    const lastJourneyAt = (lastJourney.data as any)?.last_seen_at ?? null;
    const lastProxyAt = diagRows[0]?.created_at ?? null;
    const lastConvAt = (lastConv.data as any)?.occurred_at ?? null;

    return {
      supabase_live: {
        last_proxy_event_at: lastProxyAt,
        last_observation_at: lastObsAt,
        last_journey_at: lastJourneyAt,
        last_conversion_at: lastConvAt,
        obs_ok_rate: total ? Math.round((obsOk / total) * 100) : null,
        journey_ok_rate: total ? Math.round((jOk / total) * 100) : null,
        diagnostics_sample_size: total,
        last_error: lastError ? { code: lastError.error_code, message: lastError.error_message, at: lastError.created_at } : null,
        stale: staleLive(lastProxyAt) || staleLive(lastObsAt),
      },
      posthog_rollup: {
        last_run_at: (phState.data as any)?.last_run_at ?? null,
        last_status: (phState.data as any)?.last_status ?? null,
        last_error: (phState.data as any)?.last_error ?? null,
        last_pulled_date: (phState.data as any)?.last_pulled_date ?? null,
      },
    };
  });

// ----------------------------------------------------------------------------
// 7. getMemberLinkedJourneys — for Member 360 (read-only, does not mutate 360)
// ----------------------------------------------------------------------------
export const getMemberLinkedJourneys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid(), limit: z.number().int().min(1).max(100).default(25) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: journeys, error } = await supabaseAdmin
      .from("visitor_journeys")
      .select("id, session_id, entry_path, latest_path, latest_event, page_count, event_count, first_seen_at, last_seen_at, latest_observation_id")
      .eq("user_id", data.user_id)
      .order("last_seen_at", { ascending: false })
      .limit(data.limit);
    if (error) throw error;

    const obsIds = (journeys ?? []).map((j: any) => j.latest_observation_id).filter(Boolean) as string[];
    const obsRes = obsIds.length
      ? await supabaseAdmin.from("security_visitor_ip_observations")
          .select("id, raw_ip, city, region, country_code, latitude, longitude, user_agent, location_source, location_confidence")
          .in("id", obsIds)
      : { data: [] as unknown[] };

    const obsMap = new Map<string, any>();
    for (const o of ((obsRes.data ?? []) as any[])) obsMap.set(o.id, o);

    return (journeys ?? []).map((j: any) => {
      const o = j.latest_observation_id ? obsMap.get(j.latest_observation_id) : null;
      return {
        journey_id: j.id,
        session_id: j.session_id,
        entry_path: j.entry_path,
        latest_path: j.latest_path,
        latest_event: j.latest_event,
        page_count: j.page_count,
        event_count: j.event_count,
        first_seen_at: j.first_seen_at,
        last_seen_at: j.last_seen_at,
        masked_ip: o ? maskIp(o.raw_ip) : null,
        city: o?.city ?? null,
        region: o?.region ?? null,
        country_code: o?.country_code ?? null,
        latitude: o?.latitude ?? null,
        longitude: o?.longitude ?? null,
        user_agent: o?.user_agent ?? null,
        location_source: o?.location_source ?? null,
        location_confidence: o?.location_confidence ?? null,
      };
    });
  });
