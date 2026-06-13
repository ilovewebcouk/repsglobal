
## Goal

Stripe Identity currently uses a hand-pasted `STRIPE_SECRET_KEY` and its own webhook (`/api/public/stripe/webhook` with `STRIPE_WEBHOOK_SECRET`). Payments uses the connector gateway with auto-switched sandbox/live keys (`STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY`) and the unified webhook at `/api/public/payments/webhook?env=...`.

This plan rewires Identity onto the same gateway pattern so:
- Preview (`id-preview--...lovable.app`) automatically uses Stripe **test** mode for Identity.
- Published (`staging.repsuk.org`, `repsglobal.lovable.app`) automatically uses Stripe **live** mode for Identity.
- One webhook endpoint handles both Payments and Identity events, in both modes.
- The legacy `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` can be deleted.

No UI changes. Identity verification UX on `/dashboard/verification` stays identical.

---

## Changes

### 1. `src/lib/verification/stripe-identity.functions.ts` — use the gateway

Replace:
```ts
const key = process.env.STRIPE_SECRET_KEY;
const { default: Stripe } = await import("stripe");
const stripe = new Stripe(key);
```
with the same pattern Payments uses:
```ts
const { getStripe, resolveStripeEnv } = await import("@/lib/billing/stripe.server");
const stripe = getStripe();
const env = resolveStripeEnv(); // "sandbox" | "live"
```
Also persist `env` on the new `identity_documents` row (new column — see step 4) so the webhook handler can scope its lookup by environment, the same way `subscriptions.environment` is used.

### 2. Move Identity event handling into the unified webhook

- Lift the `handleIdentityEvent` + `mapIdentityStatus` helpers from `src/routes/api/public/stripe/webhook.ts` into `src/routes/api/public/payments/webhook.ts` (or a shared helper module under `src/lib/billing/`).
- Add the five `identity.verification_session.*` cases to the existing `switch (event.type)` block in the payments webhook.
- The Stripe client passed in is already env-scoped (from `createStripeClient(env)` driven by the `?env=` query param), so Identity sessions retrieved during enrichment will match the right mode automatically.
- Scope the `identity_documents` lookup by `environment = env` so a sandbox session id can never collide with a live one.

### 3. Delete the legacy webhook route

- Remove `src/routes/api/public/stripe/webhook.ts`.
- Remove the empty `src/routes/api/public/stripe/` directory.

### 4. Database migration

Add an `environment` column to `identity_documents`:
```sql
alter table public.identity_documents
  add column if not exists environment text not null default 'sandbox';

create index if not exists idx_identity_documents_vs_env
  on public.identity_documents(stripe_vs_id, environment);
```
Existing rows default to `'sandbox'` (they were created against test mode if `STRIPE_SECRET_KEY` was a test key; if it was live, we backfill manually after migration).

### 5. Stripe Dashboard — webhook reconfiguration (manual, you do this)

I'll give you the exact two URLs once the code is shipped. You'll:
- **Test mode endpoint:** add `identity.verification_session.*` events to the existing sandbox payments webhook (`/api/public/payments/webhook?env=sandbox`). Stripe shows the existing signing secret — already stored as `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, nothing to copy.
- **Live mode endpoint:** same — add identity events to the live endpoint (`?env=live`). Uses `PAYMENTS_LIVE_WEBHOOK_SECRET`.
- Disable / delete the old standalone Identity webhook endpoint in Stripe Dashboard.

### 6. Retire legacy secrets

Once the new path is verified end-to-end in preview:
- Delete `STRIPE_SECRET_KEY` from project secrets.
- Delete `STRIPE_WEBHOOK_SECRET` from project secrets.

These are no longer referenced anywhere in code after step 3.

### 7. Verify

- **Preview** (`id-preview--...lovable.app`): start a verification — Stripe Identity opens in test mode (no charge, simulated docs). Webhook updates `identity_documents.status` to `approved`.
- **Staging** (`staging.repsuk.org`): start a verification — Stripe Identity opens in live mode (real ID required, ~£1.20 charge per check). Webhook flips status the same way.

---

## What changes for you operationally

- Preview Identity = free test mode, always.
- Staging/published Identity = real live mode, always.
- The Payments **Test / Live dashboard toggle** doesn't apply to Identity events because Stripe shows Identity verifications in the same toggle automatically — they're on the same account.
- One webhook endpoint to monitor instead of two.

## Out of scope

- The dashboard UI for kicking off / restarting verification (unchanged).
- Any change to how `identity_documents` is read by the rest of the app.
- Migrating insurance / awarding-body verification (those don't use Stripe).
