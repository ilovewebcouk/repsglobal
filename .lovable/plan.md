## Production Operations Sprint

Goal: move from "we audit it" to "the platform tells us". No new business logic, no new architecture — wire together what already exists into one operational surface.

Everything lives under `/admin/ops/*`. The `/admin` overview stays as-is.

---

### 1. `/admin/ops` — Operations home

Three top-level cards (Billing / Platform / Customer), each opening into a dedicated section. A red banner appears at the top of every admin page when any alert is firing (uses existing `AdminFailedPaymentsBanner` pattern, extended to read all alert sources).

---

### 2. `/admin/ops/billing` — Billing Health

Live tiles, each a drill-down link:

| Tile | Source | Drill-down |
|---|---|---|
| Payments today | `payment_events` where `type='invoice.paid'` and `created_at::date = today` | filtered table |
| Revenue today | sum of `amount_paid` from same | breakdown by tier |
| Refunds today | `payment_events` where `type='charge.refunded'` | table |
| Failed payments | `subscriptions.status IN ('past_due','unpaid','incomplete')` | list with recovery action |
| Recoveries completed | `churn_lifecycle` where `stage='recovered'` last 30d | table |
| In payment recovery | `churn_lifecycle` where `stage IN ('grace','dunning')` | table |
| Webhook failures | `payment_events` where `dead_lettered_at IS NOT NULL` last 7d | table with replay button |
| DLQ size | same, `WHERE dead_lettered_at IS NOT NULL AND processed_at IS NULL` | table |
| Replay queue | `payment_events` where `replay_requested_at IS NOT NULL AND processed_at IS NULL` | table |
| Avg webhook latency (24h) | `avg(processed_at - created_at)` from `payment_events` | hourly chart |

