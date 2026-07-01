
# Public Analytics v1 — Build Plan

You picked **PostHog EU + Supabase rollups (Accepted plan)** + **Consent-required** + **Full 11 phases in one pass**. The 11-phase spec was written assuming Supabase-only capture, so this plan reconciles the two: PostHog is the raw-event store, Supabase holds the rollups + conversion links + admin surfaces. Member/admin activity is untouched.

## Prerequisites you must supply before Phase 3 can go live

These block real capture. I can build code + docs without them, but no events will flow until they exist:

1. **PostHog Cloud EU project** — project API key + host URL. Add via `secrets--add_secret` as `POSTHOG_PUBLIC_KEY` (client) and `POSTHOG_PROJECT_API_KEY` (server, for the daily HogQL pull).
2. **`a.repsuk.org` CNAME** pointing to `eu.i.posthog.com` (first-party proxy origin). Until this exists, the proxy at `/api/public/_a/*` still works via same-origin `repsuk.org`, so we can ship without it and swap later.
3. **Cookie-banner copy sign-off** — draft included in Phase 0 doc. You approve before I flip capture on.
4. **Privacy notice update** — one-paragraph amendment to `/privacy` for PostHog + first-party proxy.

I will build all code paths gated so nothing captures until (1) + (3) land.

## Architecture (final)

```text
Browser (consent.analytics === 'accepted')
  └─ posthog-js (api_host = https://repsuk.org/_a) ── all raw events
       └─ /api/public/_a/*  (our proxy: strips IP, drops bots/DNT/GPC, tags is_internal for admins)
            └─ PostHog Cloud EU  (12-month retention)
                 └─ 04:00 UTC daily pull (createServerFn cron)
                      └─ public.metrics_daily_public_analytics  (Supabase rollup, admin-read)

Browser (conversion moments: enquiry_submit / signup_complete / checkout_started)
  └─ POST /api/public/activity/public-conversion  (same-origin, no PostHog required)
       └─ public.public_visitor_conversions  (links anonymous_id → enquiry_id / pending_signup_id / user_id)
```

- **Member activity pipeline** (`user_sessions`, `member_session_events`, `auth_events`) — untouched.
- **Admin activity** — server-side `has_role` check on the proxy sets `is_internal:true`, PostHog + rollups filter it out.
- **Raw IP** never reaches PostHog and never reaches Supabase — only `ip_hash` (HMAC-SHA256 with rotating salt) is stored on conversion rows.

## Phase-by-phase mapping

### Phase 0 — Privacy plan (doc only, no code)
- Write `docs/privacy/public-analytics-v1-plan.md` covering: what's captured, consent model (opt-in, DNT/GPC = auto-reject), storage (PostHog EU + Supabase rollups), retention (raw 365d in PostHog, rollups indefinite, conversions per enquiry policy), account-deletion impact, banner copy for your approval.
- Update `docs/admin-v2/public-analytics-architecture-decision.md` status → **In progress (v1)**.

### Phase 1 — Tables (single migration)
Supabase-side, admin-read only, service-role write:

- `public.public_visitor_conversions` — anonymous_id, session_id, posthog_distinct_id, event_kind (`enquiry_created` | `signup_started` | `checkout_started` | `signup_complete`), enquiry_id, pending_signup_id, user_id, professional_id, path, referrer, country_code, device, browser, ip_hash, occurred_at.
- `public.metrics_daily_public_analytics` — as per your spec (metric_date PK, page_views, profile_views, unique_sessions, searches, no_result_searches, result_clicks, enquiries_created, signup_starts, checkout_starts, top_pages/profiles/searches/referrers/countries/devices jsonb).
- `public.public_analytics_ingest_state` — last successful PostHog pull cursor.
- `public.public_analytics_consent_events` — audit trail of accept/reject/withdraw (session_id, choice, ua_hash, occurred_at). No PII.

Grants: `service_role` ALL; `authenticated` SELECT only via `has_role(auth.uid(),'admin')` RLS. No anon.

I am **not** creating `public_analytics_events` or `public_visitor_sessions` as raw tables — PostHog owns raw storage per the Accepted decision. This is the deliberate divergence from your spec text.

### Phase 2 — Consent layer (real code, always safe to ship)
- `src/lib/consent/consent.ts` — read/write `reps.consent.v1` cookie (12-month). Scopes: `analytics`, `essential`. Default = rejected. DNT/GPC → forced reject.
- `src/components/consent/CookieBanner.tsx` — Accept / Reject / Customise. Public routes only, never on `/admin/*` or `/dashboard`. Uses shadcn.
- `src/routes/cookies.tsx` (already exists) — extend with a "Manage preferences" button that reopens the banner.
- Footer link "Cookie preferences".
- Logs choice to `public_analytics_consent_events` via `/api/public/consent/log`.

### Phase 3 — First-party PostHog proxy
- `src/routes/api/public/_a/$.ts` — POST proxy to PostHog EU. Strips `$ip`, drops DNT/GPC (204), drops bot UAs, sets `is_internal:true` when caller has admin role, adds `country_code` from CF header. GET passes through for `/decide`/`/e`.

### Phase 4 — Beacon (`usePublicAnalyticsBeacon`)
- New hook `src/hooks/usePublicAnalyticsBeacon.ts`. Loads `posthog-js` **only after** `consent.analytics === 'accepted'`. Never runs on `/admin/*`, never for signed-in members, never during impersonation. Mounted in `__root.tsx` **beside** `useActivityBeacon` — they check disjoint conditions (member vs anonymous), no collision.
- `session_id` in sessionStorage. `anonymous_id` = PostHog distinct_id, persisted in `ph_*` cookie only if consent accepted.

