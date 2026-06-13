# Fix: preview test purchases vs live purchases

## The actual problem (plain English)

Right now your app has BOTH test and live Stripe keys provisioned by Lovable. That's good — it's how you're supposed to have one for the preview and one for the published site.

What's broken is which one the server picks:

- **Browser side** correctly uses the **test** publishable token in preview (`pk_test_...`) and the **live** one in production (`pk_live_...`), because Vite swaps `.env.development` vs `.env.production` for you.
- **Server side** doesn't do that. The current `resolveStripeEnv()` helper picks **live** the moment `STRIPE_LIVE_API_KEY` exists in the environment — which is always, now that go-live is done. So preview's browser asks for a test session, and the server creates a live one. Stripe then either refuses or shows nothing useful inside the iframe.

That mismatch is why "test purchase in preview" doesn't work even though both key sets exist.

## The fix

Make the server pick the environment from **the caller**, not from "is the live key present". The browser already knows which environment it's in (from the token prefix). We just need to pass that through and trust it server-side.

1. **`src/lib/billing/billing.functions.ts`** — add `environment: 'sandbox' | 'live'` to the input of `createCheckoutSession` (and any other Stripe server fn in that file). Validate it. Pass it into `createStripeClient(environment)` instead of calling `resolveStripeEnv()`.

2. **`src/lib/billing/stripe.server.ts`** — keep `createStripeClient(env)` as the single entry point; delete/retire `resolveStripeEnv()` so nothing can silently default to live again.

3. **`src/routes/checkout.tsx`** — when calling `createCheckoutSession`, read the env from the existing client helper (`getStripeEnvironment()` from `src/lib/billing/stripe-client.ts`, which derives it from the `pk_test_` / `pk_live_` prefix) and pass it in the `data` payload.

4. **Customer portal server fn** (same pattern) — also take `environment` from the client so the portal opens against the same Stripe account the checkout used.

5. **Add the standard test-mode banner** (`PaymentTestModeBanner`) at the top of the app layout so it's obvious when preview is in test mode and warns clearly if production ever ships without live keys.

## After this is in

- **Preview** → browser uses `pk_test_`, server uses sandbox key, you can pay with `4242 4242 4242 4242`. Real test purchase, end-to-end, inside the preview iframe.
- **Published site** → browser uses `pk_live_`, server uses live key, real cards charge real money.
- No more env mixing. No more "why is checkout hanging".

## Out of scope

- No visual changes to `/pricing`, `/checkout`, `/auth`, `/signup`.
- No Stripe product/price changes.
- No webhook changes.
- The earlier embedded-checkout migration (already done) stays — that was the right call; it just couldn't work while the server was silently routing to live.
