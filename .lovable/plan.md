## Goal
Let an admin manually onboard trainers onto **Core (£34/yr)** whose Stripe customer already exists, by drafting an invite, sending an email, and only publishing their profile once (a) they've claimed the account and (b) a payment method is on file. First billing hits on the anniversary of their last payment — not today.

## Flow at a glance

```text
Admin creates draft  →  Verifies Stripe customer  →  Drafts email
                                                       │
                                              admin clicks Send
                                                       ▼
Trainer opens link  →  /activate/$token  →  set password (auth.users created)
                                                       ▼
                                     Stripe Checkout (mode=setup, customer=cus_xxx)
                                                       ▼
                                     Webhook: SetupIntent.succeeded
                                       │  attach PM as customer default
                                       │  create Core subscription:
                                       │    price = core_annual
                                       │    trial_end = anniversary
                                       │    billing_cycle_anchor = anniversary
                                       │    proration_behavior = none
                                       │    default_payment_method = that PM
                                       ▼
                              Profile flips to public + verified badge
                              "Welcome to Core" email sent
```

First charge only happens on the anniversary — Stripe issues an invoice that day and auto-charges the saved card.

## Data model

Reuse `billing_setup_tokens` — schema already fits. One new column via migration:

```sql
ALTER TABLE public.billing_setup_tokens
  ADD COLUMN professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN target_tier public.subscription_tier;
CREATE INDEX billing_setup_tokens_professional_idx
  ON public.billing_setup_tokens(professional_id)
  WHERE professional_id IS NOT NULL;
```

No new tables. The existing `professionals` row is created upfront in a **hidden** state (`is_public=false`, no verified badge). It flips public only when the webhook confirms both a saved PM and an active/trialing Core subscription.

## Server functions (auth-required, admin-only)

All live under `src/lib/admin/core-invites.functions.ts` — no new client-imported `.server.ts` files.

