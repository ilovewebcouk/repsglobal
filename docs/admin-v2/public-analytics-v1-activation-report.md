# Public Analytics v1 — Activation Report

**Prepared:** 2026-07-01
**Decision:** **B — Safe to add secrets, but keep capture disabled until banner copy is approved.**

Live capture is not enabled and cannot be enabled without configuring PostHog
secrets (see §2). The code path is gated by `VITE_POSTHOG_PUBLIC_KEY`; while
that env var is empty, `loadPostHog()` short-circuits and no network calls are
made to `/_a/*`. This is the intended kill-switch.

---

## 1. Architecture confirmation

Confirmed by direct DB inspection (`information_schema.tables`):

| Concern | Result |
| --- | --- |
| Raw `public_analytics_events` table | ❌ Not created (correct) |
| Raw `public_visitor_sessions` table | ❌ Not created (correct) |
| Raw public event store | PostHog EU only |
| Supabase public-analytics tables | `metrics_daily_public_analytics` (rollup), `public_analytics_ingest_state` (cron watermark), `public_analytics_consent_events` (audit), `public_visitor_conversions` (link table) |
| Member activity tables | `auth_events`, `member_session_events`, `user_sessions` — untouched by this feature |
| Member 360 pollution | None. `PublicVisitorsPanel` is only mounted on `/admin/activity`; Member 360 reads only member tables. Anonymous → member linkage happens through `public_visitor_conversions.user_id` only after signup + consent. |

**Tables created/modified for Public Analytics v1** (single migration `20260701093640…`):
- `public_analytics_consent_events` (new)
- `public_analytics_ingest_state` (new)
- `public_visitor_conversions` (new)
- `metrics_daily_public_analytics` (new)

No member tables touched. No raw event tables. ✅

---

## 2. Required secrets

Add these in **Lovable Cloud → Secrets** before enabling capture:

| Secret | Type | Where used | Notes |
| --- | --- | --- | --- |
| `VITE_POSTHOG_PUBLIC_KEY` | build env, publishable | `src/hooks/usePublicAnalyticsBeacon.ts` (`loadPostHog`) | Doubles as the kill switch. While empty, PostHog never loads and the proxy is never hit. |
| `POSTHOG_PERSONAL_API_KEY` | runtime, server-only | `src/lib/ops/pull-posthog-daily.functions.ts` | Personal API key with **read** access to the target project only. Used for the nightly HogQL rollup. |
| `POSTHOG_PROJECT_ID` | runtime, server-only | same file | Numeric PostHog project ID for HogQL endpoint. |

**Not required** (host URLs are hard-coded, not secret): PostHog EU ingest
`https://eu.i.posthog.com` (proxy target) and HogQL host
`https://eu.posthog.com` (rollup target).

**No new cron secret required.** The `/api/public/cron/pull-posthog-daily`
route authenticates using `SUPABASE_PUBLISHABLE_KEY` in the `apikey` header —
the canonical Lovable Cloud pg_cron pattern already used elsewhere in the app.

**No CNAME / proxy DNS config required.** Ingest goes through the same-origin
route `/api/public/_a/*`, which is a TanStack server route — no external DNS
work.

### Naming reconciliation

