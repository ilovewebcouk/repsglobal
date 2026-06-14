# Switch REPs to true Stripe-hosted checkout (BYOK)

## Why this plan exists

Lovable's built-in payments integration **only supports embedded checkout** (`ui_mode: "embedded_page"`). The docs and internal knowledge are explicit: hosted redirect is "do not deviate". You've used it, you don't like it, and you want the real Stripe-hosted page (`checkout.stripe.com`) everywhere.

The only way to get that is to leave the built-in path and connect your own Stripe account (BYOK). This plan does that cleanly.

## Honest trade-offs (read before approving)

You lose:
- Lovable's managed test/live key rotation and the in-app Payments dashboard.
- The auto-provisioned go-live flow (claim sandbox → live keys appear automatically).
- The connector-gateway proxy — code talks to `api.stripe.com` directly with your secret key.

You take on:
- Creating products + prices in your own Stripe account (test and live), or running a one-off seed script.
- Pasting `STRIPE_SECRET_KEY` (test) and later `STRIPE_LIVE_SECRET_KEY` + webhook signing secrets as project secrets.
- Registering the webhook endpoint in the Stripe dashboard (one URL for test, one for live), and keeping the signing secret in sync.

You gain:
- True `checkout.stripe.com` redirect — Stripe's polished, fully-branded full-page checkout.
- Customer Portal as a hosted redirect (works in preview, no iframe issue).
- One consistent pattern across tier signup, credit top-ups, and billing management.

## How "hosted everywhere" works

1. User clicks Buy / Upgrade / Top up.
2. Client calls a server fn (`createHostedCheckoutSession`) with `priceId` + intent metadata.
3. Server creates a Stripe Checkout Session with `mode: payment|subscription`, **no** `ui_mode`, `success_url`, `cancel_url`, and returns `session.url`.
4. Client does `window.location.href = session.url` (top-level, not iframe — handled below).
5. Stripe renders its hosted page, takes payment, redirects to `success_url`.
6. Webhook (`/api/public/payments/webhook`) verifies signature with your own webhook secret and updates `subscriptions` / `credit_transactions`.
7. Customer Portal uses the same redirect pattern via `stripe.billingPortal.sessions.create`.

### Preview iframe handling

The Lovable preview itself is an iframe; Stripe blocks framing. The redirect helper does:

```ts
if (window.top && window.top !== window.self) {
  window.top.location.href = url; // break out of preview iframe
} else {
  window.location.href = url;
}
```

In the published app there is no parent iframe, so it just navigates normally.

## Scope of changes

### 1. Enable BYOK Stripe & collect secrets
- Call `enable_stripe` (BYOK tool) — this disables the seamless integration.
- Ask you to paste, via the secrets tool:
  - `STRIPE_SECRET_KEY` (test, `sk_test_...`)
  - `STRIPE_WEBHOOK_SECRET` (test, `whsec_...`)
  - Later, for go-live: `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_WEBHOOK_SECRET`
- Add publishable keys to `.env` as `VITE_STRIPE_PUBLISHABLE_KEY` (test) and `VITE_STRIPE_LIVE_PUBLISHABLE_KEY`.

### 2. Replace the Stripe server utility
- Rewrite `src/lib/stripe.server.ts` to instantiate `new Stripe(secret)` directly (no connector gateway) and pick test vs live from an env arg.
- Keep `getStripeErrorMessage` and add `verifyWebhookSignature` using Stripe SDK's `webhooks.constructEventAsync` (Workers-safe).

### 3. Rewrite checkout server functions
- `src/lib/billing/billing.functions.ts` → `createHostedSubscriptionCheckout({ priceId, period })`
  - `mode: "subscription"`, no `ui_mode`, `success_url: /checkout/return?session_id={CHECKOUT_SESSION_ID}`, `cancel_url: /pricing`.
- `src/lib/credits/credits.functions.ts` → `createHostedCreditTopupCheckout({ pack })`
  - `mode: "payment"`, returns `session.url`, metadata `{ kind: "credit_topup", pack, userId }`.