1. **`verifyStripeCustomer({ stripe_customer_id })`** — server-side, uses `supabaseAdmin` only after role-check. Calls Stripe `customers.retrieve` and returns `{ email, name, created, has_payment_method, currency }`. Admin UI shows this **before** the "Save draft" button is enabled. Prevents fat-finger disasters.
2. **`createCoreInvite({ full_name, email, slug, stripe_customer_id, last_paid_at })`**
   - Re-verifies the customer server-side (never trust the client's earlier check).
   - Inserts hidden `professionals` row + `pending_signups` mapping.
   - Inserts `billing_setup_tokens` row: `kind='setup'`, `target_tier='core'`, `target_renewal_at = last_paid_at + 1 year` (rejected if already in the past — admin picks a next-anniversary date).
   - Returns the draft record. **Does not send the email.**
3. **`sendCoreInvite({ token_id })`** — dispatches the transactional email via existing `/lovable/email/transactional/send`. Sets `admin_pro_invites.email_message_id` equivalent on the token row for audit. Idempotent: won't re-send within 24h without explicit `force: true`.
4. **`resendCoreInvite({ token_id })`** — thin wrapper on `sendCoreInvite` with `force: true`, logs into `reminders_sent`.
5. **`revokeCoreInvite({ token_id })`** — sets `consumed_at` with a `revoked` marker; deletes the hidden professional row if not yet claimed.

## Public routes (unauthenticated)

- **`/activate/$token`** — validates token, presents "Set your password" form; on submit, creates `auth.users`, links to the hidden professional row, then hands off to Stripe Checkout in `setup` mode with `customer=cus_xxx` prefilled and success/cancel URLs. This is a new file `src/routes/activate.$token.tsx`.
- **Success return** goes to `/activate/$token/finishing` which polls the subscription state until the webhook has done its work, then routes the trainer to their new dashboard.

## Webhook (edit existing `src/routes/api/public/payments/webhook.ts`)

Handle `checkout.session.completed` where `mode === 'setup'`:
1. Look up the token by `client_reference_id` (set when creating the Checkout session).
2. Retrieve the SetupIntent, attach the PM to the customer, `stripe.customers.update({ invoice_settings: { default_payment_method } })`.
3. `stripe.subscriptions.create({ customer, items: [{ price: CORE_ANNUAL }], trial_end: target_renewal_at, billing_cycle_anchor: target_renewal_at, proration_behavior: 'none', default_payment_method, metadata: { source: 'admin_core_invite', token_id } })`.
4. Upsert `subscriptions` row (`tier='core'`, `status='trialing'` → will become `active` on anniversary automatically).
5. Flip professional to `is_public=true`, mark `consumed_at` + `consumed_stripe_subscription_id` on the token.
6. Fire "Welcome to Core, your card is on file, first payment on {anniversary}" email.

No change to the existing member cancel/dispute paths — they already handle Core subs.

## Admin UI (new route `src/routes/_authenticated/admin/core-invites.tsx`)

Single page, three states:

1. **List** — draft / sent / claimed / expired / revoked. Uses shadcn `Table` + `Badge` for status (emerald "Claimed" only, per the status-colour memory).
2. **New invite drawer** (`Sheet`) with a `FieldGroup`:
   - Full name, email, slug (auto-suggested from name), Stripe customer ID, last-payment date (date picker).
   - Below the Stripe customer ID field: a "Verify" button. On success shows a small confirmation card ("This Stripe customer is `jane@example.com` — Jane Doe, created May 2023, card on file: yes"). Admin must click "Looks right" before Save is enabled.
   - "Save as draft" → creates but doesn't email.
3. **Draft detail dialog** — full email preview (rendered from the actual React Email template), plus "Send now" and "Discard".

## Email template

New template `src/lib/email-templates/core-manual-invite.tsx` — copy is straightforward: "Your REPs Core membership is ready to activate. Set your password and add a card — your first payment of £34 is on {anniversary_date}." One CTA button → `/activate/$token`. No "migration"/"legacy"/"honour price" language anywhere (locked constraint). Register in `src/lib/email-templates/registry.ts`.

## Failure modes handled

- **Wrong customer ID** — blocked by the Verify step; admin cannot save without confirming Stripe returned a matching human.
- **Anniversary already past** — server function rejects; admin must set a next-anniversary date. Otherwise Stripe would attempt an immediate charge.
- **Trainer sets password but abandons Stripe** — professional stays hidden, token stays open, admin can resend. `reminders_sent` tracks nudges.
- **Trainer detaches card before anniversary** — Stripe invoice fails → existing `invoice.payment_failed` handler flips `payment_standing` and mutes the profile. No new code needed.
- **Duplicate invite for same email** — server function checks for an unconsumed token on that email and returns the existing one instead of creating a second.

## Explicitly out of scope

- Bulk CSV import. If you need it later, wrap `createCoreInvite` in a loop; not building it now.
- Pro-tier (£59/mo) manual invites — this pass is Core-only. Pro uses the different subscription-mode Checkout path.
- Changing the £34 price, the Core webhook branch's cancel/dispute logic, or the public-facing pricing pages.
- Anything to do with `admin_pro_invites` (that's the from-scratch-signup path — different problem).

## Brutal-truth risks I'm not hiding

1. **You extend up to 12 months of free visibility per trainer.** A saved card is not money in the bank — it's just permission to try. If the "public before paid" window is what actually worries you, the alternative is: charge £34 today with `proration_behavior=create_prorations` and `billing_cycle_anchor=anniversary`, so they pay a prorated amount now and the full amount every anniversary. Say the word and I'll swap the flow — everything else stays identical.
2. **Manual Stripe customer IDs are the weakest link.** The Verify step is the only thing between "great UX" and "publishing the wrong person's card on file." If Verify fails or Stripe is down, the admin cannot save — that's the correct behaviour, not a bug to work around.
3. **Password + payment in one sitting is a lot.** Expect ~15–25% of trainers to drop off between password-set and card-saved. `resendCoreInvite` + reminder cadence built in from day one is why.