Each tile is a single server-fn call → record list → record detail (already-built admin record pages where they exist; new minimal list+detail where they don't).

---

### 3. `/admin/ops/platform` — Platform Health

Reads `platform_health_snapshot()` (already exists) plus three new connectivity probes:

- **Stripe ping** — `stripe.balance.retrieve()` ⇒ green/red + latency
- **Mail provider ping** — Mailgun `GET /domains/{domain}` ⇒ green/red + latency
- **Storage ping** — Supabase storage `listBuckets()` ⇒ green/red + latency

Sections:

- Cron table: jobname / schedule / last status / last run / next run / failure-count-24h (from `cron.job` + `cron.job_run_details`)
- Email queue: pgmq `transactional` + `auth` depth, stuck-pending count, last DLQ
- Background jobs: derived from cron + payment_events stale count
- DB health: `pg_stat_activity` connections, deadlocks (`supabase--db_health` snapshot)
- Connectivity: 3 ping tiles above (server-fn, polled every 60s by the page)

---

### 4. `/admin/ops/customer` — Customer Health

| Tile | Source |
|---|---|
| Active Paying Members | existing canonical `getActivePayingMembers()` |
| New Core / Pro / Studio this week | `subscriptions.created_at >= now() - 7 days` grouped by `tier` |
| Churn this week | `subscriptions.status='canceled'` in 7d |
| Recoveries this week | `churn_lifecycle.stage='recovered'` in 7d |
| Pending cancellations | `subscriptions.cancel_at_period_end=true` |
| Failed renewals | `subscriptions.status IN ('past_due','unpaid')` |
| Awaiting payment update | `renewal_tokens.purpose='card_update' AND consumed_at IS NULL` |

Each drills into a filtered member list.

---

### 5. `/admin/ops/member/$userId` — Flight Recorder

The headline feature. A single chronological timeline merging events from every source:

```text
Sources (left = source column label)
─ checkout       payment_events.type='checkout.session.*'
─ payment        payment_events.type IN ('invoice.paid','invoice.payment_failed','charge.*')
─ webhook        payment_events (raw delivery row)
─ subscription   subscriptions row changes (insert + status transitions via audit)
─ membership     derived from subscription.status flips
─ churn          churn_lifecycle stage transitions
─ recovery       renewal_tokens mint/consume
─ email          email_send_log (dedup by message_id, latest status)
─ auth           auth.audit_log_entries
─ profile        identity_name_changes + profile updated_at
─ verification   verification_decisions + verification_notifications
─ support        support_tickets + support_messages
─ reviews        reviews (created / moderated)
─ publishing     professionals.is_published transitions (via admin_audit_log)
─ admin          admin_audit_log where target_id = userId or actor_id = userId
```

Server fn `getMemberTimeline({ userId, limit?, before? })` returns a sorted, paginated event list. Each event is normalized to:

```ts
{ ts, source, type, status, summary, entityId, entityKind, externalUrl? }
```

UI: vertical timeline (icon per source, status colour), grouped by day, with filter chips (source toggle), search box (matches summary/entityId), and "Open in Stripe" / "Open record" buttons where applicable.

A member-finder header (email or user-id search via `search_profiles_by_id_prefix`) routes here.

---

### 6. Automatic Alerts

New table `ops_alerts (id, kind, severity, opened_at, resolved_at, context jsonb, ack_by, ack_at)` + an `ops_alerts_evaluate()` SECURITY DEFINER function scheduled every 5 minutes by `pg_cron`. It opens/closes alerts based on rules:

| Kind | Rule |
|---|---|
| `cron.failed` | any cron job with failed last run |
| `webhook.dlq_growing` | `dlq_webhook_events_7d` increased vs 5-min-ago snapshot OR > 10 |
| `email.queue_backing_up` | `queue_transactional + queue_auth > 100` |
| `email.dlq` | `dlq_emails_7d > 0` |
| `payments.spike` | failed payments today > 3× rolling 7-day avg |
| `payments.refund_spike` | refunds today > 3 |
| `stripe.outage` | last connectivity probe failed |
| `mail.outage` | last probe failed |
| `storage.outage` | last probe failed |

Auto-resolves when the rule no longer holds. Open alerts surface on the red admin banner with a count + link to `/admin/ops/alerts` (list + ack action).

No email/SMS notifications in this sprint — just in-app surfacing. (Email-out can be added later behind an alert-router; the table is the contract.)

---

### Architecture freeze

This sprint creates only:
- 5 new admin routes (read-only views)
- 1 new server-fn module (`src/lib/ops/*.functions.ts`)
- 1 new table (`ops_alerts`) + 1 evaluator function + 1 cron job
- 3 connectivity-probe server fns
- 1 timeline aggregator server fn

It changes no billing logic, no webhook logic, no renewal logic, no churn logic, no reconciliation logic.

---

### Acceptance checks (run before closing)

1. Open `/admin/ops/member/<known userId>` for a known recovered member → see the full failure → recovery loop end-to-end.
2. Open `/admin/ops/billing` → click DLQ tile → see the dead-lettered rows.
3. Open `/admin/ops/platform` → see 3 green connectivity tiles.
4. Manually `UPDATE cron.job ... active=false` on a job → within 5 min `ops_alerts` opens → banner appears.
5. Re-enable the job → alert auto-resolves within 5 min.

---

### Technical notes

- All ops server fns gated by `requireSupabaseAuth` + `has_role(userId,'admin')`.
- Connectivity probes use existing `MAILGUN_CONNECTION_KEY`, `STRIPE_SECRET_KEY`, and the project's Supabase service-role client — no new secrets.
- Timeline aggregator is a single server fn that runs ~14 parallel SELECTs (one per source), merges, sorts, paginates by `(ts, id)` cursor. Avoids a heavy `UNION ALL` view; keeps each source query trivially indexable.
- New `ops_alerts` table has UNIQUE `(kind, opened_at)` partial-index `WHERE resolved_at IS NULL` so the evaluator can `INSERT ... ON CONFLICT DO NOTHING` without dupes.
- The evaluator runs as `SECURITY DEFINER`, revoked from `anon/authenticated`; only cron + the ops page (via service-role server fn) calls it.

---

### Out of scope (explicitly)

- New KPIs on `/admin` overview (philosophy point 6).
- Email/SMS alert delivery (in-app only this sprint).
- Any change to billing, webhook, renewal, churn, or reconciliation logic (freeze).
- A new dashboard for trainers — ops surface is admin-only.