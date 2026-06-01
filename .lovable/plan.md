## Goal
Keep users on REPs throughout payment. Use Stripe's **Embedded Checkout** (Stripe-hosted UI mounted inside a REPs page via iframe) instead of redirecting to checkout.stripe.com. PCI scope stays with Stripe; the payment form just renders inline.

## Scope (Phase 1 billing)

1. **Products & prices in Stripe (test mode)**
   - Create the REPs subscription products/prices we agreed on (monthly + annual tiers).
   - Store `price_id` constants in `src/lib/billing/plans.ts`.

2. **Server function: `createEmbeddedCheckoutSession`**
   - `src/lib/billing/checkout.functions.ts`, protected by `requireSupabaseAuth`.
   - Looks up or creates the Stripe customer for the signed-in pro (by email).
   - Creates a Checkout Session with:
     - `ui_mode: 'embedded'`
     - `mode: 'subscription'`
     - `line_items: [{ price, quantity: 1 }]`
     - `return_url: ${origin}/billing/return?session_id={CHECKOUT_SESSION_ID}`
   - Returns `{ clientSecret }`.

3. **Server function: `getCheckoutSessionStatus`**
   - Takes `session_id`, returns `{ status, customer_email, subscription_id }` for the return page.

4. **Embedded checkout UI**
   - Add `@stripe/stripe-js` and `@stripe/react-stripe-js`.
   - New route `/billing/checkout` (auth-only) that:
     - Calls `createEmbeddedCheckoutSession` with the selected `priceId` (read from query param).
     - Renders `<EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>`.
   - Update `/pricing` plan buttons to navigate to `/billing/checkout?price=...` instead of opening Stripe in a new tab.

5. **Return page**
   - New route `/billing/return` that reads `session_id`, calls `getCheckoutSessionStatus`, and shows success / "still processing" / failure states inline on REPs.
   - On success, kick `check-subscription` so the app state refreshes immediately.

6. **Subscription status (lightweight, no webhook yet)**
   - Server function `checkSubscription` queries Stripe by customer email and returns `{ subscribed, tier, current_period_end }`.
   - Called on login and on the billing/return page. Webhook-based persistence can come in a later phase.

7. **Customer portal (manage/cancel)**
   - Server function `createPortalSession` returning a portal URL.
   - Opens in new tab from the account/billing page (portal itself cannot be embedded; that's a Stripe constraint).

## Out of scope for this step
- Stripe webhook + DB persistence of subscription state.
- Tax automation, coupons, trials, proration UI.
- Live-mode keys (still test mode).

## Technical notes
- `VITE_STRIPE_PUBLISHABLE_KEY` needs to be added (publishable, safe in client). `STRIPE_SECRET_KEY` is already configured.
- All Stripe SDK server calls go through TanStack `createServerFn` — no Supabase Edge Functions.
- Embedded Checkout requires the publishable key to match the secret key's mode (test↔test).

## Open question
Do you want me to add the `VITE_STRIPE_PUBLISHABLE_KEY` (test) now as part of this build, or will you paste it when I get there?
