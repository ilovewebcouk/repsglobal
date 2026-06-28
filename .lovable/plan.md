
# Why Adam was not processed today (28 Jun)

Short answer: the launch script tagged him `future_due` at import. The renewal engine's first run after launch read that tag and wrote `legacy_stripe_link.migration_status = 'skipped'`. From that moment on, the daily candidate query — which requires `migration_status = 'ready'` — could never select him again. Today's run skipped him for the same reason yesterday's did: he is permanently invisible to the engine, not waiting for a date.

## The launch plan vs. what shipped

The plan said `future_due` meant "their BD access is still good — don't charge yet — re-evaluate when their due date arrives." The code that does the re-evaluation step does not exist. There is no job, trigger, or branch anywhere in the codebase that promotes a `future_due` row from `skipped` back to `ready` when its `bd_next_due_date` passes. We shipped the "park them" half and not the "release them" half.

## Adam's row, today

| field | value |
|---|---|
| `bd_next_due_date` | **2026-06-28** (today) ✓ should fire |
| `legacy_stripe_link.access_expires_at` | 2026-06-27 23:47 (yesterday) ✓ in window |
| `legacy_stripe_link.migration_status` | **`skipped`** ✗ excluded by candidate query |
| `migration_cohort_override` | `future_due` ✗ override branch re-skips even if selected |
| `migration_cohort_reason` | NULL (no reason was ever recorded) |
| `legacy_kind` | `one_time` |
| `stripe_customer_id` | `cus_QNMbWiFzzt2Yx5` (exists, payment-method state unverified) |
| `subscriptions` / `payment_events` / `churn_lifecycle` / recovery email | none |

The cron ran at 03:00 today. It selected its candidate set with `WHERE migration_status = 'ready'`. Adam's row says `skipped`, so he was not in the set. No attempt was made, no Stripe call, no webhook, no churn row, no email. From the engine's point of view he doesn't exist.

## The double lock

Even if I patched only the selection predicate, Adam still wouldn't process today, because there is a second exclusion inside the run loop:

```text
src/lib/admin/stripe-linking.functions.ts:404-413
if (ov?.cohort && ov.cohort !== 'honour_window' && ov.cohort !== 'anomaly_launch_charge') {
  // future_due / manual_review / blocked → re-mark migration_status = 'skipped' and continue
}
```

So `future_due` is rejected in two places. Both need to change for the launch plan to behave as written.

## This isn't just Adam

The same lock applies to **242 BD members**. All `legacy_kind = 'one_time'`, all `migration_cohort_override = 'future_due'`, all `migration_cohort_reason` NULL, all with valid Stripe customers, none with any downstream record. 5 are past due as of today; the rest age into the same trap on their BD date. Adam is the one we noticed because he's today's date.

## Adjacent risk (not the cause, but related)

The `legacy-renewal` cron is registered in `pg_cron` to send the Supabase anon key in the `apikey` header, but the route at `src/routes/api/public/hooks/legacy-renewal.ts:21-35` only accepts `CRON_SECRET` or `service_role` and explicitly rejects anon. This is the same auth-contract bug we fixed last turn on `lifecycle-cron`. It can't be confirmed from `cron.job_run_details` (which only logs pg_net submission success), and the live HTTP response is gone after ~6 h. If the auth check is rejecting daily, the engine has been a no-op for **everyone** since launch — not just the 242. Worth a one-call verification.

## What I am proposing (read-only audit is already done; this is the fix plan)

I won't run any of this until you say so.

1. **Fix the auth contract** on `legacy-renewal` to match `lifecycle-cron` (accept anon `apikey`). Verify with one invocation before touching any data.

2. **Make the `future_due` hold time-based, not sticky.** In `_runLegacyRenewalBatch`:
   - The candidate query selects rows where `migration_status IN ('ready', NULL)` OR `(migration_cohort_override = 'future_due' AND bd_next_due_date <= now())`.
   - The override branch only re-skips a `future_due` row when `bd_next_due_date > now()`. Once the date has passed, the row falls through and gets processed by the same code path as every other member.
   - This means Adam (and the 5 past-due) flow through naturally on the next run. The remaining 237 wait, then release themselves on their date.

3. **Backfill: one engine run with `limit=300`** after the fix lands. No new code path, no manual inserts. Whatever happens (Stripe charge succeeds → Core subscription; Stripe needs a card → `awaiting_payment_method` → existing claim-and-renew email) is the production path everyone else uses.

4. **Add a `/admin/ops` invariant tile**: "BD members past due with no engine activity in 24h". Catches any future drift the same way the failed-payment banner catches webhook gaps.

5. **Regression test**: seed one `future_due` row with `bd_next_due_date = yesterday`, run the batch, assert it was processed.

## What I am NOT doing

- No insert into `churn_lifecycle` for Adam.
- No manual Stripe call.
- No bespoke "process Adam" button.
- No new email template.
- No webhook, entitlement, or admin-metric changes.

Adam goes through the production path or nothing. The fix is the launch plan's missing half, not a workaround for him.

Approve and I'll start with step 1 (the cron auth verification) before touching the engine.
