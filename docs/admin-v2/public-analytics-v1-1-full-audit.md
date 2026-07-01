# Public Analytics v1.1 — Full Chain-of-Custody Audit

**Date:** 2026-07-01
**Auditor:** Automated end-to-end sweep (Playwright vs production `repsuk.org` + direct HogQL vs PostHog EU + Supabase reads)
**Scope:** Consent → SDK → Proxy → PostHog storage → Realtime query → Rollup → Dashboard binding
**Read-only.** No UI or backend was modified. Two concrete bugs found; listed at the end for a separate patch decision.

---

## Verdict

**F. Mixed partial failure.** Capture pipeline works for `$pageview`/`$pageleave` only. All custom `track.*()` events (`profile_view`, `directory_search`, `directory_result_click`, `profile_cta_click`, `enquiry_*`, `signup_*`, `checkout_started`) never reach PostHog. Proxy transforms (`$ip` strip, `is_internal` tag, `$geoip_country_code` injection) silently no-op for real posthog-js payloads. The realtime query, rollup writer, and dashboard bindings are all correct; they show `0` because upstream is starved.

### One-line blockers

1. **P1 – Proxy does not mutate posthog-js bodies.** `disable_compression:true` makes posthog-js POST as `application/x-www-form-urlencoded` with `data=<base64 JSON>`. Proxy tries `JSON.parse(text)` (line 60), throws, falls into the `catch` and forwards the body unchanged (line 82-84). Result: `$ip` never stripped, `is_internal` always `null`, `$geoip_country_code` never injected. Country in PostHog is therefore derived from the *proxy's* PostHog-facing IP → every real event is stamped `US` (Cloudflare's PostHog-EU ingest region).
2. **P1 – Custom events never arrive at PostHog.** All `track.*()` call sites exist and are correctly wired, but 24h HogQL sweep shows **zero** occurrences of any custom event, despite `$pageview`s for the exact matching profile/directory paths in the same sessions. Consent and pageview beacon both work, so the loss happens downstream of `capturePublic`. Root cause needs a short instrumented repro (see §8).

---

## Phase 1 — Browser capture (against production, headless Chromium + real Chrome UA)

Playwright's default UA is caught by `BOT_UA` in the proxy (line 13). All tests below spoofed `Chrome/126`.

| Test | Consent | Expected | Observed | Verdict |
|---|---|---|---|---|
| A – no consent | not decided | no PostHog load, no `_a` calls, no `ph_*` cookies, no PostHog events | 0 outbound `_a` / posthog requests over `/`, `/find-a-professional` and `/pro/*`; `window.__repsPh` undefined; no `ph_*` cookies | **PASS** |
| B – accepted | analytics=true | POST to `/api/public/_a/e/` per pageview; SDK loaded | `reps.consent.v1` cookie set, `ph_phc_…` cookie set, `window.__repsPh` object present; **but 0 network requests to `/api/public/_a/*` or any `posthog` host across full session (99 total requests)** | **FAIL** ⚠ |
| C – rejected | analytics=false | no SDK, no calls | Same as A (identical code path via `hasAnalyticsConsent()`) | **PASS** |
| D – logged-in admin | n/a | events omitted or `is_internal=true` | `$pageview` for `/admin/activity` and `/dashboard` appear in PostHog with `is_internal=null`; admin exclusion **not effective server-side** because the browser posthog-js request carries no `Authorization` header so the proxy's `isAdmin()` returns false | **FAIL** |

Notes on B:
- SDK *is* initialised (device cookie exists, `__repsPh` present) so `capturePublic` at least ran.
- Playwright's request listener does not catch every `navigator.sendBeacon`, which may hide some flush traffic; **but** the same session did not appear in PostHog either (checked by distinct_id `019f1e9d-…`), so the capture genuinely did not reach PostHog. Correlated with Bug 2.
- Admin pages showing up in the event stream (`/dashboard`, `/admin/activity`) is caused by `capture_pageleave:true` in posthog-js — that listener fires on every unload regardless of the surface gate in `usePublicAnalyticsBeacon`.

---

## Phase 2 — Event taxonomy in PostHog (last 24h)

