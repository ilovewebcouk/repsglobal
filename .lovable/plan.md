
# BD → Stripe Subscriptions Migration

## The brutal truth

Two parallel billing rails is the root cause of nearly every billing bug we've fixed this month: Raheela's failed-charge confusion, KPI drift between `/admin` and `/admin/professionals`, churn-stage ambiguity, dispute-hook branching, the existence of `/admin/ops/billing`'s Site Time panel. Every new feature has to ask "is this a real subscriber or a BD legacy?" That branching is where bugs live.

The fix is to upgrade the back-end primitive from "cron + annual `PaymentIntent`" to a real Stripe Subscription per member, anchored to their original BD renewal date. The **legal basis is unchanged** — BD's T&Cs already grant standing mandate for annual auto-renewal on the stored card, and the current cron relies on that same authority. We're swapping the mechanism, not the consent.

## Population (live numbers, from the database right now)

| Bucket | Count | Treatment |
|---|---:|---|
| BD links with Stripe customer + future renewal | ~340 | **Auto-convert** — no user action |
| BD links with Stripe customer but already lapsed (≤ today) | 9 | **Reactivation magic-link** flow |
| BD links without a Stripe customer (newer seeds, BD-only payers) | 27 | **Setup magic-link** flow (T-30 / T-7 reminders) |
| Already subscribed via new flow | 7 | Skip (idempotent) |
| Total BD links | 390 | |

## Phase 1 — Read-only audit (one turn, sub-agent)

Before any writes, produce `docs/admin-v2/bd-rail-swap-audit-2026-06-28.md` mapping every BD touchpoint we'll either delete, simplify, or migrate:

- All call sites of `legacy_stripe_link`, `legacy_stripe_payments`, `legacy-renewal` cron route, `renewal-engine`.
- Branches in KPI/active-paying-member/dispute/churn that ask "legacy vs new".
- Email templates referencing legacy renewal copy.
- Admin dashboard panels that read from the legacy rail.
- Webhook handlers that special-case `pi_*` outside a subscription.

Deliverable: a defect/leftover list we work through in Phase 4.

## Phase 2 — Auto-convert (the cohort with card on file)

A single TanStack server function `convertLegacyToSubscription({ bd_member_id })`, callable from a new admin action at `/admin/ops/billing` ("Convert BD members → Stripe Subscriptions"), with a dry-run mode and a batched live mode (50 at a time, resumable like the relaunch broadcast).

For each eligible BD member:

1. Resolve the existing Stripe Customer + default PaymentMethod from `legacy_stripe_link.stripe_customer_id`.
2. Create a Stripe Subscription:
   - `customer` = existing customer
   - `items` = single line at the £99 Core annual Price (`PRICE_CORE_YEARLY` in `src/lib/billing.ts`)
   - `default_payment_method` = the existing PM (already authorized under BD mandate)
   - `trial_end` = `legacy_stripe_link.next_due_at` (unix) — Stripe holds without charging until then, then bills £99 and auto-renews annually
   - `proration_behavior: 'none'`
   - `payment_behavior: 'default_incomplete'` is **not** needed — trial period defers the first charge cleanly
   - `metadata: { migrated_from: 'bd_legacy', bd_member_id, original_next_due: <iso> }`
3. Insert into `public.subscriptions` with `tier='verified'`, `status='trialing'` (until anchor flips it to `active`), `payment_standing='ok'`, `stripe_subscription_id`, `current_period_end = next_due_at`, `environment='live'`.
4. Mark `legacy_stripe_link.migration_status='converted_to_subscription'` and stamp `stripe_subscription_id`.
5. Enqueue the **"Your REPs membership is now on recurring billing"** confirmation email (template added in Phase 3).
6. Log to `admin_audit_log` with before/after JSON.

If a member is past-due but ≤ 30 days lapsed (per T&Cs grace), include them in this auto-cohort with `trial_end = now() + 7 days` and an honest email: "your renewal will be collected in 7 days unless you cancel from your dashboard."

## Phase 3 — Magic-link cohorts (no card on file + truly lapsed)

Two new public routes under `src/routes/api/public/billing/`:
- `setup-card/$token.tsx` — for BD members with no PaymentMethod. Stripe Checkout in `setup` mode, on success creates the Subscription with `trial_end = next_due_at`.
- `reactivate/$token.tsx` — for lapsed (> 30 days past due). Stripe Checkout in `subscription` mode at £99/yr starting immediately, copy = "reactivate your REPs Core membership."

Tokens stored in a new `billing_setup_tokens` table (24 column-wide; 30-day expiry; one-shot). Three React Email templates:
- `legacy-setup-card-now` (initial)
- `legacy-setup-card-reminder-30` (T-30 before renewal date)
- `legacy-setup-card-reminder-7` (T-7)
- `legacy-reactivate-invite` (lapsed cohort)

Scheduled by extending `cron_should_run_at_london` with a 09:00 London job that picks up tokens whose target renewal is in the T-30 or T-7 window.

If they never click → they lapse to **Unverified** on the renewal date (Trustpilot policy intact, profile stays live).

## Phase 4 — Tear down the legacy rail

After 7 days of green Phase-2 telemetry (no spike in failed payments, no dispute uptick):

- Unschedule the `legacy-stripe-renewal-daily` pg_cron job.
- Mark `/api/public/hooks/legacy-renewal` as 410 Gone (keep file for one release, then delete).
- Remove `is_legacy` / `legacy_kind` branches from `active-paying-member.ts`, KPI queries, dispute hooks, churn lifecycle.
- `legacy_stripe_link` becomes a **read-only historical record** (no writes) — keep for audit + email lookup.
- Delete the Site Time panel's "next renewal run" tile (no longer relevant — Stripe handles it).
- Update `docs/admin-v2/` registry to mark BD migration **closed**.

