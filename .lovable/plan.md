## Why the column is empty today

The `Lifetime value` column is already wired end-to-end on `/admin/professionals`. It sums `legacy_stripe_payments.amount_pence - refunded_amount_pence` per `user_id`. The data is in the table — 952 charges totalling £62,024.47 across 363 pros — but the query filters `status = 'succeeded'` and the imported CSV uses `'Paid'` / `'Refunded'`. So every row computes £0 and renders as `—`.

## Change

One line in `src/lib/admin/professionals.functions.ts` (the `paymentsData` fetch):

- Replace `.eq('status', 'succeeded')` with `.eq('status', 'Paid')`.

`Paid` rows already carry their own `refunded_amount_pence` for partial refunds, so the existing net calculation (`amount_pence - refunded_amount_pence`) stays correct. The 3 standalone `Refunded` rows are excluded (they're the refund-side ledger entries for fully-refunded charges, not separate payments).

## Out of scope

- No schema change.
- No change to BD next-due dates, cohort overrides, or the launch-day runner.
- No new Stripe writes.

## Expected result

- LTV column populates for the 363 BD pros with payment history.
- Sortable "Lifetime value" header continues to work.
- Pros with zero imported payments still show `—`.
