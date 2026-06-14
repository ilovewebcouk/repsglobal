# Migrate to BYOK Stripe — Hosted Checkout, Identity-ready, Connect-ready

## Brutal truth (why this plan exists)

Lovable's managed payments only supports **Embedded Checkout** for the platform's own subscriptions. It does **not** proxy Stripe Identity or Stripe Connect. Since REPs needs all three (subscriptions + Identity for Verified + Connect for Pro trainer payments), trying to live on the managed gateway means split-brain: two Stripe access paths, two key sets, two webhook configurations, two failure modes. That is exactly the back-and-forth we've been stuck in.

The clean answer: **one Stripe account, one secret key, one webhook secret, one SDK client, used for everything.** Hosted Checkout for subscriptions today; Identity and Connect bolt onto the same foundation later.

## Goal

Replace Lovable's managed Stripe wiring with a direct ("BYOK") integration against your existing live Stripe account, using **Hosted Checkout** for Verified £99/yr and Pro £59/mo Founding. Lay the groundwork so Stripe Identity and Stripe Connect can ship as Phase 2.1 / 2.2 without rework.

Out of scope for this plan: shipping Identity flows, shipping Connect onboarding, redesigning any locked Phase 1 UI.

---

## Phase A — Cutover prep (no code changes shipped yet)

1. **Disconnect Lovable managed Stripe.** You do this in the Lovable Payments panel — it removes `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET`, and the managed webhook registration.
2. **Confirm your existing Stripe account is the one we'll use** (the one from your old live website). Decide:
   - Same account for sandbox + live? (Stripe gives every account a built-in test mode — yes, this is the right answer.)
   - Statement descriptor / business name shown on customer card statements.

## Phase B — Secrets & Stripe dashboard setup (user actions)

In your Stripe dashboard (test mode + live mode, separately):

1. Create products + prices matching the lookup keys in `src/lib/billing.ts`:
   - `verified_annual` — £99/yr recurring
   - `pro_monthly` — £59/mo recurring
   - `pro_annual` — (if used) recurring annual
   Set `lookup_key` on each price exactly as above so code resolution works.
2. Create a webhook endpoint pointing to `https://staging.repsuk.org/api/public/payments/webhook?env=sandbox` (test mode) and `https://repsglobal.lovable.app/api/public/payments/webhook?env=live` (live mode). Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
3. Copy the webhook signing secret from each (one for test, one for live).

Then in Lovable, add these runtime secrets via the secrets tool:
- `STRIPE_SECRET_KEY_TEST` (`sk_test_...`)
- `STRIPE_SECRET_KEY_LIVE` (`sk_live_...`)
- `STRIPE_WEBHOOK_SECRET_TEST` (`whsec_...`)
- `STRIPE_WEBHOOK_SECRET_LIVE` (`whsec_...`)
- `VITE_STRIPE_PUBLISHABLE_KEY_TEST` (`pk_test_...`) — safe to expose
- `VITE_STRIPE_PUBLISHABLE_KEY_LIVE` (`pk_live_...`) — safe to expose

## Phase C — Code: replace the Stripe client layer

1. **Rewrite `src/lib/billing/stripe.server.ts`** to instantiate the Stripe SDK directly:
   ```ts
   new Stripe(env === 'live' ? STRIPE_SECRET_KEY_LIVE : STRIPE_SECRET_KEY_TEST,
              { apiVersion: '2026-03-25.dahlia' })
   ```
   Drop the connector-gateway proxy and `Lovable-API-Key` / `X-Connection-Api-Key` headers entirely. Keep `getStripeErrorMessage` as-is.
2. **Rewrite `src/lib/billing/stripe-client.ts`** to derive env from `VITE_STRIPE_PUBLISHABLE_KEY_*` (prefix-detected; fail loudly if missing — never silent-fallback to live).
3. **Delete `client.server.ts` references to Lovable-managed Stripe** (keep Supabase admin import patterns).

## Phase D — Code: Hosted Checkout server fn

1. Rewrite `src/lib/billing/startCheckout.ts` (server fn) to create a **Hosted** Stripe Checkout session:
   - `ui_mode: 'hosted'` (default — omit explicitly)
   - `mode: 'subscription'`
   - `line_items: [{ price: <resolved>, quantity: 1 }]` (resolved via `lookup_keys`)
   - `customer:` resolved via `resolveOrCreateCustomer` (search by `metadata.userId`, fall back to email, then create — userId stamped on Customer for searchable lookups)
   - `success_url`: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `${origin}/pricing?checkout=cancelled`
   - `subscription_data.metadata.userId` + `metadata.userId`
   - `allow_promotion_codes: true`
   - `automatic_tax: { enabled: true }` (basic tax calc — you handle filing; can upgrade to Stripe Tax later)
