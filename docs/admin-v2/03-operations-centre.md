# REPS Admin v2
## Part III — Operations Centre

**Document:** 03  
**Status:** Draft specification for approval  
**Audience:** Founder, operations, support, engineering, Lovable implementation agent  
**Scope:** `/admin/ops/*`, operational health, alerts, billing health, customer health, platform health, email operations, activity stream, Member Flight Recorder  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

The Operations Centre is REPS' command centre.

It answers:

1. **Is the platform healthy?**
2. **What is happening right now?**
3. **Which members need action?**
4. **What happened to this specific member?**

The Operations Centre is not a replacement for the Business Dashboard. It is not where the founder reads performance. It is where the operator keeps the platform running.

If the Dashboard is the cockpit, Operations is the engine room.

---

## 1. Route Map

```text
/admin/ops                    Operations home
/admin/ops/billing            Billing Health
/admin/ops/platform           Platform Health
/admin/ops/customer           Customer Health
/admin/ops/email              Email Operations
/admin/ops/activity           Global Activity Stream
/admin/ops/alerts             Alerts
/admin/ops/member/$userId     Member Flight Recorder
```

Every route is admin-only.

Every route uses the shared Ops sub-navigation:

```text
Hub · Billing · Platform · Customer · Email · Activity · Alerts · Member Timeline
```

---

## 2. Operations Home

### Purpose

Give a one-screen answer to:

> Is anything wrong?

### Layout

```text
Header
  Title: Operations Centre
  Subtitle: Live operational view of REPS
  Actions: Member Finder · Re-evaluate alerts

System status strip
  Billing · Platform · Email · Customer · Alerts

Quick finder
  Search by email, name, user_id, cus_, sub_, BD id

Cards
  Billing Health
  Platform Health
  Customer Health
  Email Operations
  Activity Stream
  Alerts
```

### System status levels

| State | Meaning |
|---|---|
| Green | No action needed |
| Amber | Degraded or requires attention |
| Red | Revenue, support, compliance or platform risk |

The home page should never become a dense table. It is a launcher and status summary.

---

## 3. Billing Health

### Route

```text
/admin/ops/billing
```

### Purpose

Answer:

> Are payments working?

### Tiles

| Tile | Meaning | Drill-down |
|---|---|---|
| Payments today | Successful payment count today | payment event list |
| Revenue today | Cash received today | payment breakdown |
| Refunds today | Refund events today | refund list |
| Failed payments | Canonical F1 failed payments | recovery list |
| In recovery | Members in recovery lifecycle | churn/recovery list |
| Recoveries 30d | recovered lifecycle rows | member list |
| Webhook failures | DLQ / failed events | webhook recovery |
| Webhook latency | p50 / p95 processing latency | latency chart |

### Recovery actions

Failed payment rows must support:

- Open Timeline
- Send recovery email
- Open Churn record
- Open Stripe customer/subscription

### Drill-down pattern

Use URL state:

```text
/admin/ops/billing?kind=failed_payments
```

The table title must use human labels, not enum names.

---

## 4. Platform Health

### Route

```text
/admin/ops/platform
```

### Purpose

Answer:

> Is the technical platform healthy?

### Sections

1. Connectivity
2. Database
3. Cron jobs
4. Queues
5. Webhooks
6. Storage
7. Email infrastructure

### Connectivity

Tiles:

- Stripe
- Mail provider
- Supabase Storage
- Database

Show:

- status,
- latency,
- last checked,
- error summary if failed.

Do not run noisy external probes every few seconds. Poll at a sensible interval.

### Database section

Version 1 shows:

- database connected,
- active connections,
- slow queries,
- long-running transactions,
- deadlocks if available.

This is not a DBA console. It is an operational early-warning surface.

### Cron table

Columns:

- job name,
- schedule,
- active,
- last run,
- last status,
- next expected run,
- failures in 24h.

Cron failures should produce an alert.

---

## 5. Customer Health

### Route

```text
/admin/ops/customer
```

### Purpose

Answer:

> Which customer/member cohorts need attention?

### Tiles

| Tile | Meaning |
|---|---|
| Active Paying Members | canonical M1 |
| New Core 7d | Core subscriptions started in last 7d |
| New Pro 7d | Pro subscriptions started in last 7d |
| New Studio 7d | Studio subscriptions started in last 7d |
| Churn 7d | canceled members in last 7d |
| Recoveries 7d | recovered lifecycle rows in last 7d |
| Pending cancellations | cancel_at_period_end members |
| Failed payments | canonical F1 |
| Awaiting payment update | active recovery tokens not consumed |

Every tile must drill into the members behind the number.

The list rows must include:

- member name,
- email,
- tier,
- status,
- reason,
- primary action,
- Open Timeline.

---

## 6. Email Operations

### Route

```text
/admin/ops/email
```

### Purpose

Answer:

> What happened to this email?

### Required capabilities

