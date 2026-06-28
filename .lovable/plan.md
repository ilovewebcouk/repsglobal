# Chargeback / Dispute Lifecycle

## Part 1 — Read-only audit (current state)

**Webhook coverage (`src/routes/api/public/payments/webhook.ts`)**
- Only `charge.dispute.created` and `charge.dispute.closed` are routed, and only when a `stripe-account` header is present (Connect path → updates `bookings.dispute_status`).
- Platform-level disputes (REPS membership Stripe account, no connected account) hit `default: break` — no business logic runs.
- `charge.dispute.updated`, `funds_withdrawn`, `funds_reinstated` are **not** routed anywhere.

**`payment_events` evidence**
- 1× `charge.dispute.created` (du_1TnGABAP31Yc4cJjk1J0oA3G, livemode, £34, reason `subscription_canceled`, status `needs_response`, pi `pi_3Tgvq6AP31Yc4cJj2MXkOoT8`)
- 1× `charge.dispute.funds_withdrawn`
- 17× `charge.dispute.updated`
- Every row has `user_id = null`, `stripe_subscription_id = null`, `stripe_customer_id = null` — current persistence in `recordEvent()` doesn't resolve dispute → charge → PI → subscription → user.

**Subscription / entitlement impact**: none. The disputed user still counts in `fetchActivePayingMemberCollection()`, still appears in `/admin/professionals`, still shows public Verified status, and the subscription has not been cancelled. No timeline, alert, or email exists.

**Admin visibility**: zero. `/admin/payments` has a dead `disputeRate` tile fed from a manual bookings calc; `/admin/ops/billing`, `/admin/reconciliation`, `/admin/ops/activity`, `/admin/ops/member/$userId` have no dispute surface.

**Revenue handling**: `getOverviewKpis().revenueReceivedPence` is gross successful charges — no deduction for withdrawn funds.

**Metric Registry**: no M-row exists for Open Disputes / Disputed Amount / Chargebacks Won/Lost.

**Conclusion**: gap is total for platform (non-Connect) disputes. Implementation must not change Connect/booking dispute behaviour or `FAILED_PAYMENT_STATUSES`.

---

## Part 2 — Implementation

### 2.1 Schema (migration)

New table `public.disputes`:
- `id` uuid pk
- `stripe_dispute_id` text unique
- `stripe_charge_id`, `stripe_payment_intent_id`, `stripe_subscription_id`, `stripe_customer_id`
- `user_id` uuid (resolved)
- `amount_pence` int, `currency` text
- `reason` text, `status` text (Stripe raw)
- `lifecycle_stage` text — `opened | funds_withdrawn | funds_reinstated | won | lost`
- `evidence_due_by` timestamptz
- `funds_withdrawn_pence` int, `funds_reinstated_pence` int
- `opened_at`, `closed_at`, `updated_at`
- raw `payload` jsonb

GRANTs to `service_role` + `authenticated` (select via admin RLS using `has_role`).

Add `payment_standing` text column to `subscriptions` (nullable, values: `ok | payment_disputed | chargeback_lost | chargeback_won`) — kept distinct from `status` so verification/qualification flags remain untouched.

Index `subscriptions(payment_standing)` for fast filtering.

### 2.2 Webhook routing (`src/routes/api/public/payments/webhook.ts`)

Add new `handlePlatformDispute(dispute, eventType)` (Connect path preserved unchanged):

- `charge.dispute.created` → upsert dispute row (stage `opened`), resolve `charge → payment_intent → invoice → subscription → user`, set `subscriptions.payment_standing='payment_disputed'`, **immediately cancel the Stripe subscription** (`stripe.subscriptions.cancel(id, { invoice_now: false, prorate: false })` with try/catch), mark local `subscriptions.status='canceled'`, fire `ops_alerts` insert (`severity='critical', kind='dispute_opened'`), append Member Timeline event, enqueue `chargeback-received` email.
- `charge.dispute.updated` → update stage + status + `evidence_due_by`.
- `charge.dispute.funds_withdrawn` → set `funds_withdrawn_pence`, stage `funds_withdrawn`, timeline event.
- `charge.dispute.funds_reinstated` → set `funds_reinstated_pence`, timeline event.
- `charge.dispute.closed` →
  - won: stage `won`, `closed_at`, timeline event, send `chargeback-resolved-won` (do NOT auto-reinstate sub — flag for admin review).
  - lost: stage `lost`, `subscriptions.payment_standing='chargeback_lost'`, `churn_lifecycle` row with reason `chargeback_lost`, send `chargeback-resolved-lost`.

