## Goal

Migrate from Lovable's managed Stripe to bring-your-own-key (BYOK) Stripe, and automate as much of the Stripe setup as possible via API so you only do what Stripe legally requires in their dashboard.

## What you do in the Stripe dashboard

Only these — everything else is automated:

1. **Activate live mode** (business details, bank account, identity verification). No API exists for this.
2. **Grab two secret keys**:
   - Test mode → Developers → API keys → `sk_test_...`
   - Live mode → Developers → API keys → `sk_live_...` (shown once — copy immediately)
3. **Paste both** into Lovable's secrets form when prompted.

Skip creating products and webhooks manually. The setup script does it.

## What the AI does

### Step 1 — Request the two secret keys
Trigger the secrets form for `STRIPE_SECRET_KEY_TEST` and `STRIPE_SECRET_KEY_LIVE`. You paste, submit.

### Step 2 — Run one-off Stripe setup script
A Node script (`scripts/stripe-setup.ts`) using the official `stripe` SDK. For each mode (test + live):

1. List existing products; skip if `lookup_key` already exists (idempotent).
2. Create **REPs Verified** product + £99/year GBP recurring price, `lookup_key: verified_annual`.
3. Create **REPs Pro (Founding)** product + £59/month GBP recurring price, `lookup_key: pro_monthly`.
4. Create webhook endpoint:
   - Test → `https://staging.repsuk.org/api/public/payments/webhook?env=sandbox`
   - Live → `https://repsglobal.lovable.app/api/public/payments/webhook?env=live`
   - Events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `identity.verification_session.verified`, `identity.verification_session.requires_input`, `account.updated`
5. Capture the webhook signing secret (`whsec_...`) returned in the API response.
6. Capture the publishable key via `GET /v1/account` → publishable key lookup, or print instructions to retrieve.
7. Print a summary: 4 price IDs, 2 webhook secrets, 2 publishable keys.

### Step 3 — Store the rest of the secrets
Trigger the secrets form a second time with the values the script captured:
- `STRIPE_WEBHOOK_SECRET_TEST`, `STRIPE_WEBHOOK_SECRET_LIVE`
- `VITE_STRIPE_PUBLISHABLE_KEY_TEST`, `VITE_STRIPE_PUBLISHABLE_KEY_LIVE`

### Step 4 — Code cutover (BYOK Stripe)
1. Install `stripe` npm SDK.
2. Add `src/integrations/stripe/client.server.ts` — singleton SDK client picking `LIVE` or `TEST` key based on `STRIPE_ENV` (or hostname).
3. Update `src/lib/billing.ts` with the 4 price IDs the script printed (replace managed-Stripe price IDs).
4. Replace any managed-Stripe checkout calls with `createServerFn` handlers calling `stripe.checkout.sessions.create(...)` directly. Subscription/customer portal handlers follow the same shape.
5. Implement `src/routes/api/public/payments/webhook.ts` — verifies signature against `STRIPE_WEBHOOK_SECRET_*`, handles the 9 events, writes to the existing `subscriptions` / `profiles` tables.
6. Remove any leftover managed-Stripe wrapper code.

### Step 5 — Verify
1. Run script in test mode → confirm 2 products, 1 webhook created.
2. Trigger a test checkout from `/pricing` → Verified plan → complete with `4242 4242 4242 4242`.
3. Confirm webhook fires, subscription row written, user tier updates to `verified` in the dashboard.
4. Repeat for Pro plan.
5. Live cutover happens whenever you're ready (no code change — just env flip).

## Technical details

- **Script location**: `scripts/stripe-setup.ts`, run via `bun run scripts/stripe-setup.ts test` and `... live`. Idempotent — safe to re-run.
- **Stripe SDK version**: latest (`stripe@^18`), API version pinned in client.
- **Webhook route**: lives under `/api/public/*` per Lovable convention (bypasses auth, signature-verified inside).
- **Env switching**: server reads `STRIPE_ENV=live|sandbox`. Default to `sandbox` on staging/preview, `live` on `repsglobal.lovable.app` + custom domain.
- **No changes to locked UI** — `/pricing`, `/auth`, dashboards keep their current visuals. Only the server-side checkout/webhook plumbing changes.

## What you don't need to do

- ❌ Manually create any product in Stripe dashboard
- ❌ Manually create any webhook in Stripe dashboard
- ❌ Manually copy webhook secrets out of dashboard (returned via API)
- ❌ Touch any Lovable UI code

## Estimated time

- Your hands-on: ~5 min (paste 2 keys + activate live mode whenever)
- AI work: one shot, end-to-end in this session