HogQL: `SELECT event, count(), max(timestamp) FROM events WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY event`

| Event | 24h count | Latest | Wired in code? | Firing? |
|---|---:|---|---|---|
| `$pageview` | 24 | 2026-07-01 16:48:29Z | yes (`usePublicAnalyticsBeacon.ts:154`) | ✅ |
| `$pageleave` | 11 | 2026-07-01 16:48:53Z | posthog-js builtin | ✅ |
| `profile_view` | 0 | — | `pro.$slug.index.tsx:521` | ❌ |
| `directory_search` | 0 | — | `find-a-professional.tsx:429` | ❌ |
| `directory_no_results` | 0 | — | `find-a-professional.tsx:436` | ❌ |
| `directory_result_click` | 0 | — | `find-a-professional.tsx:1046,1062` | ❌ |
| `profile_cta_click` | 0 | — | `pro.$slug.index.tsx:678` | ❌ |
| `enquiry_start` | 0 | — | `pro.$slug.enquire.tsx:141` | ❌ |
| `enquiry_submit` | 0 | — | `pro.$slug.enquire.tsx:279` | ❌ |
| `signup_start` | 0 | — | `signup.tsx:207` | ❌ |
| `checkout_started` | 0 | — | `signup.tsx:272` | ❌ |
| `signup_complete` | 0 | — | `checkout.return.tsx:55` | ❌ |

**Every custom event is fully wired at a real call site, but none has ever arrived at PostHog.** Same 24h window contains `$pageview` for `/pro/james-carter`, `/pro/jordon-gumbley`, `/find-a-professional?...` — the exact pages that should also fire `profile_view` / `directory_search`.

---

## Phase 3 — Property audit (latest 20 events)

HogQL: latest 20 events, projecting the properties the pipeline depends on.

| Property | Present on all events? | Missing where | Notes |
|---|---|---|---|
| `event`, `timestamp`, `distinct_id` | ✅ | — | fine |
| `$session_id` | ✅ | — | required by realtime query; present |
| `$current_url`, `$pathname` | ✅ | — | realtime uses `$pathname`; matches |
| `$geoip_country_code` | ✅ (all `US`) | — | **Wrong value.** All events stamped `US` because proxy does not inject `cf-ipcountry` (Bug 1) → PostHog geoips against the proxy's PostHog-facing egress → US |
| `country_code` (legacy mirror) | ❌ | all events | Should be mirrored by proxy — confirms proxy mutation never runs |
| `is_internal` | ❌ (always `null`) | all events | Should be `false` for public and `true` for admin — never set (Bug 1) |
| `$ip` | ❌ (always null) | — | Correct absence, but by PostHog's ingest server-side scrub, **not** by our proxy. Verified by injecting `"$ip":"1.2.3.4"` in a manual probe: PostHog stripped it upstream. |
| `$browser`, `$device_type` | ✅ | — | fine |
| `$geoip_city_name` / `$geoip_subdivision_1_name` / lat / lng | ❌ | all events | PostHog geoip on EU ingress falls back to country only from a datacentre IP; no city / coords → the `cities` query returns empty → map only ever draws country bubbles |
| `professional_slug`, `professional_id`, `q`, `result_count`, `clicked_result_slug` | ❌ | — | Not applicable, custom events don't exist yet |

Hard-fail check summary: `$ip` absent ✅ · `is_internal=true` on public traffic ✅ (never set) · `session_id` missing on pageview ✅ (present) · path missing ✅ (present) · **BUT** proxy mutations are all silently skipped (§8, Bug 1).

---

## Phase 4 — Realtime query audit

Ran each query in `src/lib/admin/public-realtime.functions.ts` verbatim against PostHog HogQL:

| Query | Result | Root cause |
|---|---|---|
| distinct sessions last 5m with `is_internal != 'true'` filter | `0` | Matches "Public now: 0". Truthful — nobody was active in the last 5 minutes of raw data (latest event at time of audit was 8 min old). |
| distinct sessions last 60m, no filter | `1` | Matches PostHog raw. |
| `event, count()` last 15m | `[('$pageleave', 2), ('$pageview', 1)]` | Matches. |
| countries last 15m | `[('US', 1)]` | Query correct; data wrong upstream (Bug 1). |
| top pages 5m | `[]` | Matches "Public pages now" empty. Data upstream is genuinely stale at that instant. |
| cities query (lat/lng) | `[]` always | PostHog geoip against Cloudflare EU ingress never populates coord properties without our proxy injecting them. |

