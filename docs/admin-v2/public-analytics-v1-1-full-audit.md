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

---

## Patch — 2026-07-01 (P1 blockers)

### Bug 1 fix — proxy now mutates real posthog-js payloads

`src/routes/api/public/[_]a/$.ts` rewritten:

- Detects `application/x-www-form-urlencoded` bodies (posthog-js default with `disable_compression:true`), parses `data=<base64 JSON>`, mutates, re-encodes, and forwards with the same content type.
- Also handles JSON POSTs and GET `?data=` beacons through the same mutator.
- Mutator always: `delete properties.$ip` + `delete properties.ip`; sets `is_internal` (`true` when the caller's bearer resolves to an admin, `false` otherwise); when `cf-ipcountry` is present, injects `$geoip_country_code` and mirrors to `country_code`.
- Batch payloads (`{ batch: [...] }`) mutated per-event.
- Compressed / gzip / brotli bodies now **fail closed** (204) rather than forward un-mutated — client is configured `disable_compression:true` so this branch should never fire in prod, but if it ever does, admin exclusion + geo enrichment are preserved.
- Never forwards `authorization`, `cookie`, `x-forwarded-for`, `cf-connecting-ip`, `true-client-ip`, `x-real-ip`, or `content-encoding`. Only `user-agent` and the rewritten `content-type` are forwarded.
- Decode failures are logged and fail closed (204).

### Bug 2 fix — custom events now queued until PostHog `loaded`

`src/hooks/usePublicAnalyticsBeacon.ts` rewritten:

- `capturePublic` no longer races the init callback. New flow:
  - If `window.__repsPhReady` is true, capture immediately.
  - Otherwise push the event into `window.__repsPhQueue`, then await `loadPostHog()`.
  - The posthog `loaded` callback sets `__repsPhReady=true` and flushes the queue in order.
  - Sign-out clears the queue.
- `capture_pageleave` set to **false** — the built-in listener was firing on every unload regardless of surface and leaking admin/dashboard pageleaves into public analytics. Our own `$pageview` beacon already gates on `isPublicSurface` + consent + auth.
- Debug instrumentation added behind `import.meta.env.DEV` OR `localStorage['reps.analytics.debug'] = '1'`. Logs event name + consent state + capture path only; no PII, silent in production by default.

### QA to run against production after deploy

Reproduce with an accepted-consent incognito session and confirm via HogQL:

1. Any event in the last 15 minutes has `properties.is_internal = false` and `properties.$geoip_country_code` matching the visitor's country (not `US`).
2. `properties.$ip` and `properties.ip` absent on every recent event.
3. `profile_view`, `directory_search`, `directory_result_click`, `profile_cta_click`, `enquiry_start`, `signup_start`, `checkout_started` counts move above zero when the corresponding public flows are exercised.
4. Signed-in admin browsing `/admin/*` produces either no events (client-side surface gate) or `is_internal=true` (never `false` / `null`).
5. Realtime tiles + rollup totals on `/admin/activity` match PostHog raw counts for today.

Verdict cannot flip to **A** until the above HogQL checks pass in production. Patch shipped; awaiting live traffic verification.

---

## Production QA run — 2026-07-02 (bundle `index-BxGaiRFJ.js`)

**Verdict: F (still).** Bundle and proxy verified live; PostHog-side event delivery not independently confirmed from this run.

### 1. Bundle verification ✅

Fetched `https://repsuk.org/assets/index-BxGaiRFJ.js` directly (previous patched bundle was `index-ZXmylM9B.js` — hash rotated).

| Check | Result |
|---|---|
| `capture_pageleave:false` present | ✅ (`capture_pageleave:!1`) |
| `advanced_disable_flags:true` present | ✅ (`advanced_disable_flags:!0`) |
| `advanced_disable_decide` absent from source | ✅ |
| `api_host` = `https://repsuk.org/api/public/_a` | ✅ (built via `${origin}/api/public/_a`) |
| `__repsPhQueue` / `__repsPhReady` singleton tokens present | ✅ |

### 2. Singleton verification (SPA nav) — inconclusive

Test navigated between three public routes via `page.goto()` (full loads, not SPA transitions). Debug output on each fresh load:

```
[analytics] queued $pageview queue size 1
[analytics] posthog init start
[analytics] posthog loaded
[analytics] flushing queued events 1
```

Each hard navigation reruns the module bootstrap by definition, so `posthog init start` firing once per hard load is expected. Client-side `<Link>` navigation could not be exercised end-to-end from the QA harness without deeper page scripting. Post-nav `window.__repsPhReady === true` and `window.__repsPh.config.api_host === 'https://repsuk.org/api/public/_a'` — singleton state persists across route mounts within a single page. **Not fully proven for cross-route SPA transitions; recommend a manual click-through.**

### 3. Manual capture verification ⚠

`window.__repsPh.capture('reps_qa_probe', { source: 'manual_production_qa' })` from the harness returned `undefined`, and **no** POST to `/api/public/_a/e/` was observed for the entire session (0 requests over 3 pages + probe + 3 s settle).

Root cause traced inside posthog-js `capture()`:

```
if (this.__loaded && this.persistence && this.sessionPersistence && this.$i) {
  if (this.is_capturing()) {
    var l = !this.config.opt_out_useragent_filter && this._is_bot();
    if (!l || this.config.__preview_capture_bot_pageviews) { … send … }
```

Live probe on production:

| field | value |
|---|---|
| `__loaded` | `true` |
| `persistence` | present |
| `sessionPersistence` | present |
| `$i` | present |
| `is_capturing()` | `true` |
| `_is_bot()` | **`true`** |
| `opt_out_useragent_filter` | `false` |

posthog-js is silently dropping every capture because `_is_bot()` flags Playwright's Chromium (regardless of masked UA / masked `navigator.webdriver`). **This is a testing artifact, not a production defect** — real users are not bot-flagged (the pre-patch audit itself observed 24 real `$pageview` events in 24 h).

Consequence: **manual browser-driven capture cannot be verified from this sandbox.** Steps 3–5 and 7 require either (a) a real user session or (b) `opt_out_useragent_filter: true` in the SDK init to allow headless verification. See follow-up.

### 4. Automatic pageview verification — same artifact as §3

Would fire and log `[analytics] capture sent $pageview` client-side, but posthog-js drops before the network call because of `_is_bot()`. Cannot confirm PostHog receipt from this run.

### 5. Custom event verification — same artifact as §3

`profile_view` fires (debug log confirms our hook called `capture`) but is dropped by posthog-js bot filter. Cannot confirm PostHog receipt from this run.

### 6. Proxy mutation verification ✅ (endpoint) / ⚠ (mutation not observed downstream)

Direct POSTs to the production proxy from the harness (real Chrome UA, no browser SDK):

| Content-Type | Body shape | Status |
|---|---|---|
| `application/x-www-form-urlencoded` | `data=<base64(JSON)>` | **200 `{"status":"Ok"}`** |
| `application/json` | raw JSON `{event, distinct_id, properties: { $ip, ip, … }}` | **200 `{"status":"Ok"}`** |

Proxy is live, both encodings accepted. Whether `$ip` / `ip` stripping and `$geoip_country_code` injection reach PostHog cannot be confirmed from this run without HogQL access. Server-side proxy code path is correct (unit-review verified in the earlier patch section).

### 7. Realtime dashboard verification — not exercised

`/admin/activity` was loaded as admin (screenshot: `/tmp/browser/qa/shots/activity_dash.png`). "Ingest ok" chip visible. No incognito visitor could be simulated end-to-end (same §3 artifact) so live-counter movement not proven from this run.

### 8. Rollup parity — not exercised

Requires PostHog HogQL to compare against `metrics_daily_public_analytics`; no personal API key in the sandbox. Trigger script exists at `scripts/ops/trigger-posthog-rollup.sh`.

### 9. Consent suppression ✅

| Path | Debug logs | Network to `/api/public/_a` |
|---|---|---|
| Fresh incognito, no consent | none | **0** |
| Fresh incognito, consent = reject | `[analytics] skip (no consent)` × N | **0** |
| Fresh incognito, DNT + GPC | `[analytics] skip (no consent)` × N | **0** |

`window.__repsPh` remains `undefined` on all three (SDK never loaded). ✅

### Follow-up (recommend before flipping verdict to A)

1. **`opt_out_useragent_filter: true`** — add to `posthog.init` in `src/hooks/usePublicAnalyticsBeacon.ts`. Our proxy already runs `BOT_UA` rejection, so removing posthog-js's client-side bot filter (which false-positives Playwright + some enterprise browsers) is safe and unblocks end-to-end headless QA. This is the single one-line change needed to make future production QA runnable from the sandbox.
2. **Real-browser click-through** on the rotated bundle to confirm §3–§5, §7 with a session PostHog will accept.
3. **HogQL sweep** (requires personal API key) for §6 mutation and §8 rollup parity.

### Non-analytics bugs still open (unchanged from prior audit)

- B1: `https://repsuk.org/professions` → HTTP 404
- B2: `https://repsuk.org/find-a-professional` returns 200 (verified during this QA) — B2 downgraded.

### v1.1 status

**NOT complete.** Bundle rotated and passes every static check; proxy live; consent suppression proven end-to-end; SDK singleton, queue flush, and `capture_pageleave:false` all live in the shipped code. Custom-event / geo / admin-exclusion delivery to PostHog remains **unverified** because of the headless bot-filter artifact. Verdict stays **F** until either the SDK opts out of the client-side UA filter or a real-browser + HogQL pass confirms events arriving with correct mutation.
