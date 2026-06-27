## Goal

Two things, one system:

1. **Plan A — rescue the 27 "blocked" BD members** who have no Stripe customer when their anniversary lands.
2. **Generalised churn recovery** — anyone whose subscription lapses (failed card, cancelled, BD anniversary with no card, voluntary cancel) gets a structured, automated win-back flow instead of silently disappearing.

Both share the same plumbing: a token-gated `/renew/$token` page, a small "lifecycle" cron, and 3 transactional email templates. Build once, reuse.

---

## Part 1 — Rescue the 27 blocked rows (Plan A)

### Flow

1. Daily cron scans `bd_member_seed` where `migration_status = 'blocked'` AND `access_expires_at` is within the next 14 days AND no `stripe_customer_id`.
2. For each, mint a single-use signed token (random 32-byte, hashed in DB, 30-day expiry) and email them: *"Your REPs membership renews on {date} — add a card to continue at £99/yr."* with a one-tap link to `/renew/$token`.
3. `/renew/$token` validates the token, shows their name + plan + price, launches Stripe Checkout in `setup` mode to capture a card.
4. On successful Checkout: server fn creates the Stripe customer, attaches the payment method as default, creates the £99/yr subscription, links `legacy_stripe_link` row, marks `bd_member_seed.migration_status = 'renewed'`, and sends the existing Verified welcome email.
5. Re-nudge schedule: T-14d, T-7d, T-1d, T+1d (grace), T+7d (final). After T+7d with no action → mark `migration_status = 'lapsed'` and stop emailing.

### Why this and not auto-create-customer
Avoids 27 ghost Stripe customers, preserves correct Verified onboarding UX, no surprise invoices.

---

## Part 2 — Generalised churn recovery (everyone, not just the 27)

### Triggers we catch

| Trigger | Detection | Action |
|---|---|---|
| Stripe `invoice.payment_failed` (smart retries exhausted) | Existing webhook | Enter "dunning" lifecycle |
| Stripe `customer.subscription.deleted` | Existing webhook | Enter "voluntary churn" lifecycle |
| BD anniversary, has `stripe_customer_id` but no active sub | Daily cron | Enter "renewal needed" lifecycle |
| BD anniversary, no `stripe_customer_id` (the 27) | Daily cron | Enter "card needed" lifecycle (= Plan A) |

### Lifecycle stages (stored on a new lightweight `churn_lifecycle` row)

```
active → at_risk → grace → lapsed → recovered | dormant
```

- `at_risk`: card declined / cancellation scheduled / anniversary approaching. Send "action needed" email + show in-app banner.
- `grace`: subscription ended but we keep profile published for 14 days. Sticky dashboard banner + 2 emails (day 1, day 7).
- `lapsed`: profile hidden from public search (admin still sees it), Verified badge removed, **single** monthly win-back email for 3 months, then stop.
- `recovered`: came back via `/renew/$token` or new Checkout → restore prior tier, log to audit.
- `dormant`: no action after 3 months → stop emailing, leave in admin only.

### Single shared `/renew/$token` page

Handles all four triggers above. Token payload encodes `{ user_id, intended_plan, source }` so the same page works for "add a card" (Plan A) and "update a card" (dunning) and "reactivate" (lapsed).

### Admin surface

New `/admin/churn` tab on the existing migration admin page:
- KPIs: at_risk / grace / lapsed / recovered (last 30d).
- Per-row: who, why, last email sent, days in stage, manual "send nudge now" + "mark recovered" actions.
- Filter for the original 27 cohort.

---

## What gets built

### Database (1 migration)
- `churn_lifecycle` table: `user_id`, `stage`, `reason`, `entered_at`, `last_nudge_at`, `nudge_count`, `source_event`, `metadata jsonb`. RLS: admin read, service_role write.
- `renewal_tokens` table: `token_hash`, `user_id`, `purpose`, `expires_at`, `consumed_at`. RLS: admin read only; service_role write; validation via SECURITY DEFINER RPC.
- Helper RPCs: `mint_renewal_token`, `consume_renewal_token`, `enter_churn_stage`.
- Add `lapsed` filter to existing public search (hide lapsed pros, same way demos are hidden).

### Server functions / routes
- `src/lib/churn/lifecycle.functions.ts` — stage transitions, token mint, nudge dispatch.
- `src/lib/billing/renew.functions.ts` — `startRenewalCheckout({ token })`, `completeRenewalCheckout({ session_id })`.
- `src/routes/_public/renew.$token.tsx` — public token-gated page (noindex), no auth required.
- `src/routes/api/public/hooks/lifecycle-cron.ts` — daily cron entry point (anniversary scan + nudge dispatch + lapse transitions).
- Extend existing Stripe webhook at `src/routes/api/public/hooks/stripe.ts` to call `enter_churn_stage` on `invoice.payment_failed` and `customer.subscription.deleted`.

### Emails (3 new templates, all using existing `sendTransactionalEmailServer`)
- `renewal-card-needed` (Plan A primary)
- `renewal-payment-failed` (dunning)
- `winback-lapsed` (3-month monthly cadence)

All link to `/renew/$token`. No marketing tone — strictly transactional ("your account", "your renewal").

### Cron
- Single daily job at 09:00 UK calling `/api/public/hooks/lifecycle-cron` (apikey header). Idempotent — safe to re-run.

### Admin UI
- `/admin/churn` tab with the KPIs + table described above.
- Add a "Lifecycle" chip to existing admin professional rows so churn state is visible from `/admin/professionals` too.

---

## What I am NOT doing

- No auto-creating Stripe customers without consent (rejects Option B from earlier).
- No SMS / push — email-only first pass.
- No changing the existing renewal cron logic for the 356 healthy `future_due` rows; they keep renewing normally.
- No re-running launch-day billing.
- No marketing/upsell content in any of these emails.

---

## Open question before I build

**Grace period length** — I've planned 14 days of "keep profile published after sub ends" as a default. Some platforms do 0 (cut instantly), some do 30. **What do you want — 0 / 7 / 14 / 30 days?** This is the only product decision I need; everything else is mechanical.
