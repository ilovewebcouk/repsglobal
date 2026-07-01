
# Public Analytics v1.1 — Execution Plan

v1 architecture stays intact (PostHog EU raw store, Supabase rollup, consent-required, first-party proxy, no raw public event tables, member/admin activity untouched). This plan is scoped only to the v1 QA gaps.

Because this is 6 phases with live-QA gates, I'll ship it in **3 build batches** with a QA gate between each. Each batch ends in a state you can smoke-test on production before the next.

---

## Batch A — Foundations (Phases 2 + 3 + 4)
Everything the realtime layer and rollup depend on.

**Phase 2 — Event instrumentation**
New helper `src/lib/analytics/track.ts` re-exporting `capturePublic` with typed event names. Fire from:
- `profile_view` → `src/routes/pro.$slug.tsx` (once per slug per session)
- `directory_search` + `directory_no_results` → `src/routes/search.tsx` / find-a-professional loader-driven page (debounced, after results resolve)
- `directory_result_click` → result card click handler
- `profile_cta_click` → Enquire / Book / Message buttons on `/pro/$slug`
- `enquiry_start` → `/pro/$slug/enquire` mount
- `enquiry_submit` → on successful mutation
- `signup_start` → `/auth` sign-up tab mount
- `checkout_started` → Stripe checkout redirect handler
- `signup_complete` → post-signup landing / verify-email page

Properties limited to the whitelist in your spec (path, referrer, session_id, professional_id/slug, q, result_count, clicked_result_slug, plan/tier). No IP, no PII.

**Phase 3 — Geo enrichment (proxy-side)**
Update `src/routes/api/public/[_]a/$.ts` to:
- Read Cloudflare `cf-ipcountry` header
- Rewrite the compressed body's `properties.$geoip_country_code` (canonical name — matches PostHog convention so no query rewrites needed later)
- Never forward `x-forwarded-for` / raw IP

Canonical property: **`$geoip_country_code`** (aligns with PostHog's native GeoIP field).

**Phase 4 — Rollup update**
`src/lib/ops/pull-posthog-daily.functions.ts`:
- Swap `country_code` → `$geoip_country_code`
- Keep the fixed internal filter
- Ensure all Phase-2 events counted (already listed in totalMap, verify)
- Add `top_ctas` (profile_cta_click by professional_slug), and browsers via `$browser`

---

## Batch B — Realtime layer (Phase 1)

**New server fn** `src/lib/admin/public-analytics-realtime.functions.ts`:
- `getPublicRealtimeSnapshot()` — HogQL queries with 30s in-memory TTL cache
  - visitors online now (distinct session_id in last 5 min)
  - current pages (top `$current_url`/`$pathname` in last 5 min)
  - live country counts (bubbles, last 15 min)
  - stale/error state surfaced
- `requireSupabaseAuth` + admin role check
- Personal API key stays server-side only

**New panel** `src/components/admin/activity/RealtimePublicPanel.tsx`:
- "Online now" hero number, live pages list, country bubbles
- Auto-refresh every 30s
- Stale / error pill

**Map toggle** — extend `WorldMapPanel`:
- New prop `layer: "members" | "public" | "both"`
- Blue bubbles for public (uses realtime country data), orange for members
- Segmented control above the map

---

## Batch C — UI polish + QA (Phases 5 + 6)

**Phase 5** — Relabel `PublicVisitorsPanel` tiles per spec, split realtime vs rollup visually (Live badge on realtime tiles).

**Phase 6** — Live QA via Playwright headless against `repsuk.org`:
1. Accept consent in incognito → hit /, /find-a-professional, /pro/{slug}, /pro/{slug}/enquire → confirm each event in HogQL query
2. Reject consent → confirm zero events
3. Set GPC header → confirm zero events
4. Confirm `$geoip_country_code` populated
5. Confirm admin `/admin/activity` shows realtime numbers, map toggle works
6. Trigger rollup for today, confirm counts match PostHog
7. Screenshot evidence saved under `/tmp/browser/v1-1-qa/`

Written up in `docs/admin-v2/public-analytics-v1-1-qa.md` with pass/fail per row and final verdict.

---

## What I need from you before I start

Just a **go** on the plan (or a "skip Batch X, do Y instead"). Two defaults I'll pick unless you object:

1. Canonical country property = **`$geoip_country_code`** (PostHog-native, one word change in rollup, matches convention).
2. Realtime cache TTL = **30 seconds** (protects PostHog rate limits, still feels live to an admin refreshing the page).

If both are fine, reply "go" and I'll ship Batch A first, report back, then continue.