Time-window, timezone (`now()` = UTC in both server function and HogQL), property names (`$pathname`, `$geoip_country_code`, `$session_id`), and cache TTL (5s) are all correct. **The realtime query is not the bug.**

---

## Phase 5 — Rollup audit

`public_analytics_ingest_state`:

| field | value |
|---|---|
| `last_status` | `ok` |
| `last_run_at` | 2026-07-01 16:56:12Z |
| `last_error` | (empty) |
| `last_pulled_date` | 2026-07-01 |

`metrics_daily_public_analytics` (last 2 days):

| date | page_views | sessions | profile_views | directory_searches | enquiry_starts | signup_starts |
|---|---:|---:|---:|---:|---:|---:|
| 2026-07-01 | 24 | 10 | 0 | 0 | 0 | 0 |
| 2026-06-30 | 0 | 0 | 0 | 0 | 0 | 0 |

Rollup counts match PostHog raw counts exactly. **Rollup writer is correct.** The daily table is empty for custom events because PostHog itself has none. Sub-agent noted a naming asymmetry (`enquiry_started` in `public-conversion.ts` vs `enquiry_start` in `track.ts`) — worth cleaning up, but not the cause of today's zeros.

---

## Phase 6 — Dashboard binding

| UI label | Source | Correct binding? | Why value is what it is |
|---|---|---|---|
| Public now | `getPublicRealtime().online_now` | ✅ | Upstream zeroed by Bug 2 + genuinely no active sessions |
| Views 5m | `getPublicRealtime().page_views_5m` | ✅ | Same |
| Public pages now | `getPublicRealtime().current_pages` | ✅ | Same |
| Countries live | `getPublicRealtime().countries` | ✅ | All events tagged `US` (Bug 1) so this at least shows US when there is traffic |
| Public map bubble | `WorldMapPanel` props from `publicCountries` | ✅ | Same |
| Page views 24h / Unique sessions | `getPublicAnalyticsSummary` → rollup row | ✅ | Correct |
| Profile views / Dir. searches / Result clicks / Enquiries | `getPublicAnalyticsSummary` → rollup row | ✅ | Always 0 because Bug 2 |
| Top public pages / Top referrers / Top countries | `getPublicAnalyticsSummary` → rollup jsonb | ✅ | Correct binding |
| Ingest status | `getPublicAnalyticsSummary` → ingest state | ✅ | Shows `ok` |

**No dashboard-layer defect.** Every field is bound to the right function/column.

---

## Phase 7 — Consent & exclusion

| Check | Result |
|---|---|
| No analytics before consent | ✅ (Test A — no `_a` traffic, no SDK) |
| Analytics after accept | ⚠ SDK loads but events don't reach PostHog reliably (Bug 2) |
| No analytics after reject | ✅ (same code path as A) |
| DNT/GPC forces reject | ✅ (`consent.ts:58`; `CookieBanner.tsx:35`) |
| Logged-in member excluded from public | ✅ client-side (`usePublicAnalyticsBeacon.ts:147`) for our own $pageview beacon; ❌ posthog-js's built-in `$pageleave` fires regardless, so admin/dashboard pageleaves still leak into PostHog |
| Admin excluded server-side (`is_internal=true`) | ❌ Proxy sets it from bearer token; browser posthog-js never sends `Authorization`, so `isAdmin()` always returns `false` |
| Admin traffic not counted in public live/rollup | ⚠ Filter `is_internal != 'true'` is correct, but since `is_internal` is always `null`, admin traffic *is* counted (mitigated only by the client-side surface guard, which pageleave bypasses) |
| Bots dropped | ✅ (proxy `BOT_UA` regex + missing UA rejected) |

---

## Phase 8 — Findings and fixes

