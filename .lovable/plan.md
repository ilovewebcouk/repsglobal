# REPS Operations Centre — Finalisation Sprint (Approved, Reduced Scope)

No changes to billing, webhook, renewal, churn, reconciliation, recovery logic.

## Keep
1. **Consolidate `/admin/health`** — redirect to `/admin/ops/platform`. Fold the orphan-sub sweep button into Platform Health.
2. **Universal Member Finder** — single input accepting email, user id, profile id, `cus_…`, `sub_…`, BD member id. Replaces the UUID-only field on `/admin/ops` and the Flight Recorder header.
3. **Email Operations** (`/admin/ops/email`) — time-range/template/status filters, deduped paginated log by `message_id`, stats, queue-depth, suppression list, message lifecycle drill.
4. **Global Activity Stream** (`/admin/ops/activity`) — chronological operational events with deep links.
5. **Flight Recorder improvements** — wire MemberFinder into the header; timeline data served through a provider abstraction so a future event store can swap in without UI change.

## Simplified
6. **Database Health (v1)** — connectivity, active connections, slow queries (top 10 from `pg_stat_statements`), storage usage. Rendered as a new section on `/admin/ops/platform`. No DBA console.
7. **Alerts** — add **acknowledge / mute / notes** to `ops_alerts`. Thresholds stay in code.
8. **Notifications** — **email only** to admin team for newly-opened `crit` alerts. No Slack.
9. **Operations Overview status strip** — Billing · Platform · Emails · Queues · Storage tiles (green/amber/red) on `/admin/ops`, each linking to the matching detail page.

## Out of scope
- Editable threshold UI
- Slack / SMS / PagerDuty
- Any new KPI on `/admin` overview
- Touching billing / webhook / renewal / churn / reconciliation / recovery
- Locked Phase 1 visual screens

## Implementation order
1. Migration (alerts columns + RPCs + cron for alert email dispatch)
2. Member Finder + Flight Recorder header
3. Email Operations page
4. Activity Stream
5. Database Health section
6. System Status strip
7. Alert mute/notes UI + email dispatcher
8. `/admin/health` redirect
