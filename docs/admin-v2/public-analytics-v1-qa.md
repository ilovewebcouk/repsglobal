# Public Analytics v1 — Manual QA Test Script

Companion to `docs/privacy/public-analytics-v1-plan.md`. Runs against a live preview URL.

## Prerequisites for full-signal test

Until these are supplied, only the **consent banner** and **conversion linking** paths capture data. `$pageview` and other PostHog events no-op silently.

1. `POSTHOG_PUBLIC_KEY` — set via `secrets--add_secret` (client, needs `VITE_` prefix or explicit env pass-through).
2. `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` — server secrets for the daily rollup.
3. Cookie banner copy signed off.

If these aren't set yet, run **Scenarios A, B, F, G, H** only — they exercise the code paths that don't depend on PostHog.

---

## Scenario A — First-time anonymous visitor, no consent

1. Open incognito window → `https://repsuk.org/`.
2. **Expect:** cookie banner visible at bottom. Accept / Reject / Customise buttons present.
3. Do NOT click anything. Navigate to `/pricing`, `/find-a-professional`, `/pro/james-wilson`.
4. Open devtools → Network tab → filter `/_a/`.
5. **Expect:** no requests to `/api/public/_a/*`.
6. Check Supabase: `SELECT count(*) FROM public_analytics_consent_events WHERE choice='rejected' AND occurred_at > now() - interval '5 min';` — 0 (no decision made yet).

## Scenario B — Reject cookies

1. Same session as A. Click **Reject non-essential**.
2. **Expect:** banner disappears. Cookie `reps.consent.v1` set with `{ analytics: false }`.
3. Navigate around 3 pages.
4. **Expect:** no `/api/public/_a/*` requests.
5. Check Supabase: `SELECT choice, dnt, gpc FROM public_analytics_consent_events ORDER BY occurred_at DESC LIMIT 1;` — `rejected`.

## Scenario C — Accept cookies (requires POSTHOG_PUBLIC_KEY)

1. New incognito window → `/`. Click **Accept all**.
2. **Expect:** cookie set with `{ analytics: true }`. Banner disappears.
3. Navigate: `/pricing` → `/find-a-professional` → `/pro/james-wilson`.
4. Network tab: **expect** POSTs to `/api/public/_a/e/` (or `/api/public/_a/i/e/`) — one per pageview.
5. Response 200 each. Devtools application → cookies → `ph_*_posthog` cookie present.
6. Wait 10 minutes. Trigger manual rollup: `curl -X POST -H "apikey: $SUPABASE_ANON_KEY" https://repsuk.org/api/public/cron/pull-posthog-daily -d '{"date":"YYYY-MM-DD"}'`.
7. `SELECT * FROM metrics_daily_public_analytics ORDER BY metric_date DESC LIMIT 1;` — row with `public_page_views >= 3`.

## Scenario D — DNT / GPC forced reject

1. Incognito → enable "Do Not Track" in browser (Firefox Preferences → Privacy). Open `/`.
2. **Expect:** banner does NOT appear. Cookie set automatically with `analytics: false`, DNT flag `true`.
3. Navigate around. No `/_a/*` requests.
4. `SELECT dnt, gpc, choice FROM public_analytics_consent_events ORDER BY occurred_at DESC LIMIT 1;` — `dnt=true, choice=rejected`.

## Scenario E — Admin excluded

1. Sign in as an admin (`cruz.pt@icloud.com`). Visit any public route like `/pro/james-wilson`.
2. **Expect:** no cookie banner (member route detection).
3. If PostHog is live, admin bearer would tag the proxied event with `is_internal=true`; rollup query excludes those.

## Scenario F — Enquiry conversion linked to anonymous session (no PostHog required)

1. Incognito → accept cookies (or reject — this path fires regardless).
2. `/pro/james-wilson/enquire` → fill form → submit.
3. `SELECT event_kind, session_id, enquiry_id, path FROM public_visitor_conversions ORDER BY occurred_at DESC LIMIT 1;`
4. **Expect:** row with `event_kind='enquiry_created'`, `session_id` matches sessionStorage `reps.public.session_id`, `enquiry_id` populated, `path='/pro/james-wilson/enquire'`. **No raw IP.**

## Scenario G — Consent audit trail

1. Perform Scenario B (reject).
2. `SELECT session_id, choice, scopes, dnt, gpc, country_code, ua_hash FROM public_analytics_consent_events ORDER BY occurred_at DESC LIMIT 5;`
3. **Expect:** rows present with `ua_hash` (24-char hex), no raw UA anywhere.

## Scenario H — Kill switch

1. Rename `src/routes/api/public/_a/$.ts` → `.disabled`. Deploy.
2. Accept banner in new incognito. Navigate.
3. **Expect:** `/_a/*` requests return 404. Nothing lands in PostHog.
4. Restore file.

## Scenario I — Bot filter

1. `curl -A "Googlebot/2.1" -X POST https://repsuk.org/api/public/_a/e/ -H "content-type: application/json" -d '{"event":"$pageview","properties":{}}'`
2. **Expect:** 204 No Content. Nothing forwarded.

## Scenario J — RLS

1. As a non-admin authenticated user in SQL editor: `SELECT count(*) FROM public_visitor_conversions;` — expect permission error / 0 rows.
2. As anon: `SELECT count(*) FROM metrics_daily_public_analytics;` — expect 0 rows (RLS blocks).
3. As admin: both queries succeed.

## Scenario K — /admin/activity Public Visitors panel

1. Sign in as admin → `/admin/activity`.
2. **Expect:** "Public visitor analytics" section between KPI strip and row 2.
3. If POSTHOG_PERSONAL_API_KEY is missing, amber "PostHog not yet configured" banner shows with clear next steps.
4. Cards show KPI tiles (Page views, Sessions, Profile views, Enquiries created); top lists for pages/profiles/no-result searches/referrers/countries.
5. Data reflects `metrics_daily_public_analytics` + `public_visitor_conversions` from the last 24h/7d.

---

## Automated regression checks (recommended follow-up)

- Playwright: anonymous visit → accept → navigate 3 pages → verify network POSTs land at `/_a/*` and daily rollup can be triggered.
- Playwright: signed-in member visit → confirm CookieBanner doesn't render, member `user_sessions` still populates.
- SQL diff: assert `SELECT count(*) FROM auth_events` and `SELECT count(*) FROM user_sessions` are unchanged after 100 anonymous page views (public capture must not pollute member tables).

## Sign-off

- [ ] Scenarios A, B, D, E, F, G, H, J, K pass with PostHog **not yet configured** (foundations layer).
- [ ] Scenarios C, I pass after PostHog is configured.
- [ ] Privacy plan + banner copy approved by founder.
- [ ] `/privacy` amendment published.