### Phase 5 — Event instrumentation (all consent-gated via the beacon)
Wire `posthog.capture(...)` at:
- `$pageview` — automatic on route change.
- `directory_search` / `directory_no_results` / `directory_result_click` — in `src/routes/in.$location*.tsx`, `professions.$profession.tsx`, search components.
- `profile_view` / `profile_cta_click` — `src/routes/pro.$slug.tsx`.
- `enquiry_start` / `enquiry_submit` — `src/routes/pro.$slug.enquire.tsx`.
- `signup_start` / `signup_complete` — `src/routes/signup.tsx` + `checkout.return.tsx`.
- `pricing_view`, `city_page_view`, `profession_page_view`, `gym_view`, `cpd_view` — respective route files.
- `posthog.alias(userId, anonId)` on `signup_complete`.

### Phase 6 — Conversion linking (Supabase-side, works without consent)
- `src/routes/api/public/activity/public-conversion.ts` — writes to `public_visitor_conversions`. Called from enquiry-submit + signup + checkout flows with the anon session_id (which we can generate for conversion even without analytics consent, because it's tied to a first-party action the user just performed — documented in Phase 0 doc as "legitimate interest, session-scoped").
- Backfill: on `enquiry_submit`, mark matching row `converted_to_enquiry=true`. On paid checkout webhook (`stripe/checkout.session.completed`), set `converted_to_user_id`.

### Phase 7 — Daily rollup cron
- `src/lib/ops/pull-posthog-daily.functions.ts` — server fn hitting PostHog HogQL API, aggregating yesterday's events by event_name + breakdown, upserting `metrics_daily_public_analytics`.
- Scheduled via pg_cron calling `/api/public/cron/pull-posthog` with `CRON_SECRET` header (existing pattern).

### Phase 8 — Admin UI (`/admin/activity`)
- Add segmented control at top: **Realtime · Members · Public visitors · Business events · Needs attention**.
- New `PublicVisitorsPanel` — reads live from PostHog `/live_events` (5s poll) via a proxied server fn: online sessions, current path, referrer, country, device.
- Realtime summary strip gets two new tiles: **Public visitors online**, **Public page views 24h**.
- Map: add layer toggle (Members / Public / Both). Member bubbles orange (existing), public bubbles **blue** (`#3B82F6`). Both = stacked with mixed halo.
- New right-rail widgets (all from `metrics_daily_public_analytics` + live PostHog):
  - Public pages being viewed now
  - Top public pages (7d)
  - Top public profiles (7d)
  - Directory search activity + no-result searches (alerted)
  - Top referrers / landing pages
  - Public conversion funnel (page → profile → enquiry; pricing → signup → checkout → paid)
- Every panel labelled **"Public visitor"** to prevent confusion with member analytics.

### Phase 9 — Retention
- PostHog project retention = 365 days (config in PostHog UI — I'll document, you set).
- Supabase: nightly job in the same cron function deletes `public_visitor_conversions` older than 400 days (matches enquiry retention).
- Consent-events kept 24 months for audit.

### Phase 10 — QA
- `docs/admin-v2/public-analytics-v1-qa.md` — repeatable test script covering: no-consent (nothing captured), consent-accepted (all events flow), DNT/GPC forced-reject, admin excluded, bot excluded, profile view, search, no-result search, result click, enquiry link-back, signup link-back.
- Playwright smoke: incognito visitor → accept banner → navigate 3 pages → verify `metrics_daily_public_analytics` gets the rollup after manual cron trigger.
- Typecheck.

### Phase 11 — Screenshots
Delivered at end: activity page with layer toggle, map with GB public bubble, public-visitors-online panel, top public pages, directory-search panel, referrers, conversion funnel, consent-off vs consent-on states.

## What I'm explicitly NOT doing

- Not creating `public_analytics_events` raw table — PostHog is source of raw. Divergence from your spec, matches Accepted decision.
- Not touching `user_sessions` / `member_session_events` / `auth_events` / Member 360 / billing / visibility.
- Not shipping GA4.
- Not enabling capture before you approve the banner copy.

## Risk / rollback

- All new code is behind consent check → cannot pollute member analytics.
- Kill switch: delete `src/routes/api/public/_a/$.ts` — all capture stops immediately, no redeploy of app code needed elsewhere.
- Rollup cron is idempotent (upsert on `metric_date`).

## Order of shipping in this pass

1. Migration (Phase 1) + doc (Phase 0).
2. Consent banner + cookie API (Phase 2).
3. Proxy route + beacon hook (Phases 3–4), gated OFF at `consent === 'accepted'`.
4. Event instrumentation (Phase 5).
5. Conversion linking endpoint + hooks into enquiry/signup/checkout (Phase 6).
6. Cron + rollup fn (Phase 7).
7. Admin UI additions (Phase 8) — reads from PostHog live + Supabase rollups.
8. QA script + typecheck + screenshots (Phases 10–11).

Approve this plan and I will execute end-to-end. If you don't yet have the PostHog project or CNAME, I still build everything; capture stays dormant until you paste `POSTHOG_PUBLIC_KEY` via `add_secret` and approve banner copy.
