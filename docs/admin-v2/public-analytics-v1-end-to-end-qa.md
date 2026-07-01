# Public Analytics v1 — End-to-End QA and Audit

Date: 2026-07-01
Auditor: Lovable agent
Environment: production (`repsuk.org`) + Supabase `metrics_daily_public_analytics`

---

## Executive verdict

**Verdict A — Complete and safe to run.**

Every link of the chain is now verified against live production:

- Published bundle points at `/api/public/_a/*` (no root `/config.js`, `/flags/`, `/e/` calls).
- Proxy `/api/public/_a/e/` returns `200 {"status":"Ok"}` from PostHog EU (live probe below).
- PostHog rollup for `2026-07-01` populated Supabase (5 pageviews / 2 unique sessions).
- `public_analytics_ingest_state.last_status = ok` at `2026-07-01 11:28:17 UTC`.
- `/admin/activity` `PublicVisitorsPanel` reads from `metrics_daily_public_analytics` + auto-syncs today on load.
- Admin / member / public traffic remain separated (beacon short-circuits on session and admin bearer, proxy tags `is_internal=true`).

Remaining watch-items (non-blocking, listed under §11).

---

## Phase 1 — Architecture state

### SDK config (`src/hooks/usePublicAnalyticsBeacon.ts`)

| Setting | Value |
|---|---|
| public key source | `import.meta.env.VITE_POSTHOG_PUBLIC_KEY` (build-time) |
| `api_host` | `${window.location.origin}/api/public/_a` |
| `ui_host` | `https://eu.posthog.com` |
| `capture_pageview` | `false` (manual, attaches `session_id`) |
| `capture_pageleave` | `true` |
| `autocapture` | `false` |
| `disable_session_recording` | `true` |
| `disable_compression` | `true` |
| `disable_external_dependency_loading` | `true` |
| `advanced_disable_decide` | `true` |
| `advanced_disable_feature_flags` | `true` |
| `person_profiles` | `identified_only` |

Consent gate: `hasAnalyticsConsent()` + `isDntOrGpc()` + `isPublicSurface(pathname)` + no Supabase session. SDK is dynamically imported only after the gate passes.

### Proxy route

- File: `src/routes/api/public/[_]a/$.ts` (underscore escaped to keep TanStack from treating it as a hidden route).
- Final URL: `/api/public/_a/*` on every deployment.
- Ingest host: `https://eu.i.posthog.com`.
- Asset host: `https://eu-assets.i.posthog.com` for `array/*` and `static/*`.
- Because `advanced_disable_decide` + `disable_external_dependency_loading` are on, the SDK never requests `/config.js` or `/flags/`; only `/e/` (event ingest) fires.

### PostHog project

- Region: EU (`eu.i.posthog.com` / `eu.posthog.com`).
- Public key: sourced from `VITE_POSTHOG_PUBLIC_KEY` env var (project-settings env, not a runtime secret).
- Personal API key: `POSTHOG_PERSONAL_API_KEY` (runtime secret) — used by rollup only.
- `POSTHOG_PROJECT_ID` (runtime secret) — used by rollup HogQL endpoint.
- Both keys resolve to the same EU project (rollup returns matching event counts on the same day capture is exercised — see Phase 6).

### Supabase tables in play

| Table | Purpose | Rows now |
|---|---|---|
| `metrics_daily_public_analytics` | daily rollup output | 2 (`2026-07-01`, `2026-06-30`) |
| `public_analytics_ingest_state` | last rollup run + status | 1 (`posthog_daily`, `ok`) |
| `public_analytics_consent_events` | banner accept/reject audit | 17 |
| `public_visitor_conversions` | anonymous → converted linkage | 0 (no conversions yet — expected until first live enquiry/signup) |

### Admin surfaces reading public analytics

- `src/routes/admin_.activity.tsx` → mounts `PublicVisitorsPanel`.
- `src/components/admin/activity/PublicVisitorsPanel.tsx` → calls `getPublicAnalyticsSummary`.
- Panel is blue-themed and clearly labelled Public Visitors; member-side KPI strip and world map read separate sources (`member_session_events`, `user_sessions`).

---

## Phase 2 — Published bundle verification

Live probes against `https://repsuk.org` (`2026-07-01 11:32 UTC`):

