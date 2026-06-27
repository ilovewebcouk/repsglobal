# Fix: Jordon Gumbley's £99 missing from /admin Revenue

## Root cause

`payment_events.payload` stores the **full Stripe event** verbatim, so the amount lives at `payload.data.object.amount_paid` (invoices) or `payload.data.object.amount` (charges).

`src/lib/admin/overview.functions.ts` reads `payload.amount_paid` / `payload.amount` at the top level — those are always `null`. Result: every event contributes £0 to `revenuePence`, so the Revenue Received tile and chart are empty even though the rows exist.

Confirmed in DB: Jordon's `invoice.payment_succeeded` event from 2026-06-26 11:02 contains `data.object.amount_paid = 9900` (£99 GBP, livemode). His subscription row is `active`, tier `verified`, environment `live` — so Total Members is correct; only Revenue is broken.

## Fix

In `src/lib/admin/overview.functions.ts`, change the amount extraction inside the `payment_events` loop:

```ts
const obj = ((payload.data as any)?.object ?? {}) as Record<string, unknown>;
const amount =
  typeof obj.amount_paid === "number" ? obj.amount_paid :
  typeof obj.amount       === "number" ? obj.amount :
  0;
```

Also fix the de-dupe key: use `ev.stripe_event_id` (already correct) but additionally guard against refunds — for `charge.succeeded` only count when `obj.refunded !== true` and subtract `obj.amount_refunded` if present (keeps the tile honest).

No schema change. No new env. No UI change beyond the numbers now being non-zero.

## Verification

After the edit, `/admin?period=last_7d` should show Revenue Received = £99 (Jordon) plus the 7 launch-day charges from 2026-06-27 05:37 UTC (6 × £34 honour + 1 × £99 anomaly = £303), totalling **£402**, and the Revenue Received bar chart should render bars on 26 Jun and 27 Jun.

## Files touched

- `src/lib/admin/overview.functions.ts` — single block, ~10 lines.
