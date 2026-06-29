## Why it's missing

The DB has the customer id for Andrew Mossford (`cus_UXVhDunTfRQyG0` on his `subscriptions` row), but Member 360 renders `—` because the resolver throws it away.

When `subscription-resolver.server.ts` was refactored to share compute with the Professionals list via `member-billing-row.server.ts`, `stripe_customer_id` was not added to the shared row. The adapter hardcodes:

```ts
// src/lib/admin/subscription-resolver.server.ts:100, 132
stripe_customer_id: null,
```

So every Member 360 page shows `—` for Stripe Customer, regardless of what's in the DB. `stripe_subscription_id` survives because the shared row exposes `stripeSubscriptionId` — customer id just wasn't carried across.

## Fix

Single-source change in the shared compute, then surface it through the adapter. No UI changes — the Identifiers card already reads `snapshot.stripe_customer_id` and links to `dashboard.stripe.com/customers/{id}`.

1. **`src/lib/admin/member-billing-row.server.ts`** — add `stripeCustomerId: string | null` to the `MemberBillingRow` type and populate it from the same `subscriptions` row read used for `stripeSubscriptionId` (and from the Stripe mirror path if that branch sets it separately). Default to `null` for free/no-sub members.

2. **`src/lib/admin/subscription-resolver.server.ts`** — replace the two hardcoded `stripe_customer_id: null` lines (≈100, 132) with `row.stripeCustomerId` (still `null` in the free branch).

That's it — the Identifiers card and the Billing-tab Stripe deep-link will both light up automatically for Andrew and everyone else with a customer on file.

## Verification

- Reload `/admin/members/d0d18589-4906-4a49-86ec-fff0444bd2c6` → "Stripe Customer" shows `cus_UXVhDunTfRQyG0` with the Stripe dashboard link.
- Spot-check a free/unverified member → still shows `—` (no regression).
- Spot-check the Professionals list → no visual change (it doesn't render customer id today).
