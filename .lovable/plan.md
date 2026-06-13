# Migrate ID verification from Veriff → Stripe Identity

## Return URL to paste into Stripe Identity setup

Use the production URL:

```
https://staging.repsuk.org/dashboard/verification?stripe_identity=complete
```

Also add (Stripe accepts multiple in test mode, or you can paste them later):
- `https://repsglobal.lovable.app/dashboard/verification?stripe_identity=complete`
- `https://id-preview--53bfbf09-bff5-41a5-a363-d717a797570f.lovable.app/dashboard/verification?stripe_identity=complete`

Stripe sends the user back to this URL after they finish the hosted ID flow. The real status update happens via webhook — the page just refetches.

## What I'll build

### 1. Server function: `createStripeIdentitySession`
- New file `src/lib/verification/stripe-identity.functions.ts`.
- Auth-gated (`requireSupabaseAuth`).
- Calls `stripe.identity.verificationSessions.create({ type: 'document', metadata: { professional_id: userId }, return_url: <origin>/dashboard/verification?stripe_identity=complete })`.
- Upserts `identity_documents` row: `vendor='stripe'`, stores `stripe_vs_id`, `stripe_vs_url` (client_secret URL), `status='pending'`.

### 2. Webhook: `src/routes/api/public/webhooks/stripe-identity.ts`
- Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET` (existing secret).
- Handles `identity.verification_session.verified` → set `identity_documents.status='approved'`, copy `verified_outputs` (name / dob) onto row, set `reviewed_at=now()`, `vendor='stripe'`.
- Handles `identity.verification_session.requires_input` / `canceled` → status `rejected` with reason.
- Handles `processing` → no-op (already pending).

### 3. DB migration
Add columns to `identity_documents`:
- `stripe_vs_id text`, `stripe_vs_url text`, `stripe_status text`, `stripe_reason text`
- Extend `vendor` allowed values to include `'stripe'`.
- Keep existing `veriff_*` columns for now (rip out in a later cleanup pass since user picked "Replace fully" — code paths go now, column drop deferred to avoid losing historic rows).

### 4. Dashboard UI (`dashboard_.verification.tsx`)
- Replace `createVeriffSession` / `syncVeriffStatus` imports with `createStripeIdentitySession`.
- Button copy stays "Start ID check" / "Continue ID check" / "Restart ID check".
- On return (`?stripe_identity=complete`): invalidate the identity query so the new status renders.
- Remove Veriff-specific branches (`isVeriff`, `veriffStuck`, etc.) — single Stripe code path.

### 5. Admin view (`admin_.verification.tsx`)
- Show `vendor: stripe` rows the same way Veriff rows render; reuse the existing status pills.
- Auto-approved rows show "Auto-approved by Stripe Identity" in place of the admin note.

### 6. Tear down Veriff
- Delete `src/lib/verification/veriff.functions.ts` and `src/routes/api/public/webhooks/veriff.ts`.
- Drop `VERIFF_API_KEY` / `VERIFF_SECRET` from project secrets (I'll prompt you).
- In Stripe dashboard you'll also want to delete the old Veriff webhook URL.

## Configuration you'll do in Stripe dashboard
1. **Return URL** → paste the staging URL above.
2. **Webhook endpoint** → `https://staging.repsuk.org/api/public/webhooks/stripe-identity` listening for `identity.verification_session.*` events. The signing secret is already set as `STRIPE_WEBHOOK_SECRET` — if Stripe gives a new secret specifically for the Identity endpoint, we'll add it as `STRIPE_IDENTITY_WEBHOOK_SECRET` instead.

## Open question
Stripe Identity has its own per-endpoint signing secret. Do you want to:
- **(a)** reuse the existing `STRIPE_WEBHOOK_SECRET` (only works if you point Stripe's existing webhook endpoint at the new Identity URL too), or
- **(b)** create a separate webhook endpoint in Stripe for Identity events and add a new secret `STRIPE_IDENTITY_WEBHOOK_SECRET`? Recommended — cleaner separation.

I'll default to **(b)** unless you say otherwise.