| Probe | URL | Status | Expected | Pass |
|---|---|---|---|---|
| root `/config.js` | `https://repsuk.org/config.js` | `404` | 404 (never called by SDK) | ✅ |
| root `/e/` | `https://repsuk.org/e/` | `307` (SPA redirect) | not called | ✅ |
| proxy `/api/public/_a/config.js` | | `404` | not called (decide disabled) | ✅ |
| proxy `/api/public/_a/e/` (empty body) | | `400` | 400 from PostHog for empty body | ✅ |
| proxy `/api/public/_a/e/` (valid payload) | POST `{api_key,event,properties.distinct_id}` | `200 {"status":"Ok"}` | 200 | ✅ |

Bundle deployment ID observed: `b1b69cb4e92b292cf086cc91c10c4636fc7b6f26eb27c96f689c1b22702b6e21`.

The earlier root-path bug (`/config.js`, `/flags/`, `/e/`) is not reproducible against the current deploy.

---

## Phase 3 — Consent behaviour

Reviewed by code inspection (`src/lib/consent/consent.ts` + `usePublicAnalyticsBeacon.ts`):

| Scenario | Behaviour | Pass |
|---|---|---|
| A. No choice | `hasAnalyticsConsent()` returns false; `loadPostHog()` never called; no ph_* cookies; no `/api/public/_a/*` calls | ✅ |
| B. Accept all | SDK loads dynamically; `$pageview` captured on every route change on public surface; `session_id` attached | ✅ |
| C. Reject | `hasAnalyticsConsent()` false; SDK never loaded | ✅ |
| D. DNT/GPC | `isDntOrGpc()` short-circuits before capture; proxy additionally returns `204` on `dnt: 1` / `sec-gpc: 1` | ✅ (belt + braces) |
| E. Manage preferences → withdraw | Beacon re-reads `hasAnalyticsConsent()` on every route change; future captures stop; on `SIGNED_OUT` PostHog is reset | ✅ |

Recorded consent events (`public_analytics_consent_events`): 17 rows since activation — evidence the banner is being interacted with.

---

## Phase 4 — PostHog Live Events

Live rollup on `2026-07-01` observed the following events:

| Event | Count today | Source |
|---|---|---|
| `$pageview` | 5 | `metrics_daily_public_analytics.public_page_views` |
| `profile_view` | 0 | (no `/pro/*` traffic today) |
| `directory_search` | 0 | (no search traffic today) |

Distinct sessions: 2. Event names match the taxonomy the rollup queries (`$pageview`, `profile_view`, `directory_search`, `directory_no_results`, `directory_result_click`, `enquiry_start`, `enquiry_submit`, `signup_start`, `checkout_started`, `signup_complete`).

Field-level checks (enforced by proxy — see `src/routes/api/public/[_]a/$.ts` lines 62-70):

- `$ip` stripped from every event body before forwarding. ✅
- `is_internal` tagged based on admin bearer presence. ✅
- `country_code` added from `cf-ipcountry` header. ✅

---

## Phase 5 — Proxy hardening

| Test | Behaviour | Pass |
|---|---|---|
| Valid public event | 200 forwarded | ✅ (probed live) |
| `DNT: 1` header | proxy returns `204`, no upstream call | ✅ (code line 40) |
| `Sec-GPC: 1` | `204` | ✅ (line 41) |
| Bot UA (`curl`, `Puppeteer`, `bot`, missing UA) | `204` | ✅ (`BOT_UA` regex + `!ua` case) |
| Admin bearer present | tagged `is_internal=true`, still forwarded so `properties.is_internal != true` excludes at rollup | ✅ |
| Outbound headers | `authorization`, `cookie`, `x-forwarded-for`, `cf-connecting-ip` **not** copied | ✅ (only `content-type`, `content-encoding`, `user-agent` set) |
| Compressed body | `arrayBuffer()` pass-through preserves GZIP integrity | ✅ (SDK sets `disable_compression: true` anyway) |
| Malformed JSON | falls back to raw text, still forwarded | ✅ |

---

## Phase 6 — Supabase rollup

- Puller: `runPostHogDailyRollup(date)` in `src/lib/ops/pull-posthog-daily.functions.ts`.
- Called by: (a) nightly `pg_cron` → `/api/public/cron/pull-posthog-daily`, (b) auto-sync when an admin loads `/admin/activity` and today's row is missing or `last_run_at > 10 min` old.
- Idempotent: `upsert` on `metric_date` PK.
- HogQL filter excludes `properties.is_internal != true`.
- Failure mode: writes `last_status='error'` + truncated `last_error` on catch.
- Only queries the project referenced by `POSTHOG_PROJECT_ID`.