- time range filter,
- template filter,
- status filter,
- search by recipient/message_id,
- queue depth,
- delivery stats,
- failure stats,
- suppression list,
- paginated email log,
- one logical row per message_id,
- lifecycle drawer showing all statuses and attempts.

### Suppression management

Operators must be able to:

- search suppressions,
- remove a suppression with confirmation,
- see why the suppression exists,
- see the first and latest suppression date,
- open related email history.

### Email lifecycle drawer

Shows:

```text
Queued
Sent
Delivered
Opened / clicked if tracked
Bounced / complained / failed if relevant
```

Each step includes timestamp and provider metadata where available.

---

## 7. Global Activity Stream

### Route

```text
/admin/ops/activity
```

### Purpose

Answer:

> What is happening across REPS right now?

### Event examples

- Member joined
- Payment received
- Payment failed
- Recovery completed
- Refund issued
- Verification approved
- Review flagged
- Support ticket opened
- REP published
- Webhook replayed
- Cron failed
- Email failed
- Admin action performed

### UI requirements

- chronological feed,
- grouped by day,
- kind filters,
- severity filters,
- text search,
- truncation warning when capped,
- Open Timeline link for member events,
- Open record link for related admin objects.

### Design principle

The Activity Stream is not an audit log. It is the operational heartbeat. It should be readable by a non-engineer.

---

## 8. Alerts

### Route

```text
/admin/ops/alerts
```

### Purpose

Answer:

> What requires operator attention?

### Alert states

- Open
- Acknowledged
- Muted
- Resolved

### Required fields

- severity,
- human label,
- plain-English summary,
- opened at,
- last evaluated at,
- affected area,
- recommended action,
- context drawer,
- ack/mute/note actions.

### Human labels

Do not expose raw enum names as the primary label.

Bad:

```text
payment_failed_count_exceeds_threshold
```

Good:

```text
Failed payments above normal
```

### Context

Raw JSON may exist in an engineer drawer, but the main table must summarise context in English.

---

## 9. Member Flight Recorder

### Route

```text
/admin/ops/member/$userId
```

### Purpose

Answer:

> What happened to this member?

This is the most important support tool in Admin v2.

### Sources

- Auth
- Profiles
- Professionals
- Stripe/payment events
- Subscriptions
- Membership state
- Churn lifecycle
- Renewal tokens
- Emails
- Verification
- Reviews
- Support
- Admin actions
- Publishing

### Event shape

```ts
{
  ts: string
  source: string
  type: string
  status: string
  summary: string
  entityId?: string
  entityKind?: string
  href?: string
  externalUrl?: string
}
```

### UI requirements

- member header,
- universal member finder,
- status badges,
- quick actions,
- grouped timeline,
- source filters,
- date range filter,
- text search,
- pagination,
- Open in Stripe,
- Open related record.

### Quick actions

- Open professional profile
- Open support tickets
- Open billing records
- Send email
- Send recovery email when relevant
- Open verification record

### Golden rule

Every page that references a member links here.

---

## 10. Universal Member Finder

The Member Finder must support:

- email,
- name,
- user id,
- profile id,
- Stripe customer id,
- Stripe subscription id,
- BD member id.

Behaviour:

- exact match navigates immediately,
- multiple matches show a disambiguation list,
- no match gives a clear empty state,
- every result shows name, email, tier and status.

The operator should never need to know a UUID.

---

## 11. Alert Banner Across Admin

Every admin page may display a compact red/amber banner when open alerts exist.

Rules:

- Red for critical issues.
- Amber for attention needed.
- Banner links to Alerts.
- Banner must not block destructive confirmation dialogs.
- Banner must not duplicate the full alerts page.

---

## 12. Permissions

All Operations Centre pages require admin role.

Server functions must:

- require Supabase auth,
- check admin role,
- use service-role only inside server functions where necessary,
- never expose raw secrets or unrestricted table access.

---

## 13. Performance Targets

| Surface | Target |
|---|---|
| Ops home | < 1s warm |
| Billing Health | < 2s |
| Platform Health | < 2s plus probes |
| Customer Health | < 2s |
| Email log | < 2s for filtered page |
| Activity Stream | < 2s |
| Member Timeline | < 2s first page |

Heavy details should be loaded on demand.

---

## 14. Anti-patterns

Do not:

- turn Operations into the Business Dashboard,
- show raw SQL-like labels to non-engineers,
- make health pages read-only if there is an obvious recovery action,
- make an operator copy a user id between pages,
- create a new operational page when a drill-down will do,
- hide important recovery tools outside navigation.

---

## 15. Acceptance Criteria

The Operations Centre is complete when:

- every alert links to an action or explanation,
- every customer health number drills to people,
- every billing issue drills to events and members,
- every email can be traced by message_id,
- every member can be found without knowing UUIDs,
- every member can be understood from the Flight Recorder,
- platform failures are visible before customers complain,
- no operator needs Supabase or Stripe for routine diagnosis.
