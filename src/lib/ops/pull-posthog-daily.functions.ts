// PostHog → Supabase daily rollup.
//
// Called by a pg_cron job hitting /api/public/cron/pull-posthog-daily
// once per day at 04:00 UTC. Reads yesterday's events from PostHog's
// HogQL query API, aggregates them, and upserts one row into
// public.metrics_daily_public_analytics for the target date.
//
// Idempotent: re-running for the same date replaces the row.

import { createServerFn } from "@tanstack/react-start";

const POSTHOG_HOST = "https://eu.posthog.com";

interface HogQLResponse {
  results?: unknown[][];
  columns?: string[];
}

async function hogql(query: string, personalApiKey: string): Promise<HogQLResponse> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!projectId) throw new Error("POSTHOG_PROJECT_ID missing");
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${personalApiKey}`,
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) throw new Error(`PostHog HogQL ${res.status}: ${await res.text()}`);
  return (await res.json()) as HogQLResponse;
}

function toTopN(rows: unknown[][] | undefined, limit = 10): Array<Record<string, unknown>> {
  if (!rows) return [];
  return rows
    .filter((r) => r[0] !== null && r[0] !== undefined && String(r[0]).trim() !== "")
    .slice(0, limit)
    .map((r) => ({ key: r[0], count: r[1] }));
}

export async function runPostHogDailyRollup(date?: string) {
  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!personalKey) {
    return { ok: false, reason: "POSTHOG_PERSONAL_API_KEY_missing" };
  }

  const target = date ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    // is_internal is stored as JSON — compare via toString to avoid ClickHouse
    // type mismatch (String vs UInt8). NULL means "not tagged" = public.
    const where = `WHERE toDate(timestamp) = toDate('${target}') AND (properties.is_internal IS NULL OR toString(properties.is_internal) != 'true')`;

    // Totals per event
    const totals = await hogql(
      `SELECT event, count() FROM events ${where} GROUP BY event`,
      personalKey,
    );
    const totalMap = new Map<string, number>();
    for (const r of totals.results ?? []) {
      totalMap.set(String(r[0]), Number(r[1]));
    }

    const sessions = await hogql(
      `SELECT count(DISTINCT $session_id) FROM events ${where}`,
      personalKey,
    );
    const uniqueSessions = Number(sessions.results?.[0]?.[0] ?? 0);

    const topPages = await hogql(
      `SELECT properties.$pathname, count() c FROM events ${where} AND event = '$pageview' GROUP BY properties.$pathname ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    const topProfiles = await hogql(
      `SELECT properties.slug, count() c FROM events ${where} AND event = 'profile_view' GROUP BY properties.slug ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    const topSearches = await hogql(
      `SELECT properties.q, count() c FROM events ${where} AND event = 'directory_search' GROUP BY properties.q ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    const topNoResult = await hogql(
      `SELECT properties.q, count() c FROM events ${where} AND event = 'directory_no_results' GROUP BY properties.q ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    const topReferrers = await hogql(
      `SELECT properties.$referring_domain, count() c FROM events ${where} AND event = '$pageview' AND properties.$referring_domain != '' GROUP BY properties.$referring_domain ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    const topLanding = await hogql(
      `SELECT properties.$pathname, count() c FROM events ${where} AND event = '$pageview' AND properties.$session_entry = true GROUP BY properties.$pathname ORDER BY c DESC LIMIT 10`,
      personalKey,
    );
    // Prefer canonical `$geoip_country_code`; coalesce legacy `country_code`.
    const countries = await hogql(
      `SELECT coalesce(nullIf(toString(properties.$geoip_country_code), ''), toString(properties.country_code)) AS cc, count() c FROM events ${where} AND (properties.$geoip_country_code IS NOT NULL OR properties.country_code IS NOT NULL) GROUP BY cc ORDER BY c DESC LIMIT 20`,
      personalKey,
    );
    const devices = await hogql(
      `SELECT properties.$device_type, count() c FROM events ${where} GROUP BY properties.$device_type`,
      personalKey,
    );

    const devMap: Record<string, number> = {};
    for (const r of devices.results ?? []) {
      devMap[String(r[0] ?? "unknown")] = Number(r[1]);
    }

    const rollupRow = {
      metric_date: target,
      public_page_views: totalMap.get("$pageview") ?? 0,
      public_profile_views: totalMap.get("profile_view") ?? 0,
      public_unique_sessions: uniqueSessions,
      directory_searches: totalMap.get("directory_search") ?? 0,
      searches_no_results: totalMap.get("directory_no_results") ?? 0,
      result_clicks: totalMap.get("directory_result_click") ?? 0,
      enquiries_started: totalMap.get("enquiry_start") ?? 0,
      enquiries_created: totalMap.get("enquiry_submit") ?? 0,
      signup_starts: totalMap.get("signup_start") ?? 0,
      checkout_starts: totalMap.get("checkout_started") ?? 0,
      signup_completes: totalMap.get("signup_complete") ?? 0,
      top_pages: toTopN(topPages.results) as unknown as never,
      top_profiles: toTopN(topProfiles.results) as unknown as never,
      top_searches: toTopN(topSearches.results) as unknown as never,
      top_no_result_searches: toTopN(topNoResult.results) as unknown as never,
      top_referrers: toTopN(topReferrers.results) as unknown as never,
      top_landing_pages: toTopN(topLanding.results) as unknown as never,
      countries: toTopN(countries.results, 30) as unknown as never,
      devices: devMap as unknown as never,
    };
    await supabaseAdmin.from("metrics_daily_public_analytics").upsert(rollupRow);

    await supabaseAdmin
      .from("public_analytics_ingest_state")
      .upsert({
        id: "posthog_daily",
        last_pulled_date: target,
        last_run_at: new Date().toISOString(),
        last_status: "ok",
        last_error: null,
      });

    return { ok: true, date: target };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("public_analytics_ingest_state").upsert({
      id: "posthog_daily",
      last_run_at: new Date().toISOString(),
      last_status: "error",
      last_error: msg.slice(0, 500),
    });
    return { ok: false, reason: msg };
  }
}

export const pullPostHogDaily = createServerFn({ method: "POST" })
  .inputValidator((raw: { date?: string }) => raw)
  .handler(async ({ data }) => runPostHogDailyRollup(data.date));