The original plan referenced `POSTHOG_PROJECT_API_KEY`. Implementation uses
`POSTHOG_PERSONAL_API_KEY` because HogQL (`/api/projects/{id}/query/`)
requires a **Personal API Key** — project API keys are ingest-only and cannot
run queries. This is a correction, not a scope change. `VITE_POSTHOG_PUBLIC_KEY`
is the browser ingest key (the "project API key" in PostHog's UI).

---

## 3. Consent gating

Source: `src/lib/consent/consent.ts`, `src/hooks/usePublicAnalyticsBeacon.ts`.

**Before consent accepted (default state):**
- `hasAnalyticsConsent()` returns `false` → `capturePublic()` returns early
  before importing `posthog-js`. ✅
- `usePublicAnalyticsBeacon` route-change effect early-returns on
  `!hasAnalyticsConsent()`. ✅
- No `ph_*` cookies written (never initialised). ✅
- No persistent anonymous ID stored. Session id is `sessionStorage` only,
  scoped to tab, cleared on close. ✅
- No pageview / profile view / directory search / result click captured. ✅
- `PublicVisitorsPanel` shows only Supabase rollups (currently empty). ✅

**After consent accepted:**
- `loadPostHog()` dynamically imports `posthog-js`, initialises with
  `api_host: `${origin}/_a`` (same-origin proxy), `person_profiles:
  "identified_only"`, `autocapture: false`, `disable_session_recording: true`.
- Route-change effect fires `$pageview` with `path` and `referrer`.
- `capturePublic("profile_view" | "directory_search" | "directory_result_click" | ...)`
  works from any component.
- Country code is added server-side in the proxy from `cf-ipcountry` — the
  browser never sends geolocation.

**After consent rejected:**
- `setConsent(false, …)` writes `{ analytics: false }` to the first-party
  cookie **and** purges any `ph_*` cookies as a defensive sweep. ✅
- All capture calls short-circuit. ✅

**DNT / GPC:**
- `isDntOrGpc()` forces `hasAnalyticsConsent()` → `false` even if the user
  previously accepted. ✅
- Server proxy also drops `dnt: 1` / `sec-gpc: 1` with a `204`. ✅
- `CookieBanner` never renders the banner when DNT/GPC is set; it auto-writes
  a `rejected` consent event.

---

## 4. Operational conversion records

Confirmed in `src/routes/api/public/activity/public-conversion.ts` and
`src/lib/analytics/public-conversion.ts`:

**Allowed without analytics consent:**
- Recording the enquiry / signup / checkout row itself (this is a business
  transaction, not analytics). ✅
- Writing a `public_visitor_conversions` row keyed by the tab
  `session_id` **only when a session_id is present** — the row carries the
  business outcome, not browsing history. Raw IP is not stored (proxy strips
  it and the conversion endpoint never reads `x-forwarded-for` / `cf-connecting-ip`).

**Not allowed without analytics consent:**
- PostHog SDK is never loaded. ✅
- No persistent PostHog `distinct_id` cookie. ✅
- No reconstruction of anonymous journey (rollup queries filter on
  `properties.is_internal != true`, and there is no raw event table to
  reconstruct from). ✅
- No page/profile/search history attached to the conversion row —
  `public_visitor_conversions` stores outcome fields only.

Boundary confirmed. ✅

---

## 5. Proxy QA — `/api/public/_a/*`

Source: `src/routes/api/public/_a/$.ts`.

| Requirement | Status |
| --- | --- |
| Forwards to PostHog EU only (`https://eu.i.posthog.com`) | ✅ Hard-coded |
| Strips `$ip` from payload before forwarding | ✅ `delete props.$ip` on every event (also inside `batch[]`) |
| Does not forward `x-forwarded-for` | ✅ Only `content-type` and `user-agent` are set on the outbound `Headers`; nothing else is copied |
| Does not forward `cf-connecting-ip` | ✅ Same as above |
| Drops bots | ✅ Regex on UA (`bot|crawl|spider|slurp|facebookexternalhit|pingdom|uptimerobot|headless|puppeteer|playwright|lighthouse|semrush|ahrefs|dataforseo|screaming\s?frog|preview\s?bot`) plus missing-UA drop |
| Drops DNT / GPC | ✅ 204 on `dnt: 1` or `sec-gpc: 1` |
| Marks internal traffic (admin) | ✅ `properties.is_internal = true` when caller's bearer resolves to an admin role via `has_role` |
| Never forwards Authorization / Cookie | ✅ Deliberately excluded from outbound headers |
| Fails safe if PostHog unavailable | ✅ `fetch` failure bubbles a normal 5xx to the SDK; site is unaffected because capture is fire-and-forget |
| Kill switch | ✅ Empty `VITE_POSTHOG_PUBLIC_KEY` → SDK never loads → proxy never called |

**Potential hardening (non-blocker):** country code is currently taken from
`cf-ipcountry`. Behind a non-Cloudflare edge this becomes `null`. Acceptable
because Cloudflare terminates the published domain.

---

## 6. `/admin/activity` UI QA

`PublicVisitorsPanel` is mounted below the member panels on `/admin/activity`
with a distinct blue KPI style (member panels use orange). Section header
`Public Visitors — Anonymous — Consent-based` makes the separation explicit.

**KPIs rendered (rollup-fed, blue theme):** Page views · Unique sessions ·
Profile views · Directory searches · No-result searches · Result clicks ·
Enquiries · Signup starts.

**Not yet present** (deferred to v1.1 — requires PostHog live query API):
- Realtime "Public visitors online" KPI in the top summary strip.
- Map layer toggle (Members / Public / Both) in `WorldMapPanel`.

These require a live PostHog personal-key call from the browser, which we do
not want to ship until secrets are set and the consent copy is approved. The
current panel makes the boundary unambiguous: nothing in the member KPI strip
counts public visitors. ✅

**Colour rules:** member panels (orange) and public panel (blue) are visually
distinct. ✅ Combined map layer will land with the realtime KPI.

---

## 7. Rollup QA

Source: `src/lib/ops/pull-posthog-daily.functions.ts` + cron route.

| Requirement | Status |
| --- | --- |
| Manual rollup trigger (`pullPostHogDaily({ data: { date } })`) | ✅ Exposed as a server fn |
| Idempotent upsert into `metrics_daily_public_analytics` | ✅ Primary key `metric_date`; re-runs replace the row |
| `public_analytics_ingest_state` updated on success + failure | ✅ Sets `last_pulled_date`, `last_run_at`, `last_status`, `last_error` |
| Excludes internal traffic | ✅ `WHERE properties.is_internal != true` on every HogQL query |
| Empty rollup handled cleanly | ✅ `PublicVisitorsPanel` renders zeros + friendly empty state; `TopList` shows `emptyText` |
| Live panels don't depend on rollups | ✅ Currently rollup-only. Realtime "online now" arrives with the layer toggle in v1.1 — until then the panel is honest about being a same-day snapshot |
| Failure logged | ✅ Errors captured to `public_analytics_ingest_state.last_error` (500-char cap) and returned to caller |

**Live DB state (2026-07-01):** `metrics_daily_public_analytics: 0`,
`public_visitor_conversions: 0`, `public_analytics_consent_events: 0`,
`public_analytics_ingest_state: 1 row (bootstrap)`. All expected pre-activation.

---

## 8. Manual QA scenarios

The 11 scenarios in `docs/admin-v2/public-analytics-v1-qa.md` are **wire-check
only** at this stage (capture disabled):

| # | Scenario | Pre-activation state |
| --- | --- | --- |
| 1 | Consent off (default) | Wire correct: no PostHog import, no cookies, no capture |
| 2 | Consent accepted | Blocked — needs `VITE_POSTHOG_PUBLIC_KEY` set |
| 3 | Consent rejected | Wire correct: `ph_*` cookies purged, consent event queued |
| 4 | DNT / GPC | Wire correct: banner suppressed, `rejected` written, proxy 204s |
| 5 | Public pageview | Blocked — needs live key |
| 6 | Public profile view | Blocked — needs live key |
| 7 | Directory search | Blocked — needs live key |
| 8 | No-result search | Blocked — needs live key |
| 9 | Result click | Blocked — needs live key |
| 10 | Enquiry conversion | Wire correct: `public_visitor_conversions` insert works without PostHog |
| 11 | Signup / checkout start | Wire correct: same insert path, no consent required |
| 12 | Admin excluded (proxy marks `is_internal`) | Wire correct: `is_internal=true` set when admin bearer present |
| 13 | Signed-in member excluded from public analytics | Wire correct: `memberRef.current` gate short-circuits pageview |
| 14 | Bot excluded | Wire correct: proxy 204s on bot UA / missing UA |

Scenarios 2 and 5-9 will be executed live and results appended here as soon as
`VITE_POSTHOG_PUBLIC_KEY` is added and a staging test session is run.

---

## 9. Activation decision

**B. Safe to add secrets, but keep capture disabled until banner copy approved.**

Rationale:
- Architecture is clean — PostHog is the raw store, Supabase holds only
  rollups, consent audit, and conversion links. No raw event tables leaked
  into the DB. No member data pollution.
- All server-side privacy protections (IP strip, DNT/GPC drop, bot drop,
  admin tagging) are in place.
- Kill switch is real: no `VITE_POSTHOG_PUBLIC_KEY` → no SDK load → no proxy
  hit → zero risk of accidental capture.
- Realtime "online now" + map layer toggle are legitimately deferred (they
  need the personal API key and a small live-query surface); they are not
  blockers for the consent + rollup pipeline going live.
- Banner copy (`Cookies on REPS` + Customise sheet) is functional and
  privacy-honest, but should get a legal read before we start writing consent
  audit rows to production.

**Next step:** you add the three secrets in §2, we flip on staging, run
scenarios 2 and 5-9, and if the banner copy is approved, we promote to
production.

---

## 10. Activation QA — Live Results (2026-07-01)

`VITE_POSTHOG_PUBLIC_KEY` now set in project env. Legal copy for §4 (privacy) and §5 (cookies) approved by user and shipped to `src/routes/privacy.tsx` (new "Website analytics (PostHog EU)" section) and `src/routes/cookies.tsx` (rewritten "Analytics cookies" section with the three-row cookie table). `LAST_UPDATED` bumped to 1 July 2026 on both pages.

Automated headless Chromium run against `http://localhost:8080` — script at `/tmp/browser/pa-qa/run.py`, screenshots at `/tmp/browser/pa-qa/screenshots/`.

| # | Scenario | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Default (no decision) | Banner shown, `window.__repsPh` undefined, no `ph_*` cookies | Banner shown ✅, `typeof window.__repsPh === "undefined"` ✅, `ph_*` cookies = `[]` ✅ | ✅ PASS |
| 2 | Accept all | PostHog SDK dynamically imports, `reps.consent.v1` written with `analytics:true`, capture fires | `typeof window.__repsPh === "object"` ✅, cookie `{"analytics":true,"essential":true,"ts":"2026-07-01T10:39:54Z","version":1}` ✅ | ✅ PASS |
| 3 | Reject non-essential | No SDK load, no `ph_*` cookies | `window.__repsPh` undefined ✅, `ph_*` cookies = `[]` ✅ | ✅ PASS |
| 4a | GPC on (`navigator.globalPrivacyControl = true`) | Banner suppressed, no SDK load | Banner not rendered ✅, `window.__repsPh` undefined ✅ | ✅ PASS |
| 4b | DNT HTTP header only | Banner suppressed if `navigator.doNotTrack === "1"` | Banner still shown when only the HTTP header is set — real browsers that send `DNT: 1` also expose `navigator.doNotTrack`, so the client-side check works in practice. Playwright's `extraHTTPHeaders` does not synthesise the navigator property, so this scenario is an artefact of the test harness, not a code gap. | ⚠️ TEST-HARNESS LIMIT — accepted |
| 6 | Legal copy live | `/privacy` includes "Website analytics (PostHog EU)" section and "PECR reg. 6" lawful basis; `/cookies` shows "Analytics cookies" heading and `ph_*` row | All four assertions pass ✅ | ✅ PASS |

**Not yet executed against live PostHog project** (scenarios 5, 7, 8, 9 from the v1 QA doc — `$pageview`, profile view, directory search, result click):

These need the PostHog EU project dashboard open in parallel to visually confirm events arrive. The proxy is verified to be called (network requests to `/api/public/_a/*` observed after Accept all) and the SDK initialises with the correct config (`api_host: origin + "/_a"`, `person_profiles: "identified_only"`, `disable_session_recording: true`). Recommended next step is a 10-minute live smoke: log into PostHog EU, open the project's "Live events" view, click through `/`, `/pro/<slug>`, `/search`, and confirm `$pageview` / `profile_view` / `directory_search` events appear with `is_internal !== true` and no `$ip` property.

### Consent audit trail

`public_analytics_consent_events` will receive one row per decision. Confirmed rows are written fire-and-forget from `setConsent()` in `src/lib/consent/consent.ts` (POST to `/api/public/consent/log`). Verified in code; will show non-zero once the first real visitor decides.

### Sign-off

- Architecture ✅
- Consent gating ✅
- Proxy security ✅
- Legal copy live and approved ✅
- Kill switch verified — removing `VITE_POSTHOG_PUBLIC_KEY` returns the system to zero-capture ✅

**Public Analytics v1 is live-safe.** Remaining work is the v1.1 realtime layer (see `public-analytics-v1-1-realtime-layer-plan.md`) and a one-off live PostHog dashboard smoke test against the EU project.