## Phase 5 — Comms

One email at conversion, no marketing dressing. Sent through existing `sendTransactionalEmailServer` (Mailgun pipeline, already loop-guarded). Subject: *"Your REPs Core membership — next renewal £99 on [date]"*. Body covers: what changed (back-end upgrade, no fee change), confirmed next renewal date and amount, cancel-anytime via dashboard link, support contact. Stripe's own 7-days-before pre-renewal email layers on automatically.

Reactivation cohort gets the **"reactivate"** template instead — different subject, different CTA, no implied charge until they confirm in Checkout.

## Phase 6 — Admin observability

New section in `/admin/ops/billing` (top of page, above Site Time):
- **BD → Stripe migration**: tiles for `auto-convertible / setup-link-required / reactivation / converted / lapsed`, "Run conversion (dry-run)" button, "Run conversion (live, 50 at a time)" button with resume token, last-run timestamp, recent failures table.
- Each row deep-links to `/admin/professionals?q=<email>` and to the Stripe Customer.

## Technical reference

### Schema changes (one migration)

```sql
-- New: token table for setup/reactivate magic links
CREATE TABLE public.billing_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bd_member_id bigint REFERENCES bd_member_seed(bd_member_id),
  user_id uuid REFERENCES auth.users(id),
  email citext NOT NULL,
  kind text NOT NULL CHECK (kind IN ('setup','reactivate')),
  token text UNIQUE NOT NULL,
  target_renewal_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.billing_setup_tokens TO authenticated;
GRANT ALL ON public.billing_setup_tokens TO service_role;
ALTER TABLE public.billing_setup_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tokens" ON public.billing_setup_tokens
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'));

-- Status tracking on legacy_stripe_link
ALTER TABLE public.legacy_stripe_link
  ADD COLUMN IF NOT EXISTS migration_kind text,   -- 'auto'|'setup_link'|'reactivate'
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;
```

### Stripe call shape

```ts
const sub = await stripe.subscriptions.create({
  customer: link.stripe_customer_id,
  items: [{ price: PRICE_CORE_YEARLY }],
  default_payment_method: defaultPm.id,
  trial_end: Math.floor(new Date(link.next_due_at).getTime() / 1000),
  proration_behavior: 'none',
  collection_method: 'charge_automatically',
  metadata: { migrated_from: 'bd_legacy', bd_member_id: String(link.bd_member_id) },
});
```

### Webhook handling

Existing `/api/public/payments/webhook.ts` already consumes `customer.subscription.*` and `invoice.*` events — no changes needed. The `trial_will_end` event 3 days before anchor is opt-in via subscription `trial_settings`; skip it (Stripe sends its own pre-renewal email at 7 days).

### Idempotency

- Server fn skips any `bd_member_id` where `legacy_stripe_link.stripe_subscription_id IS NOT NULL`.
- Stripe `idempotency_key = 'bd-convert-' + bd_member_id` on subscription create.

### Files added/changed

```
docs/admin-v2/bd-rail-swap-audit-2026-06-28.md           (Phase 1)
src/lib/billing/convert-legacy.functions.ts              (Phase 2)
src/lib/billing/convert-legacy.server.ts
src/routes/api/public/billing/setup-card.$token.tsx      (Phase 3)
src/routes/api/public/billing/reactivate.$token.tsx
src/lib/email-templates/legacy-conversion-confirmation.tsx
src/lib/email-templates/legacy-setup-card-now.tsx
src/lib/email-templates/legacy-setup-card-reminder-30.tsx
src/lib/email-templates/legacy-setup-card-reminder-7.tsx
src/lib/email-templates/legacy-reactivate-invite.tsx
src/lib/email-templates/registry.ts                       (add 5 entries)
src/routes/admin_.ops.billing.tsx                         (new migration panel)
src/lib/members/active-paying-member.ts                   (Phase 4: drop legacy branch)
src/routes/api/public/hooks/legacy-renewal.ts             (Phase 4: 410)
```

## Why this is 10/10 and not a stopgap

- One source of truth for paying members.
- Stripe handles SCA, dunning, card updates, portal cancel, pre-renewal email natively.
- KPIs become a single query — no reconciliation needed.
- Disputes, churn, payment recovery all stop branching on legacy.
- The "BD migration" disappears as a concept — every member is just a Stripe subscriber.

## Risks I'm being honest about

- **Dormant-card SCA failures** — same risk as today's cron; Stripe Smart Retries + card-update email handle it, expect a small involuntary-churn tail.
- **First few days, the legacy cron and new subscriptions both exist** — Phase 2 marks `legacy_stripe_link` as converted to prevent double-billing. The audit step (Phase 1) verifies the cron is reading that flag before we go live.
- **Support tickets** — expect a small wave of "what is this email?" replies. Pre-write a saved reply for the support inbox.

## Rough order of magnitude

- Phase 1: 1 sub-agent turn
- Phase 2: 1 build turn (migration + server fn + admin button + dry-run)
- Phase 3: 1 build turn (magic-link routes + email templates + cron)
- Phase 4: 1 build turn (cleanup) — gated by Phase-2 success
- Phase 5/6: included in Phase 2

Start with Phase 1 today, run Phase 2 dry-run as soon as the audit's clean.
