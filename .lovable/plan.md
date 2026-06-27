## The actual problem (brutal honest truth)

Raheela isn't a "signed up, never paid" account. She's a **launch-day churned member with a failed payment that nobody got told about**. The dashboard hid that.

### What I found in the database

| Field | Value |
|---|---|
| BD member ID | 705 (legacy £34/yr, joined 2024-10-02) |
| Renewal ran today | 27 Jun 2026 05:37 UTC — created `sub_1Tmow2AP31Yc4cJj822tte4r` for £99/yr |
| Stripe events received | `customer.subscription.created`, `invoice.payment_failed`, `charge.failed` (your `pi_3Tmow3AP31Yc4cJj25ioNNNi`) |
| Resulting `subscriptions` row | `tier=free`, `status=incomplete`, current_period_end=27 Jun 2027 |
| `churn_lifecycle` row | **none** |
| `renewal_tokens` row | **none** |
| Recovery email sent | **none** |

She failed the predicate `tier ∈ {verified,pro,studio} AND status ∈ {active,trialing}`, so she vanished from "Active Members" silently. No nudge, no flag, no email.

Across all 7 migrated BD members the breakdown is **6 active/verified, 1 incomplete/free (Raheela)** — launch day actually lost one customer and the system never told you.

## Two bugs to fix, not one

### Bug 1 — payment-failed migrations aren't enrolled in churn recovery

`src/routes/api/public/payments/webhook.ts` handles `invoice.payment_failed`, but for a brand-new migration sub whose first invoice fails, it doesn't:
- insert a `churn_lifecycle` row with stage `payment_failed`
- mint a `renewal_tokens` row
- send the win-back / card-update email

**Fix:** in the `invoice.payment_failed` handler, when the sub originates from `metadata.reps_legacy_migration='true'` OR when there's a matching `legacy_stripe_link` for the customer, enrol the user into `churn_lifecycle` (`stage='payment_failed'`, `reason='migration_first_invoice_failed'`), mint a single-use renewal token, and send `renewal-card-update` email. Reuse the existing pipeline — no new template.

Apply the same routing to any future `invoice.payment_failed` on an `active` sub (state change to `past_due`) so this never happens again.

**Backfill:** insert Raheela into `churn_lifecycle` + mint her token + send the email today.

### Bug 2 — the dashboard hides churned/incomplete members

Right now an incomplete sub or a failed-payment sub disappears. It should be visible and named.

`/admin` tile becomes one canonical number — **Active REPS Professionals** — with three sub-counters that explain every gap.

> An **Active REPS Professional** = confirmed `auth.users` + non-demo `professionals` row + active paid membership (sub OR legacy OR BD) + not a platform admin.

Sub-line: `391 paying · 1 payment failed · 0 ghost subs`

### `/admin/reconciliation` — four drift panels

1. **Payment failed / churning** — subs in `incomplete` / `past_due`, plus anyone in `churn_lifecycle` with stage `payment_failed`. Shows last attempt, days since failure, whether a recovery email was sent, "Resend card-update email" + "Open in Stripe" actions. Raheela goes here.
2. **Profiles not paying** — confirmed pros with no active membership AND no failed-payment history. (Today: 0 once Raheela moves to panel 1.)
3. **Paying without a profile** — active members whose user has no `professionals` row. (Today: 0.)
4. **Ghost Stripe subscriptions** — active/trialing sub whose `user_id` doesn't exist in `auth.users`. (Today: 1, going to 0 when you delete `cruz.pt+pro@icloud.com`.)

Every panel's row count reconstructs every number on the platform. No mystery off-by-ones.

### Code changes

```text
src/routes/api/public/payments/webhook.ts
  + on invoice.payment_failed and customer.subscription.updated→past_due:
    – upsert churn_lifecycle (stage='payment_failed', reason, source_event)
    – mint renewal_tokens row
    – send renewal-card-update email (existing template)
    – idempotent on stripe_event_id

src/lib/members/active-paying-member.ts
  + buildActiveRepsProfessionalSet()
    intersects paying collection with confirmed non-demo professionals,
    excludes admins. Returns { professionals, drift: {
    paymentFailed[], profilesNotPaying[], payingWithoutProfile[],
    ghostSubs[] } }

src/lib/admin/overview.functions.ts
  – totalMembers = buildActivePayingMemberCollection(...)
  + activePros + drift counts from buildActiveRepsProfessionalSet

src/lib/admin/professionals.functions.ts
  – "confirmed pros minus admins" arithmetic
  + activeCount from buildActiveRepsProfessionalSet
  + status pills on rows: "Payment failed" / "Not paying"

src/lib/admin/reconciliation.functions.ts
  + getRepsProfessionalReconciliation() returns four drift arrays
  + resendCardUpdateEmail({ user_id }) server action

src/routes/admin.tsx
  + rename tile + 3 sub-counters (clickable into reconciliation tabs)

src/routes/admin_.reconciliation.tsx
  + four tabs: Payment failed / Profiles not paying / Paying without profile / Ghost subs
  + per-row actions (resend email, open in Stripe)

migration: backfill_raheela_into_churn.sql
  + insert one churn_lifecycle row + mint renewal_token for user
    a6719a71-86ff-415d-b738-898b06b63052
  + call sendTransactionalEmailServer('renewal-card-update', ...)
    via a one-off admin action (not in the migration itself)
```

### After ship + your Stripe deletion of `cruz.pt+pro@icloud.com`

- `/admin` tile: **391 Active REPS Professionals** · `391 paying · 1 payment failed · 0 ghost subs`
- Raheela appears under "Payment failed" with `invoice.payment_failed @ 05:37 UTC today`, a "Send card-update email" button, and a Stripe deep-link
- She receives the same renewal-card-update email the system sends to your 27 "blocked" rows
- From now on, every failed launch-day or future renewal payment is auto-enrolled in churn recovery the moment Stripe sends `invoice.payment_failed`

No customer ever silently disappears from a count again.