Route platform path when `request.headers.get('stripe-account')` is **null** (Connect path stays as-is).

### 2.3 Active-paying-member exclusion

`src/lib/members/active-paying-member.ts` → in `isActiveSubscription`, exclude rows whose `payment_standing IN ('payment_disputed','chargeback_lost')` even if status was `active` at snapshot. Pass `payment_standing` through `active-paying-member.server.ts` select.

This removes the disputed member from M1, /admin/professionals "Paid", reconciliation, public Verified badge gating (badge uses `is_pro_fully_verified` + active membership lookup → flips to false automatically without touching `verification_status`).

### 2.4 Public visibility

`src/lib/directory/featured.functions.ts` and `search.functions.ts` already gate on `verification='verified'`. Add a join filter excluding users whose latest subscription has `payment_standing` in (`payment_disputed`, `chargeback_lost`). Verification record itself is untouched.

### 2.5 Admin surfaces

- `/admin/ops/billing` → new "Open disputes" tile + "Disputed amount" tile + list card (member, amount, reason, due-by countdown, Stripe link, status).
- `/admin/payments` → replace dead `disputeRate` tile with Open / Won / Lost split sourced from `disputes` table.
- `/admin/reconciliation` → new "Disputed funds" rail (withdrawn − reinstated).
- `/admin/ops/activity` → render dispute events from `disputes` + `payment_events`.
- `/admin/ops/member/$userId` → timeline entries (`dispute_opened`, `funds_withdrawn`, `funds_reinstated`, `dispute_won`, `dispute_lost`) with amount/reason/Stripe deep link.
- New `ops_alerts` humanizer entries in `src/lib/ops/alert-humanizer.ts`.

### 2.6 Emails (React Email templates)

`src/lib/email-templates/chargeback-received.tsx`, `chargeback-resolved-won.tsx`, `chargeback-resolved-lost.tsx` registered in `registry.ts`. Plain, neutral language; no aggressive recovery copy; does NOT loop through the renewal/lifecycle cron.

Explicitly: lifecycle cron (`src/routes/api/public/hooks/lifecycle-cron.ts`) must skip subscriptions where `payment_standing != 'ok'` so no `renewal-payment-failed` / nudge emails fire on disputes.

### 2.7 Metric Registry

Append M17–M20 in `docs/11_admin_metric_registry.md` and surface in `src/lib/admin/metrics-definitions.ts`:
- **M17 Open disputes** — `disputes` where `lifecycle_stage IN ('opened','funds_withdrawn','funds_reinstated')`.
- **M18 Disputed amount (open)** — sum of `amount_pence` for M17.
- **M19 Chargebacks won (30d)** / **M20 Chargebacks lost (30d)**.
- Add banned-synonym row: never collapse disputes into "Failed payments".

### 2.8 Backfill the live dispute

One-off SQL inside the same migration: resolve `pi_3Tgvq6AP31Yc4cJj2MXkOoT8` against Stripe in code (or, simpler, run a recovery server-fn that re-fetches the dispute via Stripe API, inserts the `disputes` row, sets `payment_standing`, cancels the sub if still live, writes timeline events). Admin-only button "Replay dispute events" on `/admin/ops/billing` to re-process the 19 unprocessed rows.

### 2.9 Subscription billing-stop posture

Approach: **cancel immediately on dispute open** (clearer, deterministic, avoids further disputed invoices). Documented in code comment. We do not rely on Stripe's "Cancel subscriptions on dispute" Radar setting because we want the cancel to happen in the same transaction that flips `payment_standing`.

---

## Part 3 — Out of scope (explicit)

- Connect/booking `handleConnectDispute` behaviour stays unchanged.
- `FAILED_PAYMENT_STATUSES` not modified.
- BD renewal engine untouched.
- Pricing / verification / qualification logic untouched.
- No marketing or bulk emails.

## Acceptance checklist

All 10 acceptance items from the brief map to: 2.3 (1,2), 2.4 (3), 2.2 + 2.9 (4), 2.5 (5,6), 2.5 + 2.6 timeline (6), 2.2 + 2.5 (7), 2.2 closed branch (8), 2.7 (9), 2.6 lifecycle-skip (10).
