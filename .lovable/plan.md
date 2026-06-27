# Phase 2 — Production Readiness Remediation

The audit scored REPS **58/100**. Below is the sequenced fix plan. Nothing new gets built until these land. Each block is independently shippable and verifiable.

---

## P0 — Money & customers leaking (ship this week)

### 1. Schedule the three missing cron jobs
Without these, churn/dunning, insurance renewals, and credit refills simply don't run.
- `lifecycle-cron` → daily 06:00 UTC → `POST /api/public/hooks/lifecycle-cron`
- `insurance_check_renewals` → daily 07:00 UTC
- `run_monthly_credit_refills` → 1st of month 02:00 UTC

Verify with `SELECT * FROM cron.job` + a manual trigger of each, inspect `cron.job_run_details`.

### 2. Payment-failure → churn enrolment in the webhook
In `src/routes/api/public/payments/webhook.ts`, on `invoice.payment_failed` AND `customer.subscription.updated → past_due`:
- upsert `churn_lifecycle` (`stage='payment_failed'`)
- mint `renewal_tokens` row
- send `renewal-card-update` email (existing template)
- idempotent on `stripe_event_id`

Backfill Raheela today with a one-off admin action.

### 3. Revenue & forecast KPI correctness
- Net refunds from MTD/YTD revenue tiles in `src/lib/admin/overview.functions.ts`
- Exclude `cancel_at_period_end = true` subs from forward forecast
- Add a unit-level reconciliation test that compares Stripe `balance_transactions` total to the dashboard figure for a known day.

---

## P1 — Data integrity & access (next)

### 4. Subscriptions → auth.users integrity
- Add a nightly reconciliation query that surfaces ghost subs (already shipped in `/admin/reconciliation`).
- Add a Postgres trigger on `subscriptions` insert/update that sets `status='ghost'` when `user_id` is not in `auth.users`, so they never silently count.
- Do NOT add a hard FK to `auth.users` (Supabase rule) — use the trigger instead.

### 5. `has_role` RPC grant audit
Confirm `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated` is present. Add a migration if missing. Add a smoke test that hits an admin-only route as a non-admin and expects 403.

### 6. GDPR erasure completeness
Extend the account-deletion server fn to also wipe PII from the four trailing tables identified in audit section D (enquiries, reviews author fields, support_messages, lead_activity). Add a test that asserts `count(*) = 0` for the deleted user across all PII tables.

---

## P2 — Email pipeline & enforcement

### 7. Fix verification email queue name
In `src/lib/.../verification.functions.ts` change PGMQ queue from `transactional` → `transactional_emails`. Send a real verification email end-to-end on staging to confirm.

### 8. Missing confirmation emails
Add three templates and wire triggers:
- `purchase-confirmation` (after `checkout.session.completed`)
- `cancellation-confirmation` (after `subscription.updated → cancel_at_period_end=true`)
- `refund-confirmation` (after `charge.refunded`)

### 9. Server-side waitlist / tier enforcement
In `createCheckoutSession`, reject `tier='pro'` unless the caller is on the Pro Founding allow-list OR Pro is publicly open. Today the UI is the only gate.

---

## P3 — Observability before wider launch

### 10. Reconciliation dashboard hardening
- The 4 reconciliation panels (`Payment failed / Profiles not paying / Paying without profile / Ghost subs`) become the canonical "everything adds up" view.
- Add a daily Slack/email digest from `lifecycle-cron` summarising drift counts so silent regressions can't hide.
- Add a `/admin/health` page that surfaces: last cron run per job, DLQ depth, suppression count delta, webhook error rate (last 24h).

---

## Sequencing & sign-off

```text
Week 1   P0 (#1, #2, #3)         → re-run audit on revenue/churn lifecycles
Week 2   P1 (#4, #5, #6)         → re-run audit on data integrity + auth
Week 3   P2 (#7, #8, #9)         → end-to-end email smoke tests
Week 4   P3 (#10) + final pass   → re-score audit; target ≥ 90/100 before wider launch
```

Exit criteria for wider launch:
- All 10 items shipped + verified in production.
- Audit re-run scores ≥ 90/100.
- 7 consecutive days with zero unexplained drift in the 4 reconciliation panels.
- Every Stripe webhook event in the last 7 days has a matching downstream side-effect log.

## Technical notes
- No schema changes required beyond #4 (trigger) and #6 (deletion fn). No table renames.
- All cron jobs registered via `supabase--insert` per the schedule-jobs guide using `apikey` header (not a custom shared secret).
- All new code paths idempotent on `stripe_event_id` / `idempotencyKey`.
- Locked Phase 1 visuals are not touched — admin/reconciliation UI already exists; we're only adding the health page and digest.

Approve and I'll start with P0 #1 (cron schedules) and #2 (webhook payment-failed routing) in parallel.
