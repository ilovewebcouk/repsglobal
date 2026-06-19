## Problem

The Upcoming payments card shows **£792 across 8 members** because the code prices every scheduled Verified payment at the flat Verified rate of **£99**. The 8 BD-migrated members due in the next 14 days are actually on the **legacy honour-window price of £34/yr for year 1** (then auto-step to £99/yr in year 2+), as defined in the BD migration plan ("Drive home V7"). All 8 rows in `legacy_stripe_link` have:

- `last_paid_amount_pence = 3400` (£34)
- `eligible_for_legacy_price = true`
- `is_lifetime = false`

So the next-due payment for each is **£34, not £99**. 8 × £34 = **£272**, which matches the V7 file.

The same flat-£99 assumption is also wrong inside the 24-month forecast chart and the monthly forecast table for these honour-window members during their first migration year.

## Fix

All changes are confined to `src/lib/admin/memberships.functions.ts` (server) and one tiny display tweak in `src/routes/admin_.memberships.tsx`. No Stripe API calls. No public-route changes. No schema changes. No writes.

### 1. Per-row scheduled price (Upcoming card + list)

When building the scheduled payments list from `legacy_stripe_link`, capture the row's `last_paid_amount_pence` and `eligible_for_legacy_price` flag. Use this rule for the next-due payment amount:

- If `eligible_for_legacy_price = true` AND `last_paid_amount_pence` is set → use `last_paid_amount_pence` (e.g. £34).
- Otherwise → use £99.
- `bd_member_seed` fallback rows (no payment history) → still default to £99.

This makes the headline Upcoming total and the per-row amounts in the scrollable list reflect what each member will actually be charged.

### 2. 24-month forecast (chart + monthly table)

`projectVerifiedRenewals()` becomes price-aware:

- **First** scheduled renewal date → honour-window amount (e.g. £34) when eligible, else £99.
- **All subsequent** annual renewals → £99 (steady-state).

This means the first 12 months of the forecast correctly show £34 cash from honour-window members, then year 2+ steps up to £99.

### 3. Forecast ARR KPI (run-rate)

Keep the Forecast ARR KPI at the steady-state £99/member — ARR is a run-rate, not first-year cash. No change needed, but the existing subtext "Includes N awaiting Stripe setup" stays accurate.

### 4. Upcoming list display

Each row in the scrollable Upcoming list already shows the per-member amount via `gbp(it.amountPence)`. Once #1 lands, honour-window rows will correctly show "£34" and standard rows will show "£99" — no further UI work needed.

## After the fix, the Upcoming card will show

- **£272 across 8 members**
- Scrollable list: 8 rows each showing the correct £34 honour price + member name + due date
- Forecast chart year 1: correctly shows £34 cash from these members on their renewal months
- Forecast chart year 2+: steps up to £99/member as the honour window ends

## Out of scope

- No Stripe API calls; honour-window subscriptions are still created by the existing BD linking flow.
- No edits to `legacy_stripe_link`, `bd_member_seed`, or `subscriptions`.
- No changes to `/admin/payments`, `/admin/stripe`, checkout, or BD migration logic.
- No changes to the "Live / Sandbox" env badge or env-selection logic.

## Files touched

- `src/lib/admin/memberships.functions.ts` — pass `last_paid_amount_pence` + `eligible_for_legacy_price` through the scheduled pipeline; make `projectVerifiedRenewals` use the honour price for the first payment.