2. Server fn returns `{ url }`. Client `window.location.href = url` (full-page redirect — that's the whole point of Hosted).
3. Update `PricingPlans` button handler to call the new server fn and redirect.

## Phase E — Code: Webhook

1. Rewrite `src/routes/api/public/payments/webhook.ts`:
   - Verify signature against `STRIPE_WEBHOOK_SECRET_TEST` or `_LIVE` based on `?env=`
   - Use the official `stripe.webhooks.constructEventAsync(body, sig, secret)` (cleaner than hand-rolled HMAC, and we now own the SDK directly)
   - Handle: `customer.subscription.created/updated/deleted`, `checkout.session.completed` (for one-shot logging), `invoice.payment_failed` (mark `past_due`)
   - Upsert into `public.subscriptions` keyed on `stripe_subscription_id`, with `environment` column
2. Keep existing schema; no migration needed.

## Phase F — Billing portal

Add `createBillingPortalSession` server fn (`requireSupabaseAuth`) — returns a Stripe Customer Portal URL so users can cancel / update card / view invoices. Wire one "Manage billing" button on the dashboard subscription card.

## Phase G — Foundations for Identity + Connect (scaffolding only — no UI shipped)

These are **tiny, additive** and prove the architecture supports them. No user-facing surface in this plan.

1. **DB migrations** (one migration, with GRANTs + RLS):
   - `public.identity_verifications` (id, user_id, stripe_verification_session_id, status, last_event_at, environment)
   - `public.stripe_connect_accounts` (id, user_id, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, environment)
2. **Stub server fns** (return "not yet enabled" — pure placeholders):
   - `createIdentityVerificationSession` → `stripe.identity.verificationSessions.create(...)`
   - `createConnectAccountLink` → `stripe.accounts.create({ type: 'express' })` + `stripe.accountLinks.create(...)`
3. **Webhook handler additions** (no-op log lines for now): `identity.verification_session.*`, `account.updated` — so future events aren't dropped on the floor.

This means when we ship Identity (Phase 2.1) and Connect (Phase 2.2), it's UI + flow work only — backend plumbing is already there.

## Phase H — End-to-end QA (test mode)

1. Signed-out → `/pricing` → click Verified → `/signup` → land in Stripe Hosted → pay with `4242 4242 4242 4242` → return to `/dashboard?checkout=success`.
2. Confirm webhook fired (server logs) and `subscriptions` row inserted with `environment='sandbox'`, `status='active'`.
3. Repeat for Pro £59/mo.
4. Cancel-mid-checkout → returns to `/pricing?checkout=cancelled` with no DB row.
5. Decline card `4000 0000 0000 0002` → no DB row, friendly error.
6. Open billing portal → cancel subscription → webhook fires → row updates to `cancel_at_period_end=true`.

## Phase I — Live cutover

1. Flip the test-mode banner off when `VITE_STRIPE_PUBLISHABLE_KEY_LIVE` is detected on the production build (preview keeps test).
2. Smoke-test live with a real £0.50 one-off charge using your own card → refund yourself.
3. Publish.

---

## Technical notes (for me, not blocking)

- **API version pinned** to `2026-03-25.dahlia` to match existing webhook field assumptions (`item.current_period_start`).
- **No connector gateway code path** anywhere after Phase C — single Stripe SDK client.
- **Webhook signature**: switch from hand-rolled HMAC to `stripe.webhooks.constructEventAsync` since we own the SDK.
- **Customer dedupe**: keep the `resolveOrCreateCustomer` helper (search by `metadata.userId` first, email fallback, backfill on legacy email match, create as last resort). Critical because Identity + Connect later will reuse the same Customer.
- **Existing live subscriptions**: rows already in `public.subscriptions` from the managed gateway era keep working — the Stripe Customer + Subscription IDs are identical regardless of which integration created them. New webhook will reconcile on next `customer.subscription.updated`.
- **Test mode banner**: keep current `PaymentTestModeBanner` but switch its detection to `VITE_STRIPE_PUBLISHABLE_KEY_*` prefix.
- **Origin for redirects**: derive from `request.headers.get('origin')` server-side, not `window.location.origin`, so SSR + preview + production all work.

## What does NOT change

- All locked Phase 1 UI (homepage, city pages, profession pages, coach shop-front, pricing layout, enquire page).
- `src/lib/billing.ts` tier config — lookup keys (`verified_annual`, `pro_monthly`) are reused verbatim.
- Auth flow, `/auth` route, `_authenticated/` layout.
- The `subscriptions` table schema.

## Success criteria (10/10 means all of these)

- Single Stripe SDK client everywhere; zero references to `connector-gateway.lovable.dev`.
- Verified + Pro both check out end-to-end in test mode on first try.
- Webhook writes the right row with `environment='sandbox'` or `'live'`.
- Billing portal works.
- Identity + Connect tables + stub fns + webhook hooks exist (proving the foundation).
- Live cutover is a flip-the-keys event, not a rebuild.
- No raw Stripe secrets in source files — all via Lovable runtime secrets.
- Preview shows test banner; production does not.
