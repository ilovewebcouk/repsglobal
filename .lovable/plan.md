## Why the forecast misses BD migration renewals

The current forecast in `src/lib/admin/overview.functions.ts` reads from `bd_migration` and filters on `bd_renewal_date` + `bd_price_pence`. I queried the table:

- 390 rows, all `status = 'seeded'`
- `bd_renewal_date` is **NULL on all 390**
- `bd_price_pence` is **NULL on all 390**

So the `if (!m.bd_renewal_date) continue;` short-circuits every row and the forecast contribution is always £0. The migration table was never the source of truth for renewal anchors — it's a workflow ledger. The real anchors live elsewhere:

- `legacy_stripe_link.access_expires_at` — 13 rows fall in the next 30 days. This is what the renewal job in `stripe-linking.functions.ts` already uses to trigger a £99 charge.
- `bd_member_seed.bd_next_due_date` — 28 rows fall in the next 30 days. Used as the anchor for seeds not yet linked to a Stripe customer.

## What to change

Single, contained edit to the forecast block (no other KPI math touched).

### 1. `src/lib/admin/overview.functions.ts` (forecast section, ~lines 190-204)

Replace the `bd_migration` query with this rollup, applied in order so each member is counted exactly once:

1. **Active `subscriptions`** with `current_period_end` in the next 30 days — unchanged, already correct.
2. **`legacy_stripe_link`** rows where `access_expires_at` is in the window AND the user does **not** already have an active subscription captured in step 1. Amount = `TIER_RENEWAL_PENCE['verified']` (£99) — the price the renewal job actually charges. Track which `user_id` / `email` we've already counted in a `Set`.
3. **`bd_member_seed`** rows where `bd_next_due_date` is in the window AND the seed's email/member is not already counted in step 1 or 2. Amount = £99. This catches members who haven't been linked to a Stripe customer yet but whose anniversary still falls in the window.

Bucket each contribution into `fcastBuckets` using the renewal date so the Forecast sparkline / chart picks it up.

### 2. `src/lib/admin/reconciliation.functions.ts` `getForecastReconciliation` (~lines 600-735)

Mirror the same three-source logic so `/admin/reconciliation#forecast` shows exactly what the KPI tile sums:

- Keep the existing Subscriptions table.
- Replace the `bd_migration` table with two new tables: **Legacy Stripe links** (columns: email, customer id, access_expires_at, amount, included/excluded, reason) and **BD member seeds** (columns: email, bd_next_due_date, claimed_user_id, amount, included/excluded, reason).
- Common exclusion reasons to surface: `no renewal date`, `outside window`, `already counted via active subscription`, `already counted via legacy_stripe_link`.
- Update `total_forecast_pence` to sum subs + links + seeds.

### 3. UI

`src/routes/admin_.reconciliation.tsx` `ForecastTables`: render the two replacement tables and update the section description to say the forecast draws from active subs + legacy Stripe links + unlinked seeds (not `bd_migration`).

## Out of scope

- No change to revenue-received, registrations, or membership KPIs.
- No change to the renewal cron job itself — only the forecast read path.
- Not back-filling `bd_migration.bd_renewal_date` / `bd_price_pence`; that table stays a workflow ledger.

## Expected result

After the change, the Yesterday/L7D/L30D Forecast tile for the next 30-day window should jump from £0 (BD contribution) to roughly **£99 × ~28 unique members ≈ £2,772** in BD-derived forecast revenue on top of any active-sub renewals, and `/admin/reconciliation#forecast` will list every one of those rows with its date and inclusion reason.
