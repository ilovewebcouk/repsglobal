# Public Analytics v1.1 — Realtime Layer & Map Toggle Plan

Status: **Design spec. Follow-up to v1 activation. Do not build until v1 activation QA passes.**

v1 ships rolled-up daily public analytics (PostHog EU → Supabase `metrics_daily_public_analytics`) plus a static Public Visitors panel on `/admin/activity`. v1.1 adds live public visitor visibility without compromising the consent-only, no-IP guarantees.

## Goals

1. Show **Public visitors online now** as a KPI on `/admin/activity`, alongside the existing member "Online now" tile — clearly separated.
2. Show **current public pages being viewed** (top N by concurrent viewers, last 60s).
3. Show **public visitor country bubbles** on the World Map.
4. Add a **map layer toggle**: `Members` / `Public` / `Both`.
5. Never mix public visitor counts into member metrics.

## Non-goals

- Session recording, heatmaps, or any device-precise data.
- Real-time WebSocket transport (poll-only).
- Public visitor identity beyond anonymous `distinct_id`.

## Data source

PostHog EU HogQL via server-side query using `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID`.

New server fn: `src/lib/analytics/public-realtime.functions.ts`
- `getPublicOnlineNow()` — count of distinct `session_id` with `$pageview` in last 60s where `is_internal = false`.
- `getPublicTopPages({ limit: 10 })` — grouped `path` + viewer count, last 60s.
- `getPublicCountryBubbles()` — grouped `country_code` + viewer count, last 5m (5m to smooth sparse traffic).

All fns:
- `.middleware([requireSupabaseAuth])` + admin role check.
- Cache results 15s in-memory per Worker isolate (`Cache-Control: private, max-age=15`) to cap PostHog API cost.
- Return `{ ok: false, reason: 'posthog_unavailable' }` on any upstream failure; UI degrades to "Live public data unavailable" pill.

## UI wiring

`/admin/activity`:
- KPI strip gains one blue-themed tile: **Public visitors online** (with 24h delta from existing rollup).
- Map: new `<MapLayerToggle value="both" />` control top-right of `WorldMapPanel`.
  - `Members` — existing orange member centroids only.
  - `Public` — blue public country bubbles only.
  - `Both` — both, with public bubbles rendered under member bubbles and slightly transparent.
- Below map: new **Public pages right now** compact list (path + viewer count), separate from the existing member Recent Activity feed.

Visual separation rules (non-negotiable):
- Member data: existing orange/emerald tokens.
- Public data: `bg-sky-500/15 border-sky-400/30 text-sky-300` — never orange.
- KPI tiles have a small chip label (`Members` / `Public`) so no admin can confuse them.

## Privacy

- No raw IP anywhere in payload or UI (already enforced at proxy).
- Country only — never city, region, or coordinates.
- Only consented sessions are in PostHog by construction (v1 gating).
- Admin traffic excluded via `is_internal = true` filter (set by proxy).
- Member sessions excluded — public beacon does not run when Supabase session is present.

## Fallbacks

- `VITE_POSTHOG_PUBLIC_KEY` unset → no capture → v1.1 panels render empty state "Public analytics not enabled".
- PostHog HogQL query fails / times out (>3s) → cached last-good value up to 5m; after that, "Live public data unavailable" pill.
- Rate limited by PostHog → fall back to 60s cache instead of 15s.

## Performance limits

- Max 3 HogQL queries per admin page load, batched.
- 15s Worker-isolate cache; refresh button forces re-query.
- HogQL time window capped at 5m to keep queries cheap.
- Query cost budget: <200 PostHog query credits per admin per hour under normal use.

## Acceptance criteria

- Public visitors online KPI renders within 500ms of admin nav (cached) and refreshes on 15s poll.
- Map toggle switches layers without full re-render.
- Zero raw IPs, coordinates, or user-identifying strings in any network payload.
- Public metrics never appear inside Member 360, Member lifecycle, or any member KPI card.
- Query cost stays inside the budget above under a 5-admin concurrent load test.

## Follow-ups deferred to v1.2

- City-level public bubbles (needs the same Cloudflare geo enrichment as the member map — see `activity-geo-map-v1-2-plan.md`).
- Realtime enquiry conversion pings on the map.
- Public visitor cohort filters (referrer, landing page).