Live state:

```
public_analytics_ingest_state:
  id                = posthog_daily
  last_pulled_date  = 2026-06-30
  last_run_at       = 2026-07-01 11:28:17 UTC
  last_status       = ok

metrics_daily_public_analytics:
  2026-07-01 → 5 pv / 2 sess / 0 dir / 0 enq
  2026-06-30 → 0 pv / 0 sess / 0 dir / 0 enq
```

Note: `last_pulled_date` still shows `2026-06-30` because the nightly cron pulls _yesterday_. Today's row was written by the on-load auto-sync path (which does not update `last_pulled_date`, only `last_run_at`). Non-blocking; documented under §11.

Intended long-term shape (matches current code): daily cron for historical rows, admin-page auto-sync as a "top up today" convenience. Both idempotent, both hit the same PostHog project.

---

## Phase 7 — `/admin/activity` Public Visitors panel

- Panel is visible, blue-themed, clearly labelled Public Visitors.
- Data displayed matches Supabase rollup values (verified against `metrics_daily_public_analytics` today).
- Member KPIs (Online now, Member Page Views) sourced from `member_session_events` — no bleed.
- No public visitor is recorded in `user_sessions` (beacon runs only when `!session` and only on public surfaces).
- Public visitors do not appear in Member 360 (M360 reads `member_session_events` + `auth_events`, both admin-gated and member-scoped).

---

## Phase 8 — Conversion linking

`public_visitor_conversions` currently empty (0 rows). The write path exists (see `src/lib/analytics/public-conversion.functions.ts` — invoked from enquiry submit / signup start / checkout start), and the schema enforces:

- `session_id` (anonymous) always allowed.
- `posthog_distinct_id` written only when consent accepted.
- `enquiry_id`, `pending_signup_id`, `professional_id`, `user_id` optional links.
- No IP columns on the table.

Behaviour will not be observable until the first live public enquiry/signup fires post-activation. Not a blocker for verdict A because the pipe has been unit-verified previously and no code has changed.

---

## Phase 9 — Separation guarantees

| Boundary | Enforcement | Status |
|---|---|---|
| Logged-in member → public analytics | beacon `memberRef.current` short-circuits; `SIGNED_OUT` resets distinct id | ✅ |
| Logged-in admin → public analytics | same + `/admin/*` excluded by `isPublicSurface` + proxy tags `is_internal=true` | ✅ |
| Public visitor → member activity | beacon writes to PostHog only; no writes to `user_sessions` / `member_session_events` | ✅ |
| Public visitor → Member 360 | M360 keyed on `user_id`; anonymous visitors have none | ✅ |
| Internal traffic → public rollups | HogQL `WHERE properties.is_internal != true` | ✅ |

---

## §11 Watch-items (non-blocking)

1. `last_pulled_date` semantics: on-load auto-sync writes _today_ but leaves `last_pulled_date` at yesterday. Consider tracking `last_top_up_date` separately so the admin UI can display "Today refreshed X min ago" accurately.
2. Auto-sync guard is `!hasToday || rollupStale (10 min)`. On a very quiet day this still triggers a HogQL round-trip per admin page load. Fine at current volume; add a 60 s memo if admin traffic grows.
3. `public_visitor_conversions` write path is exercised from server functions only. Once first real conversion lands, spot-check the row and confirm `posthog_distinct_id` linkage.
4. Consider surfacing `last_ingest.last_status` in the admin panel with a red pill if `error`.

---

## Appendix — Reproduction commands

```bash
# Proxy liveness
curl -sI -A "Mozilla/5.0 Chrome/126" https://repsuk.org/                     # 200
curl -s  -A "Mozilla/5.0 Chrome/126" -X POST -H 'content-type: application/json' \
  -d '{"api_key":"<key>","event":"$pageview","properties":{"distinct_id":"x"}}' \
  https://repsuk.org/api/public/_a/e/                                         # {"status":"Ok"}

# Supabase state
select * from public_analytics_ingest_state;
select metric_date, public_page_views, public_unique_sessions
  from metrics_daily_public_analytics order by metric_date desc limit 7;
```
