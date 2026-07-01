# Public Analytics v1 — Privacy Plan

**Status:** Approved (2026-07-01) — supersedes the "deferred" note in `public-analytics-v1-1-plan.md`.
**Architecture:** PostHog EU + Supabase rollups (per `docs/admin-v2/public-analytics-architecture-decision.md`).
**Consent posture:** Opt-in, DNT/GPC = auto-reject.

## What is captured

| Layer | Contents | Store | Retention |
| --- | --- | --- | --- |
| Anonymous behavioural events (`$pageview`, `profile_view`, `directory_search`, `directory_result_click`, `enquiry_start`, `enquiry_submit`, `signup_start`, `signup_complete`, `pricing_view`, `city_page_view`, `profession_page_view`, `checkout_started`) | Path, referrer, UTM, country (from Cloudflare header), device family, PostHog distinct_id, session_id | **PostHog Cloud EU** (via first-party proxy) | 365 days raw, then aggregate-only |
| Daily aggregates (top pages/profiles/searches/referrers/countries/devices, totals) | Numeric + top-N JSON | `public.metrics_daily_public_analytics` | Indefinite |
| Conversion links (anon session → enquiry / signup / checkout / paid) | session_id, PostHog distinct_id, enquiry_id, pending_signup_id, user_id, professional_id, path, referrer, HMAC-hashed IP | `public.public_visitor_conversions` | 400 days |
| Consent choices | session_id, choice (accept/reject/withdraw/customise), scopes, DNT/GPC flags, HMAC-hashed UA | `public.public_analytics_consent_events` | 24 months (audit) |

**Never stored:** raw IP, raw User-Agent, cookies containing PII, email, name, phone.

## Consent model

- **Default:** rejected. No PostHog SDK loaded, no distinct_id created.
- **Cookie banner:** `<CookieBanner />` on every public route, hidden on `/admin/*` and `/dashboard`. Three actions: **Accept**, **Reject**, **Customise**.
- **Storage:** first-party cookie `reps.consent.v1` (12 months) storing `{ analytics: boolean, essential: true, ts: iso }`.
- **DNT / GPC:** if either header is set, banner does not show and analytics is forced-rejected. Reachable from footer "Cookie preferences" for the user to override.
- **Existing logged-in members:** default to rejected until they choose (banner shown once on next public route visit).
- **Withdrawal:** "Cookie preferences" link in footer + `/cookies` page reopens the banner. Withdrawal purges PostHog distinct_id and clears `ph_*` cookies.

## Conversion linking without full analytics consent

`public_visitor_conversions` writes fire even when analytics consent is rejected, but only on **first-party actions the user has just performed** (submitting an enquiry, starting signup, initiating checkout). Legal basis: legitimate interest, session-scoped, no cross-site tracking, no cookies created for this purpose. Session_id lives in `sessionStorage` and dies with the tab. Documented per ICO Cookies and Similar Technologies Guidance §3.4.

## Loading order

1. Page renders. Beacon hook checks: signed-in? admin? impersonation? on `/admin/*`? → if any, no-op forever.
2. Beacon checks `reps.consent.v1`. If missing → show banner (public routes only).
3. On accept, beacon dynamically imports `posthog-js`, initialises with `api_host = window.location.origin + '/_a'`, captures `$pageview`, and starts route tracking.
4. On reject or DNT/GPC, beacon writes rejected consent event via `/api/public/consent/log` and does nothing else.

## Proxy behaviour (`/api/public/_a/*`)

- Strips any client-supplied `$ip` from event body before forwarding.
- Sets `properties.is_internal = true` when the request carries an admin bearer.
- Drops requests with `DNT: 1` or `Sec-GPC: 1` (returns 204).
- Drops requests whose User-Agent matches known bot patterns (returns 204).
- Adds `properties.country_code` from `CF-IPCountry` header (server-side, not visitor-provided).
- Forwards to `https://eu.i.posthog.com/*` with no additional cookies.

## Admin access

Admins reading Public Visitor panels in `/admin/activity`:
- See aggregate numbers and top-N lists from `metrics_daily_public_analytics`.
- See live "who's on now" from PostHog `/live_events` — session_id, current path, country, device only. No PII.
- See conversion outcomes linked to real enquiries/signups (which they can already access via Member 360 / enquiries console).

Admins never see raw IPs or User-Agents.

## Account deletion impact

When a user deletes their account:
- `public_visitor_conversions` rows are anonymised: `user_id`, `enquiry_id`, `pending_signup_id` set to NULL. Session-level analytic data (path, country, device) retained for aggregate integrity.
- PostHog: distinct_id is issued a deletion request via PostHog's API.

## Bot filtering

- Server-side UA regex drops known crawler UAs at the proxy (204 without forwarding).
- PostHog `$bot` filter enabled in project settings.
- Any session with >10 events/sec is discarded server-side.

## Banner copy (draft for your sign-off)

**Title:** Cookies on REPS.

**Body:** We use a small number of essential cookies to make REPS work, and — if you agree — analytics cookies to understand which parts of the site help pros and clients most. We don't sell your data and we don't use advertising cookies.

**Buttons:** Accept all · Reject non-essential · Customise

**Customise sheet:**
- Essential cookies (always on) — sign-in, account preferences, security. Cannot be disabled.
- Analytics cookies (opt-in) — anonymous, aggregate site usage via our first-party proxy to PostHog EU. Used to improve pages and search. Never shared with advertisers.

## Rollout

1. Deploy tables + code (this pass).
2. **You approve banner copy** and add `POSTHOG_PUBLIC_KEY` via `secrets--add_secret`. Until then, beacon returns early without loading PostHog.
3. Add `/privacy` amendment paragraph.
4. Turn on PostHog project retention = 365 days in PostHog UI.
5. Optional: add `a.repsuk.org` CNAME → `eu.i.posthog.com` and switch `api_host`. Not required — same-origin `/_a/*` proxy is what avoids tracking-blocker loss.

## Kill switch

Delete `src/routes/api/public/_a/$.ts` — all capture stops immediately. Beacon requests will 404, silently.