- Add `createBillingPortalSession()` server fn for "Manage billing".

### 4. Replace the embedded `/checkout` route with a redirector
- Delete `src/routes/checkout.tsx` embedded mounting code and `src/routes/_authenticated/_professional/checkout_.credits.tsx`.
- Replace with thin redirector pages that call the server fn and do the iframe-safe top-level redirect (loading state only — no Stripe iframe).
- Keep `src/routes/checkout.return.tsx` for the success page; it already reads `session_id`.

### 5. Update all callers
- `PricingPlans.tsx`, `auth.tsx`, `signup.tsx`, `CreditsPanel.tsx`, `DashboardShell.tsx` "Manage billing" → all go through the new redirect helper.

### 6. Rewrite the webhook
- `src/routes/api/public/payments/webhook.ts`
  - Use BYOK signing secret (`STRIPE_WEBHOOK_SECRET` / `STRIPE_LIVE_WEBHOOK_SECRET`) selected by `?env=`.
  - Keep existing handlers for `customer.subscription.*` and `checkout.session.completed` (credit top-up path → `grant_credit_topup` RPC).
- Register the endpoint URL in Stripe dashboard (test + live):
  - `https://staging.repsuk.org/api/public/payments/webhook?env=sandbox`
  - `https://repsglobal.lovable.app/api/public/payments/webhook?env=live` (or your custom domain when wired)

### 7. Remove embedded dependencies
- `bun remove @stripe/stripe-js @stripe/react-stripe-js` (no longer needed; we never mount Stripe.js in the page).
- Keep `stripe` (server SDK) — already installed.

### 8. Products in your Stripe account
- One-off seed script (`scripts/seed-stripe.ts`) creates:
  - `verified_annual` (£99/yr), `pro_founding_monthly` (£59/mo)
  - `credits_small` (£10), `credits_medium` (£25), `credits_large` (£50)
- Uses `lookup_key` so `src/lib/billing.ts` IDs stay the same across test/live.

## Technical details

### File map
| Action | File |
|---|---|
| Rewrite | `src/lib/stripe.server.ts` |
| Rewrite | `src/lib/billing/billing.functions.ts` |
| Rewrite | `src/lib/credits/credits.functions.ts` |
| Rewrite | `src/routes/api/public/payments/webhook.ts` |
| Rewrite | `src/routes/checkout.tsx` (redirector only) |
| Rewrite | `src/routes/_authenticated/_professional/checkout_.credits.tsx` (redirector only) |
| Edit | `src/components/pricing/PricingPlans.tsx`, `src/routes/auth.tsx`, `src/routes/signup.tsx`, `src/components/dashboard/CreditsPanel.tsx`, `src/components/dashboard/DashboardShell.tsx` |
| New | `src/lib/billing/redirect-to-checkout.ts` (iframe-safe top-level redirect helper) |
| New | `scripts/seed-stripe.ts` |
| Delete | `src/lib/billing/stripe-client.ts` (no Stripe.js needed) |

### Env vars
| Name | Where | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | secrets | Test secret key |
| `STRIPE_WEBHOOK_SECRET` | secrets | Test webhook signing |
| `STRIPE_LIVE_SECRET_KEY` | secrets (later) | Live secret key |
| `STRIPE_LIVE_WEBHOOK_SECRET` | secrets (later) | Live webhook signing |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` | Only for env detection in client; not used to mount Stripe.js |

### Order of execution
1. You approve this plan.
2. I call `enable_stripe` and request the two test secrets via the secrets tool.
3. You paste the secrets and confirm the webhook URL in Stripe (I'll give you the exact URL and the events list).
4. I implement everything above in one pass, run the seed script, and verify a full £59/mo redirect → success → webhook → dashboard reflects active subscription.
5. We repeat with live keys when you're ready to go live.

## Out of scope (unchanged)
- All locked marketing/feature/profile UI.
- Pricing tiers, credit pack amounts, RLS, admin seeds.
- Customer-facing copy except the checkout/return pages.
