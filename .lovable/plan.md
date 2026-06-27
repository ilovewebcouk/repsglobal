## Gated, evidence-first recovery

No production writes happen until each gate is approved. Four steps, each ends with a report you sign off before the next runs.

---

### Step 1 — Prove the mapping failure (READ ONLY)

New admin-only server fn: `src/lib/admin/webhook-diagnosis.functions.ts` → `diagnoseWebhookFailures({ since })`.

For every `payment_events` row with `processing_error IS NOT NULL` since the cutoff, the report includes:

| Column | Source |
|---|---|
| `stripe_event_id` | `payment_events.stripe_event_id` |
| `event_type` | `payment_events.event_type` |
| `stripe_customer_id` | `payment_events.stripe_customer_id` |
| `customer_email` | live Stripe `customers.retrieve()` (read-only) |
| `processing_error` | `payment_events.processing_error` |
| `lookup_attempted` | array of which existing ladder steps were tried and what they returned (`metadata.reps_user_id`, `subscriptions.stripe_customer_id`, Stripe customer metadata) |
| `would_resolve_via` | first step of the NEW ladder that would succeed (`legacy_stripe_link → bd_member_seed.claimed_user_id` / `email → auth.users.id`) — or `null` if still unresolvable |
| `resolved_user_id` | uuid the new ladder produces |
| `bd_member_id` | `legacy_stripe_link.bd_member_id` |
| `would_create_subscription` | true/false (based on event_type ∈ subscription.created / invoice.payment_succeeded) |

Surfaced at `/admin/webhook-diagnosis` (admin-gated) plus a JSON download. Pure SELECT — zero writes.

**Gate:** you confirm every failed event traces to the same missing-link path. I do nothing else until you say go.

---

### Step 2 — Resolver fix (CODE ONLY, no replay)

Edit `src/routes/api/public/payments/webhook.ts` `resolveUserId()`:

1. `metadata.reps_user_id` *(unchanged)*
2. `subscriptions.stripe_customer_id` *(unchanged)*
3. Stripe customer `metadata.reps_user_id` *(unchanged)*
4. **NEW** `legacy_stripe_link.stripe_customer_id` → `bd_member_seed.claimed_user_id` (only if `claimed_user_id IS NOT NULL`)
5. **NEW** `customer.email` (lower-cased) → `auth.users.id` where `email_confirmed_at IS NOT NULL` AND a `bd_member_seed.claimed_user_id` matches the same user (collision guard)

On success via steps 4–5, write `reps_user_id` back to the Stripe customer's `metadata` so future events take the fast path. Existing order untouched.

Add unit-style sanity check via `invoke-server-function` against the diagnosis fn re-run: the same 13 events now report `would_resolve_via` for steps 4 or 5 only — proves the fix without touching any other row.

**Gate:** you approve before any replay.

---

### Step 3 — Dry-run replay (READ ONLY)

New admin fn: `replayPaymentEvents({ since, dryRun: true })`. For each failed event it computes — without writing — exactly what the live handler would do and returns:

| Column | Meaning |
|---|---|
| `would_create_subscription` | yes/no + planned `tier`, `status`, `current_period_end` |
| `would_update_bd_next_due_date` | current → planned date (only if planned > current) |
| `would_update_legacy_stripe_link` | which fields would change |
| `would_send_renewal_email` | yes/no + template (`renewal-success` / `card-declined` / `card-missing`) |
| `would_enter_churn_lifecycle` | yes/no + reason |
| `conflicts` | duplicate stripe_subscription_id, mismatched email, already-active sub, etc. |

Output rendered at `/admin/webhook-diagnosis` next to the diagnosis table, plus JSON download.

**Gate:** you eyeball the dry-run. If anything looks wrong I stop.

---

### Step 4 — Replay (WRITES, idempotent)

`replayPaymentEvents({ since, dryRun: false })`. Implementation rules:

- Reuse the existing webhook upsert helpers (`upsertSubscriptionFromStripe`, invoice handlers) — single code path, no parallel logic to drift.
- All writes idempotent:
  - `subscriptions` upsert keyed on `stripe_subscription_id` UNIQUE.
  - `bd_member_seed.bd_next_due_date` only advances if the new date > current.
  - `legacy_stripe_link.last_paid_at` only advances if newer.
  - `churn_lifecycle` upsert keyed on `(user_id, stripe_subscription_id)`.
  - Renewal-token emails de-duped via `email_send_log` (existing table) keyed on `(user_id, template, stripe_event_id)`.
- Per-event transaction. On success: clear `processing_error`, set `processed_at`.
- On failure: leave row untouched, record the new error, continue.
- Safe to re-run any number of times — second run is a no-op.

**Final acceptance report** (returned by the fn and shown in the UI):

| Metric | Before | After |
|---|---|---|
| `payment_events` rows with `processing_error` (last 7d) | n | n |
| `subscriptions` rows created in this run | — | n |
| `bd_member_seed.bd_next_due_date` advances | — | n |
| `legacy_stripe_link` updates | — | n |
| Renewal-success emails sent | — | n |
| Churn-lifecycle entries created | — | n |
| Webhook failures remaining | n | n |
| Active Paying Members (canonical collection) | n | n |
| Revenue received (last 7d, canonical) | £n | £n |

Plus a per-event row showing exactly what changed, so the diff is auditable.

---

## Technical notes

- All four steps live behind `has_role('admin')` checks inside the server functions; UI route gated by `_authenticated` + admin guard.
- No new tables. No migrations needed for Steps 1–4 unless we decide to persist the diagnosis snapshot — happy to add a `webhook_replay_runs` audit table if you want a permanent trail; flagging as optional.
- No changes to canonical Active Paying Member predicates. Once `subscriptions` rows exist + `bd_next_due_date` advances, the existing math counts them automatically.
- No changes to the renewal engine, dashboard KPI logic, or any unrelated surface.

## Out of scope (explicit)

- Adding `/admin/webhook-failures` ongoing-monitoring view → separate follow-up after replay succeeds.
- Backfilling `migration_stripe_customer_id` on `bd_member_seed` → not needed for the fix; can be a tidy-up later.
- Anything Studio/Pro launch related.
