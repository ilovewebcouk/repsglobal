# Plan — Working credit top-up buy buttons

The grey box in the screenshot is the disabled "Top up · coming soon" button. The wallet UI is in place but there is no purchase path. This wires it end-to-end.

## What you'll see after this ships

In Settings → AI credits, each of the 3 packs (Small / Medium / Large) gets its own **Buy** button next to the price. Clicking opens the embedded Stripe checkout (same pattern as plan upgrades), charges the saved card, and on `checkout.session.completed` the webhook credits the wallet and writes a `topup` row to `credit_transactions`. The panel auto-refreshes and the new balance + transaction appear.

## Steps

**1. Stripe products (one-time, GBP)**
Create 3 one-time products in the test environment (auto-synced to live on publish) via `payments--batch_create_product`:
- `credits_small` — £10 → 200 credits
- `credits_medium` — £25 → 600 credits
- `credits_large` — £50 → 1,500 credits

Tax code `txcd_10000000` (general digital goods). No `recurring_interval`. `quantity_min=1, quantity_max=1`.

**2. Catalog entry** (`src/lib/billing.ts`)
Add a `CREDIT_PACKS` map: `{ small: { priceId: "credits_small", credits: 200, amountGbp: 10 }, medium: {...}, large: {...} }` plus a `creditPackForPriceId()` helper.

**3. New server fn** (`src/lib/credits/credits.functions.ts`)
Add `createCreditTopupCheckout` — `requireSupabaseAuth`, input `{ pack: "small"|"medium"|"large", environment }`, mirrors `createCheckoutSession` but `mode: "payment"`, `managed_payments: { enabled: true }`, metadata `{ reps_user_id, kind: "credit_topup", pack, credits }`. Returns `{ clientSecret }`.

**4. Webhook handler** (`src/routes/api/public/payments/webhook.ts`)
In the `checkout.session.completed` case, branch on `metadata.kind === "credit_topup"`: read `credits` + `reps_user_id` from metadata, call a new SECURITY DEFINER RPC `grant_credit_topup(p_user_id, p_credits, p_stripe_session_id)` that:
- inserts/updates `credit_wallets.balance += credits` (respect `refill_ceiling` only for refills, not top-ups — top-ups can exceed ceiling)
- inserts a `credit_transactions` row `{ action: "topup", delta: +credits, balance_after, ref: session.id }`
- idempotent via unique index on `(action, ref)` so webhook retries are safe

Migration adds the RPC + unique index.

**5. Wire buttons** (`src/components/dashboard/CreditsPanel.tsx`)
Replace the disabled header button + the static `<ul>` of packs with 3 rows, each `Small / Medium / Large` showing price + credits + a `Buy` button. Clicking opens a Stripe embedded checkout dialog (reuse the existing checkout dialog component used by plan upgrades). On success → invalidate `["credits","wallet"]` and `["credits","transactions"]`.

**6. Verification**
- Open `/dashboard/settings` as `demo-verified@repsuk.org`, screenshot the new packs row with visible Buy buttons.
- Click Buy on Medium → checkout opens → complete with test card → return to settings → confirm balance shows 600 and a "Top-up purchase +600" row in Recent activity.

## Files touched
- migration: `grant_credit_topup` RPC + unique idx on `credit_transactions(action, ref)`
- `src/lib/billing.ts` — CREDIT_PACKS catalog
- `src/lib/credits/credits.functions.ts` — `createCreditTopupCheckout`
- `src/routes/api/public/payments/webhook.ts` — handle `kind=credit_topup`
- `src/components/dashboard/CreditsPanel.tsx` — 3 visible Buy buttons + checkout dialog wiring

No other surfaces change. Sidebar tier fix from the previous turn stays in place.
