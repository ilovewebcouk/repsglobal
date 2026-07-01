// Admin-only realtime PostHog query for /admin/activity Public layer.
//
// Runs server-side only. Uses POSTHOG_PERSONAL_API_KEY, never exposed to the
// browser. Short in-memory TTL cache prevents admin refreshes from spamming
// PostHog. Returns:
//   - visitors online now (5-min active sessions)
//   - current pages being viewed
//   - live country bubbles (with $geoip_country_code)
//   - stale / error flag if PostHog live query fails
//
// No raw visitor IDs or IPs are returned. Session IDs are hashed to short
// opaque tokens for de-duplication only.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash } from "node:crypto";

const POSTHOG_HOST = "https://eu.posthog.com";
const CACHE_TTL_MS = 5_000; // 5s — realtime feel; PostHog rate-limits protected

type SupaCtx = { supabase: unknown; userId: string };
async function assertAdmin(ctx: SupaCtx) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

interface HogQLResponse { results?: unknown[][]; columns?: string[] }
async function hogql(query: string): Promise<HogQLResponse> {
  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!personalKey || !projectId) throw new Error("PostHog not configured");
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${personalKey}`,
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) throw new Error(`PostHog HogQL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as HogQLResponse;
}

export interface PublicLivePage {
  path: string;
  viewers: number;
}
export interface PublicLiveCountry {
  country_code: string;
  online: number;
  views_5m: number;
}
export interface PublicRealtime {
  configured: boolean;
  ok: boolean;
  stale: boolean;
  error: string | null;
  fetched_at: string;
  online_now: number;               // distinct sessions in last 5 min
  page_views_5m: number;
  current_pages: PublicLivePage[];  // top pages last 5 min
  countries: PublicLiveCountry[];
  session_tokens: string[];         // hashed short tokens, for count dedupe only
}

let cache: { at: number; value: PublicRealtime } | null = null;

function short(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 10);
}

async function fetchLive(): Promise<PublicRealtime> {
  const configured = Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID,
  );
  const now = new Date().toISOString();
  if (!configured) {
    return {
      configured: false, ok: false, stale: true, error: "POSTHOG_PERSONAL_API_KEY missing",
      fetched_at: now, online_now: 0, page_views_5m: 0, current_pages: [], countries: [],
      session_tokens: [],
    };
  }
  const where = `WHERE timestamp > now() - INTERVAL 5 MINUTE
    AND (properties.is_internal IS NULL OR toString(properties.is_internal) != 'true')`;

  try {
    const [sessionsRes, pagesRes, countriesRes, pvRes] = await Promise.all([
      hogql(`SELECT DISTINCT $session_id FROM events ${where} AND $session_id IS NOT NULL LIMIT 500`),
      hogql(`SELECT properties.$pathname AS p, count(DISTINCT $session_id) AS v FROM events ${where} AND event = '$pageview' AND properties.$pathname IS NOT NULL GROUP BY p ORDER BY v DESC LIMIT 8`),
      hogql(`SELECT coalesce(nullIf(toString(properties.$geoip_country_code), ''), toString(properties.country_code)) AS cc, count(DISTINCT $session_id) AS online, count() AS views FROM events ${where} GROUP BY cc ORDER BY online DESC LIMIT 30`),
      hogql(`SELECT count() FROM events ${where} AND event = '$pageview'`),
    ]);

    const sessionIds = (sessionsRes.results ?? []).map((r) => String(r[0] ?? "")).filter(Boolean);
    const session_tokens = sessionIds.map(short);
    const online_now = session_tokens.length;
    const page_views_5m = Number(pvRes.results?.[0]?.[0] ?? 0);
    const current_pages: PublicLivePage[] = (pagesRes.results ?? [])
      .filter((r) => r[0] != null && String(r[0]).length > 0)
      .map((r) => ({ path: String(r[0]), viewers: Number(r[1] ?? 0) }));
    const countries: PublicLiveCountry[] = (countriesRes.results ?? [])
      .filter((r) => r[0] != null && String(r[0]).length > 0)
      .map((r) => ({
        country_code: String(r[0]).toUpperCase(),
        online: Number(r[1] ?? 0),
        views_5m: Number(r[2] ?? 0),
      }));

    return {
      configured: true, ok: true, stale: false, error: null, fetched_at: now,
      online_now, page_views_5m, current_pages, countries, session_tokens,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      configured: true, ok: false, stale: true, error: msg,
      fetched_at: now, online_now: 0, page_views_5m: 0, current_pages: [], countries: [],
      session_tokens: [],
    };
  }
}

export const getPublicRealtime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicRealtime> => {
    await assertAdmin(context);
    const nowMs = Date.now();
    if (cache && nowMs - cache.at < CACHE_TTL_MS) return cache.value;
    const value = await fetchLive();
    // Only cache successful responses (don't hold onto an error for 20s).
    if (value.ok) cache = { at: nowMs, value };
    else cache = { at: nowMs - CACHE_TTL_MS + 5_000, value }; // retry in ~5s
    return value;
  });