### Bugs (concrete, evidence-backed)

**Bug 1 — Proxy body mutation silently no-ops (P1)**
- File: `src/routes/api/public/[_]a/$.ts:57-84`
- Cause: posthog-js with `disable_compression:true` posts events as `Content-Type: application/x-www-form-urlencoded` with `data=<base64(JSON)>`. Proxy does `JSON.parse(text)`, throws on the form-encoded body, and forwards the raw body unchanged (line 82-84).
- Effect: `$ip` never stripped by us (PostHog EU strips it, so PII is technically fine), `is_internal` never tagged, `$geoip_country_code` never injected → every event is `US`, admin traffic isn't excluded server-side, city dots never populate.
- Fix (safe, small): if `content-type` contains `application/x-www-form-urlencoded`, parse `data=<base64>` (posthog-js also supports `?data=` on GET beacons), mutate the decoded JSON, re-encode. Alternative: flip `disable_compression:false` in `usePublicAnalyticsBeacon.ts:60` **and** teach the proxy to gunzip/gzip the batch. Requires an SDK re-init and a redeploy.
- Blocker for: v1.1 (admin exclusion, geo enrichment, city dots).

**Bug 2 — Custom `track.*()` events never arrive at PostHog (P1)**
- Files: `src/lib/analytics/track.ts`, `src/hooks/usePublicAnalyticsBeacon.ts`
- Evidence: 24h HogQL sweep shows 0 of every custom event, even for sessions that also produced `$pageview` on the exact matching pro/directory pages (e.g. `/pro/jordon-gumbley` at 12:46:40Z with a 21s dwell time — no `profile_view`).
- Hypotheses ranked by likelihood:
  1. Race in `capturePublic`: `await loadPostHog()` resolves with the posthog instance immediately after `init()`, before the `loaded` callback runs. `posthog.capture` called at that moment silently queues in an internal buffer that never flushes for these specific events. `$pageview` from the beacon happens to fire slightly later (after the `useRouterState` subscription updates) and succeeds. Needs `posthog._loaded`-gated queue confirmation.
  2. `isFixture` guard at `pro.$slug.index.tsx:519` returns for demo profiles; that would only affect `james-carter`, not `jordon-gumbley`.
  3. `void import("@/lib/analytics/track").then(({ track }) => track.profileView(...))` inside `useEffect` may be aborted by React strict-mode double-invoke unmount, but that would only drop dev events.
- Recommended next step (still audit, not fix): add one `console.debug` in `capturePublic` right before `ph.capture()` and re-run Test B. That confirms whether the capture is invoked at all.
- Blocker for: v1.1.

### Nits (non-blocking)

- `src/lib/analytics/public-conversion.ts:7` uses `enquiry_started`; `track.ts:46` uses `enquiry_start`. Pick one.
- `pull-posthog-daily.functions.ts:73,77,81` hard-codes `LIMIT 10` on top-N lists. Fine for now, will clip once traffic grows.
- `usePublicAnalyticsBeacon.ts` cannot silence posthog-js's built-in `$pageleave` on admin/dashboard surfaces. Either set `capture_pageleave: false` and fire it manually behind the surface gate, or filter admin paths in the realtime/rollup queries.
- Admin exclusion relies entirely on the proxy tagging `is_internal`, which currently no-ops (Bug 1). Consider also having the client set `is_internal: true` in the property bag when a Supabase session exists.

### What is working (do not touch)

- Consent gate (accept / reject / DNT / GPC).
- No-consent zero-traffic path.
- Bot rejection.
- $pageview / $pageleave capture (partially; pageleave leaks admin).
- PostHog storage integrity.
- Realtime HogQL (property names, time window, TTL, filter logic).
- Daily rollup writer + `public_analytics_ingest_state` heartbeat.
- Every UI binding on `/admin/activity`.

---

## Deliverable status

Verdict: **F. Mixed partial failure — two P1 blockers listed above.** Not marking v1.1 complete. Ready to patch Bug 1 (proxy form-encoded body parsing) and instrument Bug 2 (custom event drop) in a follow-up. Awaiting your call on whether to apply those fixes now or in a separate scoped pass.
