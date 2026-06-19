## Problem

`/admin/memberships` is reading **sandbox** subscriptions, not your live Stripe account. That's why Heather Long (live, trialing Pro) doesn't appear, and why the Pro card shows "8 active · 0 trialing".

Root cause: `currentBillingEnv()` in `src/lib/admin/billing-metrics.ts` defaults to `"sandbox"` unless a `BILLING_ENV=live` env var is set. That env var isn't set in this project, so every query on the page is filtered to `environment = 'sandbox'`.

Real subscription counts in the database:

| environment | tier | status | count |
|---|---|---|---|
| live | verified | active | 1 |
| live | pro | active | 1 |
| live | pro | trialing | 3 |
| sandbox | pro | active | 8 |

## Fix

1. **Flip the default in `currentBillingEnv()`** from `"sandbox"` to `"live"`. Sandbox becomes opt-in (`BILLING_ENV=sandbox`), live is the default for the admin dashboards. This is the safe default for a production Stripe account.

2. **Add a small env badge to the page header** on `/admin/memberships` so it's always visible which environment the numbers reflect. Shown as a subtle pill next to the page title:
   - `Live` — emerald status token, only shown when env is live (the normal case).
   - `Sandbox` — orange/amber pill, only shown when env is sandbox (to make accidental sandbox views obvious).

3. **No other changes** to the query logic, KPI cards, tier cards, forecast chart, upcoming/past-due panels, or activity feed. They already compute correctly once the right env is selected.

## After the fix, the page will show

- Verified card: 1 active
- Pro card: 1 active · 3 trialing  (Heather Long + 2 others)
- Studio card: 0
- Upcoming payments / Past due / forecast: recalculated from live data
- A small "Live" badge in the page header

## Out of scope

- No changes to `/admin/payments`, `/admin/stripe`, public routes, checkout, or BD migration logic.
- No Stripe API calls; still read-only against the local synced tables.
- No data migration. Existing sandbox rows stay where they are and remain accessible by setting `BILLING_ENV=sandbox` if ever needed.

## Files touched

- `src/lib/admin/billing-metrics.ts` — flip default in `currentBillingEnv()`.
- `src/routes/admin_.memberships.tsx` — add env badge to the header row.
