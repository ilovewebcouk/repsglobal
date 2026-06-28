# REPS Admin v2 — Complete Specification Pack

**Generated:** 2026-06-28  
**Contents:** Documents 00–12 concatenated for review.


---


# REPS Admin v2 — Documentation Index

**Status:** Full draft specification pack  
**Purpose:** Define the product, information architecture, design system, workflows and implementation direction for REPS Admin v2.

This documentation pack is intended to live in the repository under:

```text
/docs/admin-v2/
```

Admin v2 is not a patch pass over the current admin. It is the coherent operating system for running REPS.

---

## Document set

| # | Document | File | Status | Purpose |
|---|---|---|---|---|
| 00 | Docs Index | [`00-docs-index.md`](./00-docs-index.md) | Complete draft | Navigation and summary of the Admin v2 documentation pack. |
| 01 | Philosophy & Information Architecture | [`01-philosophy-and-information-architecture.md`](./01-philosophy-and-information-architecture.md) | Complete draft | Defines the operating model, sidebar, ownership rules, metric rules, navigation and freeze governance. |
| 02 | Business Dashboard | [`02-business-dashboard.md`](./02-business-dashboard.md) | Complete draft | Defines the CEO/founder dashboard, four canonical KPIs, period selectors, charts and drill-downs. |
| 03 | Operations Centre | [`03-operations-centre.md`](./03-operations-centre.md) | Complete draft | Defines Billing Health, Platform Health, Customer Health, Activity, Alerts, Email Ops and Flight Recorder behaviour. |
| 04 | Member Lifecycle & Member Management | [`04-member-lifecycle-and-member-management.md`](./04-member-lifecycle-and-member-management.md) | Complete draft | Defines Professionals, Member Timeline, lifecycle states, status labels and cross-links. |
| 05 | Revenue & Billing | [`05-revenue-and-billing.md`](./05-revenue-and-billing.md) | Complete draft | Defines Payments, Memberships, Forecast, Refunds, Reconciliation and Stripe/finance terminology. |
| 06 | Verification, Trust & Safety | [`06-verification-trust-and-safety.md`](./06-verification-trust-and-safety.md) | Complete draft | Defines verification queue, identity, insurance, reviews, CPD and trust decisions. |
| 07 | Support & Communications | [`07-support-and-communications.md`](./07-support-and-communications.md) | Complete draft | Defines support inbox, campaigns, transactional emails, notifications and operator workflows. |
| 08 | Content, Growth & Discovery | [`08-content-growth-and-discovery.md`](./08-content-growth-and-discovery.md) | Complete draft | Defines Directory, Gyms, public visibility, campaigns, growth surfaces and search/discovery admin. |
| 09 | System, Settings & Platform Governance | [`09-system-settings-and-platform-governance.md`](./09-system-settings-and-platform-governance.md) | Complete draft | Defines Team, Settings, roles, impersonation, feature flags, audit logs and platform controls. |
| 10 | Design System & Component Library | [`10-design-system-and-component-library.md`](./10-design-system-and-component-library.md) | Complete draft | Defines shadcn/ui usage, layout primitives, data tables, charts, drawers, timelines, states and tokens. |
| 11 | Operational Workflows | [`11-operational-workflows.md`](./11-operational-workflows.md) | Complete draft | Defines end-to-end flows: signup, purchase, failed payment, refund, verification, support, delete, migration. |
| 12 | Implementation Roadmap & Migration Plan | [`12-implementation-roadmap-and-migration-plan.md`](./12-implementation-roadmap-and-migration-plan.md) | Complete draft | Defines how Admin v2 is built alongside v1, tested, rolled out, cut over and frozen. |
| All | Complete combined spec | [`REPS-admin-v2-complete-spec.md`](./REPS-admin-v2-complete-spec.md) | Complete draft | Single-file version of the full pack for review or sharing. |

---

## Recommended read order

1. Start with `01-philosophy-and-information-architecture.md`.
2. Read `02-business-dashboard.md` and `03-operations-centre.md` to understand the two main operating surfaces.
3. Read `04`–`09` for domain pages.
4. Read `10` before implementation.
5. Read `11` to validate workflows.
6. Use `12` as the Lovable implementation and rollout guardrail.

---

## Non-negotiables repeated across the pack

- No fake data presented as live.
- No ambiguous metric labels.
- No duplicate calculations for the same metric.
- Every member row links to the Flight Recorder.
- Every KPI drills into explanation.
- shadcn/ui is the component foundation.
- Admin v1 remains available until Admin v2 is proven.
- Billing, webhook, renewal, churn and reconciliation business logic are not rewritten as part of Admin v2.



---


# REPS Admin v2
## Part I — Philosophy & Information Architecture

**Document:** 01  
**Status:** Draft specification for approval  
**Audience:** Founder, product, engineering, operations, Lovable implementation agent  
**Scope:** Admin operating model, information architecture, navigation, metric governance, page ownership, language contract and rollout philosophy  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

REPS Admin v2 is the operating system for running REPS.

The current admin has grown from separate operational needs: billing visibility, professional management, verification, support, migration, reconciliation, churn recovery, operations monitoring and health checks. Those systems are now powerful, but the admin experience still carries some legacy complexity: similar numbers appear on different pages, labels sometimes overlap, operational tools are spread across several routes, and some pages expose implementation detail rather than business meaning.

Admin v2 fixes this by defining one coherent model:

1. **The dashboard tells the founder how the business is doing.**
2. **The Operations Centre tells the operator what is happening right now.**
3. **The Member Timeline tells support what happened to an individual member.**
4. **Each page has one job and one owner.**
5. **Every metric has one canonical definition.**
6. **Every member, payment, support issue or verification case is traceable without querying the database.**

Admin v2 is not a redesign for decoration. It is a trust system. The admin must make it impossible for an operator to ask:

> “Which number is right?”

or

> “Where do I go to fix this?”

The information architecture, naming rules and metric governance in this document are the foundation for every later Admin v2 document.

---

## 1. Product Thesis

The REPS Admin exists to let a very small team operate a complex membership platform with the confidence of a much larger SaaS operations team.

It must support:

- paid memberships,
- Core, Pro and Studio tiers,
- migrated BD members,
- Stripe subscriptions,
- renewals,
- churn recovery,
- verification,
- reviews,
- support,
- campaigns,
- operations monitoring,
- reconciliation,
- and future product modules such as employers, gyms and AI.

The admin must hide unnecessary implementation complexity while preserving full auditability.

That means the admin should not present the operator with raw storage concepts unless they are in a debug or reconciliation context. It should present business concepts first:

| Business language | Implementation detail |
|---|---|
| Active Paying Member | `subscriptions`, `legacy_stripe_link`, `bd_member_seed` |
| Revenue Received | `payment_events` with succeeded cash events |
| Projected Cash Due | upcoming renewals across all rails |
| Payment Recovery | failed subscription payment + churn/recovery path |
| Member Timeline | merged operational events from many tables |

The database can be complex. The admin must not feel complex.

---

## 2. Admin v2 Goals

Admin v2 has six primary goals.

### Goal 1 — Trust every number

Every number shown in the admin must be explainable in one click.

A trusted admin never relies on vibes. If a card says:

> Active Paying Members: 390

then the operator must be able to click it and see exactly which 390 people make up the count, what sources they came from, and why any excluded records were excluded.

### Goal 2 — Reduce cognitive load

An operator should not have to remember where data lives.

They should not think:

> “Is failed payment recovery in Churn, Billing, Reconciliation, or Webhook Recovery?”

The admin should guide them to the correct action.

### Goal 3 — Preserve the operating model

REPS is a membership platform, not a generic CRM.

The admin must be structured around the actual REPS business model:

- professionals,
- paid memberships,
- renewals,
- verification,
- reviews,
- support,
- discovery,
- migration,
- and operations.

### Goal 4 — Make issues visible before customers complain

Operations tooling must surface:

- webhook failures,
- cron failures,
- email delivery issues,
- failed payments,
- churn risk,
- platform degradation,
- and data integrity anomalies.

The platform should tell REPS when something is wrong.

### Goal 5 — Keep admin actions safe

Every destructive or high-impact action requires confirmation, context and auditability.

Examples:

- delete professional,
- suspend professional,
- seed all migration records,
- replay webhooks,
- remove suppression,
- cancel subscription,
- revoke verification.

### Goal 6 — Build once, evolve deliberately

Admin v2 is a foundation, not a temporary patch.

Navigation, metric names and page responsibilities should remain stable for years. Future modules should slot into the model rather than forcing a restructure.

---

## 3. Non-Goals

Admin v2 is not trying to do everything.

### Non-goal 1 — It is not the member product

The admin exists to operate REPS. It is not where member-facing value is created.

After Admin v2 is stable, engineering effort should shift back to member-facing product work.

### Non-goal 2 — It is not a generic BI tool

Admin v2 should answer operational questions. It should not become a fully custom analytics suite.

Deep analytics can exist later, but the admin should prioritise clarity and action over endless metrics.

### Non-goal 3 — It is not a replacement for accounting

Revenue Received and Projected Cash Due are operational finance metrics. They help run REPS day to day.

They are not statutory accounts.

### Non-goal 4 — It is not a database browser

Raw records belong in drill-downs, reconciliation pages and debug tools.

The default experience must be business-first.

### Non-goal 5 — It is not a place for fake data

No placeholder operational screen may look live.

If a feature is not connected, it must be hidden, disabled or clearly labelled.

---

## 4. Operating Principles

### Principle 1 — Business concepts first

Pages must use business language before technical language.

Good:

> Payment Recovery

Bad:

> Subscriptions in status `past_due`, `unpaid`, `incomplete`

Technical labels are acceptable inside developer-facing drill-downs, reconciliation tables and forensic views.

### Principle 2 — One concept, one name

A business concept may not have multiple public names.

Canonical names include:

- Active Paying Members
- Active Professionals
- Paid Professionals
- Core Members
- Pro Members
- Studio Members
- Revenue Received
- Projected Cash Due
- Net Member Growth
- Failed Payments
- Payment Recovery
- Pending Cancellations

Once a name is chosen, every page must use it consistently.

### Principle 3 — One metric, one calculation

If two pages display the same metric, they must call the same source function.

There must not be a “cheap proxy” for a canonical metric unless the UI explicitly labels it as an estimate. Admin v2 should avoid estimates for core business metrics.

### Principle 4 — Drill down rather than duplicate

A summary card should not be duplicated across many pages with slightly different calculations.

Instead:

1. show the metric once in its canonical context,
2. provide drill-downs,
3. provide cross-links,
4. provide reconciliation where required.

### Principle 5 — Exceptions are visible, not hidden

Operational exceptions should be surfaced, not silently filtered away.

Examples:

- ghost subscriptions,
- webhook DLQ,
- stuck email logs,
- failed payments,
- incomplete renewals,
- orphaned records.

The admin should explain exceptions rather than masking them to make totals look cleaner.

### Principle 6 — Every member path leads to the Timeline

The Member Timeline is the canonical forensic view.

Any page that displays a person should provide:

> Open Timeline

This includes Professionals, Support, Payments, Billing Health, Churn, Reviews, Verification and Activity.

### Principle 7 — Actions live where the problem is seen

If a page shows a problem, it should offer the next action.

Example:

A Failed Payments drill-down should allow:

- open member timeline,
- send recovery email,
- open Stripe,
- view recovery state.

It should not force the operator to navigate elsewhere unless the action truly belongs elsewhere.

### Principle 8 — No dead ends

Every operational path must have a next step.

No page should show a red number without a drill-down.

No table should show a member without a timeline link.

No error should appear without a recommended action.

### Principle 9 — V1 remains available until V2 proves itself

Admin v2 should be built alongside the existing admin, not by immediately replacing it.

The current admin remains in the background as a fallback until v2 is validated.

### Principle 10 — Freeze after confidence

Once Admin v2 passes implementation QA and a live usage period, its architecture should freeze.

Future admin changes require:

- production bug,
- security issue,
- revenue-impacting issue,
- new product module,
- or demonstrated operator pain.

---

## 5. Operator Personas

Admin v2 serves four primary operator modes.

These are modes, not necessarily four different employees.

A founder may move through all four in the same day.

---

### 5.1 Founder Mode

The founder asks:

> “How is REPS doing?”

Needs:

- Active Paying Members
- Revenue Received
- Projected Cash Due
- Net Member Growth
- churn risk
- forecast confidence
- major alerts

Primary pages:

- Dashboard
- Revenue
- Memberships
- Operations Home

Success:

The founder can understand the business in under 30 seconds.

---

### 5.2 Operations Mode

Operations asks:

> “What needs attention right now?”

Needs:

- failed payments,
- open alerts,
- cron status,
- email health,
- webhook DLQ,
- support queue,
- verification queue,
- migration status.

Primary pages:

- Operations Home
- Billing Health
- Platform Health
- Customer Health
- Activity
- Alerts
- Webhook Recovery

Success:

Operations can detect, triage and resolve issues without touching the database.

---

### 5.3 Support Mode

Support asks:

> “What happened to this member?”

Needs:

- member search,
- timeline,
- payment history,
- email history,
- support tickets,
- verification status,
- recovery state,
- Stripe links,
- admin actions.

Primary pages:

- Member Timeline
- Support
- Professionals
- Billing Health
- Churn

Success:

Support can answer a customer within minutes without asking engineering.

---

### 5.4 Trust & Safety Mode

Trust & Safety asks:

> “Can this professional be trusted on REPS?”

Needs:

- verification queue,
- qualification review,
- identity checks,
- insurance status,
- review moderation,
- suspension tools,
- audit log.

Primary pages:

- Verification
- Reviews
- Professionals
- Member Timeline

Success:

Trust decisions are fast, consistent and auditable.

---

## 6. Core Mental Model

Admin v2 is organised around four layers.

```text
Business
  How is REPS performing?

Operations
  What is happening right now?

Entities
  Who or what are we managing?

Forensics
  What happened and why?
```

### 6.1 Business layer

The business layer is the Dashboard.

It contains the minimum viable executive view:

- Active Paying Members
- Revenue Received
- Projected Cash Due
- Net Member Growth

### 6.2 Operations layer

The operations layer is `/admin/ops`.

It contains live system and customer health:

- Billing Health
- Platform Health
- Customer Health
- Email Ops
- Activity
- Alerts
- Webhook Recovery

### 6.3 Entity layer

The entity layer manages durable business objects:

- professionals,
- memberships,
- payments,
- support tickets,
- reviews,
- campaigns,
- gyms,
- migration records.

### 6.4 Forensics layer

The forensics layer explains what happened.

It contains:

- Member Timeline,
- Reconciliation,
- Webhook Recovery,
- Activity Stream,
- Audit Log.

The forensics layer is never the first stop unless something has gone wrong.

---

## 7. Information Architecture

Admin v2 uses a stable sidebar.

The sidebar is organised by operator intent, not database tables.

```text
Overview
  Dashboard

Members & Pros
  Professionals
  Verification
  Memberships
  Churn
  Reviews

Revenue
  Payments
  Reconciliation

Content & Growth
  Directory
  Gyms
  Campaigns
  CPD

Operations
  Ops Hub
  Billing Health
  Platform Health
  Customer Health
  Email Operations
  Activity Stream
  Alerts
  Webhook Recovery
  Support
  Migration

System
  Team
  Settings
```

### 7.1 Overview

Purpose:

The business health landing page.

Contains:

- Dashboard.

Does not contain:

- operational deep tables,
- support inbox,
- raw Stripe events,
- settings,
- verification queues.

### 7.2 Members & Pros

Purpose:

Manage the people and professional records that make up REPS.

Contains:

- Professionals,
- Verification,
- Memberships,
- Churn,
- Reviews.

### 7.3 Revenue

Purpose:

Understand cash, Stripe, payments and financial reconciliation.

Contains:

- Payments,
- Reconciliation.

Revenue is not the same as Operations Billing Health.

Revenue pages answer:

> “What money exists?”

Operations Billing answers:

> “Is money moving correctly right now?”

### 7.4 Content & Growth

Purpose:

Manage public visibility, growth and non-billing content surfaces.

Contains:

- Directory,
- Gyms,
- Campaigns,
- CPD.

CPD remains labelled as preview or hidden until real data is connected.

### 7.5 Operations

Purpose:

Run the platform day to day.

Contains:

- Ops Hub,
- Billing Health,
- Platform Health,
- Customer Health,
- Email Operations,
- Activity Stream,
- Alerts,
- Webhook Recovery,
- Support,
- Migration.

### 7.6 System

Purpose:

Configure and govern the admin.

Contains:

- Team,
- Settings.

Settings must not imply editability where none exists.

---

## 8. Page Ownership Model

Every page owns a business domain.

| Page | Owns | Does not own |
|---|---|---|
| Dashboard | Executive KPIs | Raw operations |
| Professionals | Directory/professional records | Billing truth |
| Verification | Trust decisions | General profile editing |
| Memberships | Membership mix, renewals, membership health | Raw Stripe event processing |
| Churn | Retention lifecycle | Payment event debugging |
| Reviews | Review moderation | Verification |
| Payments | Stripe payments, refunds, invoices, MRR/ARR | Churn workflow |
| Reconciliation | Metric audit trails | Day-to-day dashboard |
| Directory | Public listing health | Verification decisions |
| Gyms | Gym submissions | Professional verification |
| Campaigns | Broadcast messaging | Transactional email logs |
| CPD | CPD oversight once real | Placeholder KPIs |
| Ops Hub | Operational entry point | Business dashboard |
| Billing Health | Live billing operations | Finance strategy |
| Platform Health | Infrastructure health | Revenue metrics |
| Customer Health | Live member operational status | Marketing analytics |
| Email Ops | Email delivery lifecycle | Campaign authoring |
| Activity | Platform heartbeat | Member-specific forensics |
| Alerts | Current operational exceptions | Long-form analytics |
| Webhook Recovery | Failed webhook diagnosis/replay | Normal payment browsing |
| Support | Customer conversations | Billing source of truth |
| Migration | Legacy migration only | Long-term membership management |
| Team | Admin users | Member roles broadly |
| Settings | Configuration | Operational dashboards |

If a page starts owning more than one domain, it should be split or re-scoped.

---

## 9. Dashboard Contract

The Dashboard is the founder screen.

It must remain simple.

### 9.1 Dashboard KPIs

The Dashboard has exactly four headline KPIs:

1. Active Paying Members
2. Revenue Received
3. Projected Cash Due
4. Net Member Growth

No fifth KPI should be added without removing another.

### 9.2 Dashboard time controls

Historical period selector drives:

- Revenue Received,
- Net Member Growth,
- joined,
- churned,
- historical charts.

Forecast horizon selector drives:

- Projected Cash Due,
- forecast chart.

Historical metrics and forecast metrics must not share one ambiguous date selector.

### 9.3 Dashboard alerting

The Dashboard may show alert banners.

Alert banners are allowed because they tell the founder something needs attention.

The Dashboard should not become the place where the alert is solved. Alerts link into Operations.

### 9.4 Dashboard drill-downs

Every KPI must drill down.

Required drill-downs:

| KPI | Drill-down |
|---|---|
| Active Paying Members | member list / reconciliation |
| Revenue Received | revenue reconciliation |
| Projected Cash Due | forecast reconciliation |
| Net Member Growth | growth reconciliation |

---

## 10. Operations Centre Contract

The Operations Centre exists to answer:

> “What is happening right now?”

It is separate from the Dashboard.

### 10.1 Operations Home

The Ops Hub gives a one-screen operational summary:

- system status,
- open alerts,
- member finder,
- quick links to Billing, Platform, Customer, Email, Activity and Alerts.

### 10.2 Billing Health

Billing Health owns live billing operations:

- payments today,
- revenue today,
- refunds today,
- failed payments,
- payment recovery,
- webhook failures,
- DLQ,
- replay queue,
- webhook latency.

It does not own strategic revenue reporting.

### 10.3 Platform Health

Platform Health owns infrastructure status:

- cron jobs,
- queues,
- email queue,
- storage,
- database health,
- Stripe connectivity,
- mail provider connectivity.

### 10.4 Customer Health

Customer Health owns current operational membership state:

- Active Paying Members,
- new Core/Pro/Studio members,
- churn,
- recoveries,
- pending cancellations,
- failed payments,
- awaiting payment update.

Every tile drills into relevant members.

### 10.5 Email Operations

Email Operations owns the delivery lifecycle:

- sent,
- pending,
- failed,
- bounced,
- complained,
- suppressed,
- DLQ,
- message timeline.

It does not own campaign authoring.

### 10.6 Activity Stream

Activity answers:

> “What is happening across REPS right now?”

It is platform-wide.

Member Timeline answers:

> “What happened to this member?”

They are related but not interchangeable.

### 10.7 Alerts

Alerts are current operational exceptions.

They must be:

- human-readable,
- actionable,
- linked to the relevant page,
- acknowledgeable,
- and muted when appropriate.

Raw enum labels are not acceptable in the main alert UI.

### 10.8 Webhook Recovery

Webhook Recovery is a specialist tool.

It must remain discoverable because it is critical during incidents.

It should not be hidden behind institutional knowledge.

---

## 11. Member Timeline Contract

The Member Timeline, also called the Flight Recorder, is the canonical forensic surface for a person.

### 11.1 Purpose

It answers:

> “What happened to this member?”

### 11.2 Sources

The Timeline should merge:

- authentication,
- profile changes,
- professional changes,
- verification,
- reviews,
- support,
- Stripe events,
- payment events,
- subscription changes,
- churn lifecycle,
- renewal tokens,
- email delivery,
- admin actions,
- publishing events.

### 11.3 Normalised event model

Every event should resolve into:

```ts
{
  ts: string
  source: string
  type: string
  status: "success" | "warning" | "error" | "info"
  summary: string
  entityKind?: string
  entityId?: string
  href?: string
  externalUrl?: string
}
```

### 11.4 Timeline as destination

Any page showing a member must provide:

- Open Timeline,
- Open Support where applicable,
- Open Stripe where applicable,
- Open Professional where applicable.

### 11.5 Timeline is not a dumping ground

The Timeline should be comprehensive but readable.

It needs:

- source filters,
- date range,
- search,
- grouped days,
- status styling,
- external links.

---

## 12. Metric Governance

Admin v2 adopts a formal metric registry.

No new KPI may be introduced without being added to the registry.

### 12.1 Required fields

Every metric must define:

- display name,
- business definition,
- source function,
- source tables,
- time window,
- filters,
- owner page,
- other surfaces,
- drill-down,
- reconciliation path where required.

### 12.2 Duplicate classification

When a metric appears on multiple pages, it must be classified as one of:

| Classification | Meaning | Requirement |
|---|---|---|
| Same metric | Same business concept | Same name, same calculation |
| Derived metric | Related but transformed | Explain relationship in subtitle |
| Different metric | Different concept | Different name |

### 12.3 Prohibited patterns

Admin v2 prohibits:

- identical labels with different calculations,
- similar labels without subtitles,
- cheap proxies for canonical metrics,
- hidden estimates,
- business KPIs calculated in UI components.

### 12.4 Canonical membership metrics

| Metric | Canonical meaning |
|---|---|
| Active Paying Members | People currently entitled to paid REPS access |
| Active Professionals | Confirmed professional records, including Free |
| Paid Professionals | Professionals who are also Active Paying Members |
| Core Members | Active Paying Members on Core |
| Pro Members | Active Paying Members on Pro |
| Studio Members | Active Paying Members on Studio |
| Scheduled Starts | People scheduled to become active, not yet active |

There should be no generic “Total Members” metric unless the UI explicitly defines what is being totalled.

### 12.5 Canonical revenue metrics

| Metric | Canonical meaning |
|---|---|
| Revenue Received | Cash successfully received in selected period |
| Projected Cash Due | Expected renewal cash over forecast horizon |
| MRR | Normalised monthly recurring subscription run-rate |
| ARR | MRR × 12 |
| Payments Today | Count of successful payments today |
| Revenue Today | Cash received today |
| Refunds Today | Refund events today |

### 12.6 Canonical failure metrics

| Metric | Canonical meaning |
|---|---|
| Failed Payments | Subscriptions in `past_due`, `unpaid` or `incomplete` |
| Payment Recovery | Members in recovery workflow |
| Pending Cancellations | Members scheduled to cancel at period end |
| Churn | Members lost in defined period or lifecycle stage depending context |

Where churn is lifecycle-based, the UI must say so.

---

## 13. Naming Rules

### Rule 1 — Never use “member” vaguely

“Member” alone is ambiguous.

Prefer:

- Active Paying Member,
- Core Member,
- Pro Member,
- Studio Member,
- Professional,
- Active Professional.

### Rule 2 — Core is the public tier name

The database may still store the tier as `verified`.

The UI must say **Core** when referring to the membership tier.

“Verified” should only refer to professional verification status.

### Rule 3 — Cash means money received

Use “Revenue Received” or “Cash Received” for actual money taken.

Do not call forecast, ARR or MRR “revenue” without a qualifier.

### Rule 4 — Forecast means future

Forecast metrics must include the horizon:

- next 30 days,
- remaining this month,
- next month,
- current quarter,
- custom.

### Rule 5 — Failed payment labels must be consistent

Use **Failed Payments** for payment-status issues.

Use **Payment Recovery** for the workflow.

Use **At Risk** only inside Churn where it represents a lifecycle stage.

---

## 14. Navigation Rules

### 14.1 Sidebar

The sidebar is the primary navigation.

It must be stable.

No page should exist without a sidebar entry unless it is a detail page opened from another page.

Examples of pages that do not need main sidebar entries:

- Member Timeline detail,
- specific support ticket sheet,
- specific reconciliation anchor,
- specific drill-down detail.

### 14.2 Breadcrumbs

Every detail or sub-page must show location.

Examples:

```text
Admin > Operations > Billing
Admin > Operations > Member Timeline > Jane Smith
Admin > Revenue > Reconciliation
```

### 14.3 Cross-links

Pages must link laterally.

Examples:

- Support ticket → Member Timeline
- Member Timeline → Support ticket
- Professional row → Member Timeline
- Failed Payment → Recovery action + Stripe
- Review → Professional + Timeline
- Verification case → Professional + Timeline

### 14.4 No orphan tools

Critical tools such as Webhook Recovery and Reconciliation must be discoverable from navigation and from relevant alert/drill-down states.

---

## 15. State and Action Model

Every operational row should answer:

1. What is this?
2. What state is it in?
3. Why is it in this state?
4. What can I do next?

### 15.1 State display

States should be rendered using consistent badge categories:

| Category | Meaning |
|---|---|
| Success | healthy, complete, active |
| Warning | needs attention, recoverable |
| Critical | failing, blocked, customer-impacting |
| Neutral | informational |
| Muted | resolved, inactive, historical |

### 15.2 Action hierarchy

Actions should be grouped:

1. Primary action
2. Secondary actions
3. Forensics
4. Destructive actions

Example professional row:

- View profile
- Open Timeline
- Impersonate
- Suspend
- Delete

Delete must be separated and confirmed.

### 15.3 Destructive action standard

Every destructive action requires:

- explicit confirmation,
- entity name,
- consequence summary,
- audit log entry,
- undo where possible.

---

## 16. V1/V2 Rollout Strategy

Admin v2 should not replace v1 immediately.

### 16.1 Build alongside v1

Recommended approach:

- keep current admin as v1,
- implement v2 under a feature flag or separate route,
- reuse the same server functions and canonical metrics,
- avoid duplicating business logic.

Potential routes:

```text
/admin-v2
```

or

```text
/admin?admin_version=v2
```

The exact route is an implementation decision, but v1 must remain accessible during validation.

### 16.2 Parallel validation

For a period, v1 and v2 should be compared:

- KPI equality,
- drill-down equality,
- operations visibility,
- no missing tools,
- no lost actions.

### 16.3 Cutover

Cutover happens only when:

- v2 passes QA,
- metric registry checks pass,
- workflows pass,
- operator signs off,
- v1 fallback remains available for a short period.

### 16.4 Decommission v1

V1 should not be deleted immediately after cutover.

It should be retained as a fallback for at least one release cycle.

---

## 17. Design System Direction

Admin v2 uses shadcn/ui as the component foundation.

### 17.1 Why shadcn/ui

The admin needs:

- composable primitives,
- accessibility,
- consistent styling,
- good chart integration,
- no heavyweight abstraction lock-in,
- easy extension.

shadcn/ui fits this pattern because components are owned by the project rather than hidden in a package.

### 17.2 Required components

Admin v2 standardises on:

- Button
- Card
- Badge
- Tabs
- Select
- Popover
- Calendar
- Sheet
- Drawer
- AlertDialog
- Tooltip
- HoverCard
- Command
- DropdownMenu
- Table/DataTable
- ScrollArea
- Skeleton
- Separator
- Toast/Sonner

### 17.3 Charts

Charts use:

- Recharts,
- `ChartContainer`,
- `ChartTooltip`,
- `ChartTooltipContent`,
- `ChartLegend`,
- `ChartLegendContent`,
- `accessibilityLayer`.

Chart colours should use CSS variables, for example:

```tsx
color: "var(--chart-1)"
```

and chart fills should reference:

```tsx
fill="var(--color-revenue)"
```

Charts must have explicit height so responsive containers can measure correctly.

### 17.4 No bespoke styling by default

New UI patterns should first ask:

> Can this be composed from the existing design system?

Only create bespoke UI when the design system cannot express the workflow.

---

## 18. Layout System

Admin v2 uses a small set of page layouts.

### 18.1 Dashboard layout

Used for:

- Dashboard,
- high-level summaries.

Pattern:

- page header,
- filters/actions row,
- four KPI cards,
- chart grid,
- supporting sections.

### 18.2 Workspace layout

Used for:

- Verification,
- Support,
- complex review queues.

Pattern:

```text
Queue/list panel | Detail/workspace panel
```

### 18.3 Operations layout

Used for:

- Billing Health,
- Platform Health,
- Customer Health,
- Email Ops,
- Alerts.

Pattern:

- status strip,
- tile grid,
- drill-down table,
- side sheet detail.

### 18.4 Timeline layout

Used for:

- Member Timeline,
- Activity Stream.

Pattern:

- header with entity/search,
- filters,
- grouped chronological list,
- right-side detail or links.

### 18.5 Data-table layout

Used for:

- Professionals,
- Payments,
- Reviews,
- Campaigns,
- Churn.

Pattern:

- KPI strip,
- search/filter/sort row,
- table,
- row actions,
- pagination.

---

## 19. Data Trust Rules

### 19.1 Server functions own data

UI components should not implement business calculations.

Every non-trivial metric should come from a server function or shared domain helper.

### 19.2 Local state is presentation only

React state may store:

- selected tab,
- filter controls,
- pagination,
- open drawer state.

React state must not create derived business truth.

### 19.3 URL state for shareable views

Important filters should be reflected in the URL:

- period,
- forecast horizon,
- tab,
- drill-down kind,
- search,
- selected member where appropriate.

### 19.4 Reconciliation must remain one click away

For core business metrics:

- Active Paying Members,
- Revenue Received,
- Projected Cash Due,
- Net Member Growth,

there must be a reconciliation route.

### 19.5 Exceptions need reasons

Whenever a record is excluded from a count in reconciliation, it needs an exclusion reason.

Examples:

- auth user missing,
- environment not live,
- status canceled,
- tier free,
- outside period,
- duplicate merged,
- payment refunded.

---

## 20. Empty, Loading and Error States

### 20.1 Empty states

Empty states must say what the absence means.

Bad:

> No data.

Good:

> No failed payments. All active subscriptions are currently healthy.

### 20.2 Loading states

Use skeletons for stable page structure.

Avoid layout jumps.

### 20.3 Error states

Error states must include:

- what failed,
- likely impact,
- retry action,
- link to relevant operations page if needed.

### 20.4 Degraded states

Some operations pages may show degraded snapshots if a query times out.

The UI must explicitly state that data is partial.

---

## 21. Security and Permissions

Admin v2 is admin-only.

All admin routes require:

- authenticated session,
- admin role.

All server functions require:

- `requireSupabaseAuth`,
- admin role check,
- no reliance on client-side hiding.

### 21.1 Dangerous actions

Dangerous actions require:

- explicit permission,
- confirmation dialog,
- audit log,
- visible success/failure state.

### 21.2 Impersonation

When impersonation is active:

- a global banner must be visible,
- destructive actions should be blocked or explicitly labelled,
- audit logs must capture actor and target.

### 21.3 Public indexing

Admin pages must not be indexed.

All admin routes and detail routes should include:

```html
<meta name="robots" content="noindex,nofollow" />
```

---

## 22. Accessibility Standards

Admin v2 must be keyboard-operable.

Required:

- focus states,
- keyboard navigation for dialogs,
- accessible chart layers,
- readable contrast,
- labelled controls,
- no colour-only status communication,
- table headers and aria labels.

Workspaces such as Support and Verification should use keyboard shortcuts where high-frequency review work happens.

Shortcuts must be discoverable in the UI.

---

## 23. Performance Standards

Target performance:

| Surface | Target |
|---|---|
| Dashboard | under 1s perceived load after cache |
| Operations pages | under 2s |
| Member Timeline | under 2s for recent history |
| Member search | under 500ms |
| Table filter change | under 500ms where server-backed |

### 23.1 Pagination

Long lists must paginate.

Timeline and activity feeds should use cursor pagination where possible.

### 23.2 Polling

Polling should be purposeful:

- Activity: 30s
- Health: 60s
- Alerts: 60s or event-triggered where possible

Avoid excessive external API pings.

### 23.3 Parallel queries

Timeline aggregation may run parallel source queries.

Each source query should remain simple and indexable.

---

## 24. Future Extensibility

Admin v2 must support future modules without restructuring.

Likely future modules:

- Employers,
- Gyms Pro,
- AI tools,
- advanced CPD,
- corporate memberships,
- marketplace revenue,
- partner portals,
- franchising.

New modules should be placed according to intent:

| Module type | Section |
|---|---|
| People/member management | Members & Pros |
| Money | Revenue |
| Public content/discovery | Content & Growth |
| Operational health | Operations |
| Configuration | System |

No module gets a top-level section unless it changes the operating model.

---

## 25. Admin v2 Route Model

Final exact route names can be adjusted during implementation, but the conceptual model should remain stable.

```text
/admin-v2
/admin-v2/professionals
/admin-v2/verification
/admin-v2/memberships
/admin-v2/churn
/admin-v2/reviews
/admin-v2/payments
/admin-v2/reconciliation
/admin-v2/directory
/admin-v2/gyms
/admin-v2/campaigns
/admin-v2/cpd
/admin-v2/ops
/admin-v2/ops/billing
/admin-v2/ops/platform
/admin-v2/ops/customer
/admin-v2/ops/email
/admin-v2/ops/activity
/admin-v2/ops/alerts
/admin-v2/ops/webhook-recovery
/admin-v2/ops/member/:userId
/admin-v2/support
/admin-v2/migration
/admin-v2/team
/admin-v2/settings
```

If implemented inside existing `/admin`, the v2 architecture still applies.

---

## 26. V1 Compatibility

V1 remains available in the background.

### 26.1 Why keep v1

Keeping v1 reduces rollout risk.

If v2 misses a workflow, operators can fall back.

### 26.2 What v1 should not do

V1 should not receive new structural features once v2 implementation begins.

Only critical fixes should be backported.

### 26.3 Cutover criteria

Cut over when:

- all v2 routes exist,
- metric parity is proven,
- workflows are QA-tested,
- operator approves,
- no P0/P1 admin usability gaps remain.

---

## 27. Governance

Admin v2 needs governance to avoid drifting back into inconsistency.

### 27.1 Metric review

Any new metric requires:

- registry entry,
- owner page,
- source function,
- drill-down.

### 27.2 Navigation review

Any new sidebar item requires:

- purpose,
- owner,
- why it cannot be a tab or drill-down,
- where it belongs.

### 27.3 Action review

Any new action requires:

- permission model,
- audit logging,
- error handling,
- confirmation if destructive.

### 27.4 Design review

Any new component pattern must first attempt to use existing shadcn primitives.

---

## 28. Decision Log

| Decision | Rationale |
|---|---|
| Dashboard has exactly four KPIs | Prevents dashboard sprawl and preserves founder clarity |
| Operations is separate from Dashboard | Business health and operational health are different modes |
| Member Timeline is canonical forensic view | Gives support one place to answer member questions |
| Metric registry is mandatory | Prevents same-label/different-number drift |
| Core is tier label, Verified is verification status | Removes ambiguity between plan and trust state |
| V1 remains available during rollout | Reduces risk and allows comparison |
| shadcn/ui is the component foundation | Consistency, accessibility, composability and project ownership |
| Reconciliation remains part of Revenue | Keeps finance/business numbers auditable |
| Webhook Recovery is visible in Operations | Critical incident tooling must be discoverable |

---

## 29. Open Questions

These should be resolved in later documents or implementation planning.

1. Should Admin v2 live at `/admin-v2` during rollout or behind a feature flag inside `/admin`?
2. How long should v1 remain accessible after cutover?
3. Should Memberships and Payments remain separate in v2 or be differentiated more strongly by purpose?
4. Should CPD appear at all before a real CPD product exists?
5. Should external alerts be email-only initially or also Slack?
6. What is the final retention policy copy for admin audit logs and email logs?
7. Which admin workflows require keyboard shortcuts beyond Support and Verification?

---

## 30. Acceptance Criteria for Part I

This document is approved when the team agrees that:

- the sidebar model is correct,
- the page ownership model is correct,
- the metric governance rules are correct,
- the naming contract is correct,
- the Member Timeline is the canonical forensic destination,
- Dashboard and Operations are separate concerns,
- v1 remains available during v2 rollout,
- shadcn/ui is the standard component foundation,
- and Admin v2 should be built against this operating model.

Once approved, Part II can define the Business Dashboard in detail.

---

# Appendix A — Canonical Vocabulary

| Term | Use |
|---|---|
| Active Paying Members | Current paid entitlement count |
| Active Professionals | Confirmed professional records including Free |
| Paid Professionals | Professionals who are also active paying members |
| Core | Membership tier formerly displayed as Verified |
| Verified | Trust/verification state only |
| Revenue Received | Cash collected |
| Projected Cash Due | Expected renewal cash |
| Net Member Growth | Joined minus churned |
| Failed Payments | Billing status problem |
| Payment Recovery | Recovery workflow |
| Churn | Retention lifecycle outcome/stage |
| Reconciliation | Audit trail for metrics |
| Flight Recorder | Member Timeline |

---

# Appendix B — Page Responsibility Summary

```text
Dashboard      = business truth
Operations     = live health
Timeline       = member forensics
Professionals  = directory/pro records
Memberships    = membership lifecycle
Payments       = Stripe/finance events
Reconciliation = KPI audit
Verification   = trust decisions
Reviews        = moderation
Churn          = retention
Support        = conversations
Migration      = legacy transition
Settings       = configuration
```

---

# Appendix C — Implementation Reminder

Admin v2 should not copy/paste current pages blindly.

It should reuse:

- canonical server functions,
- metric registry,
- existing operations tooling,
- shadcn primitives,
- timeline aggregator,
- reconciliation logic,
- role guards,
- existing charts where correct.

It should avoid:

- duplicate calculations,
- placeholder data,
- dead buttons,
- hidden critical tools,
- ambiguous metric labels,
- architecture changes without evidence.



---


# REPS Admin v2
## Part II — Business Dashboard

**Document:** 02  
**Status:** Draft specification for approval  
**Audience:** Founder, product, engineering, operations, Lovable implementation agent  
**Scope:** `/admin` business dashboard, KPI hierarchy, period controls, charts, drill-downs, empty states, metric ownership  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

The Business Dashboard is the founder screen.

It is not a monitoring console, not a finance ledger, not a support inbox, and not an operational recovery tool. It exists to answer four questions in under thirty seconds:

1. **How many paying members do we have?**
2. **How much cash have we received?**
3. **How much cash is due?**
4. **Are we growing or shrinking?**

Everything else is subordinate.

Admin v2 keeps the dashboard deliberately restrained. It has four headline cards, four explanatory charts, a concise health strip, and direct drill-downs into the relevant owner pages. The dashboard should give the founder confidence without forcing them to interpret raw Stripe events, database status values, or support queue details.

The dashboard is where the business is read. Operations is where the platform is run. Reconciliation is where numbers are audited.

---

## 1. Page Purpose

### Route

```text
/admin
```

### Role

Primary business landing page.

### Primary user

Founder / Head of Operations.

### Secondary users

Finance, operations, support lead.

### The page answers

- Is the REPS membership base growing?
- Is cash coming in?
- Is forecasted cash healthy?
- Are any urgent operational problems affecting the business?

### The page does not answer

- Which cron job failed?
- Which webhook event is dead-lettered?
- Which email template bounced?
- Which professional needs manual support?
- Which raw database row produced a number?

Those questions belong to Operations, Member Timeline, Email Ops and Reconciliation.

---

## 2. Dashboard Contract

The dashboard has exactly four canonical KPI cards:

| Position | KPI | Canonical metric | Owner |
|---|---|---|---|
| 1 | Active Paying Members | M1 | Dashboard |
| 2 | Revenue Received | R1 | Dashboard |
| 3 | Projected Cash Due | R2 | Dashboard |
| 4 | Net Member Growth | M14 | Dashboard |

No fifth KPI is allowed without changing the Admin v2 metric registry.

The dashboard may show supporting numbers inside a card, but they must be subordinate. For example, Net Member Growth may show Joined and Churned. That does not make Joined and Churned headline KPIs.

---

## 3. The Four KPI Cards

### 3.1 Active Paying Members

**Display label:** Active Paying Members

**Definition:** Distinct people with a currently valid paid entitlement on REPS, deduped across all billing rails.

Includes:

- Core members
- Pro members
- Studio members
- legacy migration members with valid access
- BD migrated members with valid access

Excludes:

- Free professionals
- cancelled members
- expired members
- admins without a paid membership
- ghost records that are explicitly resolved as invalid billing records

**Subtext:**

```text
Core, Pro, Studio · includes legacy + BD cohort
```

**Secondary line:**

```text
+N net this period · Joined X · Churned Y
```

Only show the secondary line when the selected period is not Today or when the delta is non-zero.

**Primary drill-down:**

```text
/admin/reconciliation#members
```

**Operational drill-down:**

```text
/admin/ops/customer
```

**Card behaviour:**

- Click card body: open member reconciliation.
- Click secondary line: open growth reconciliation.
- Click tier mix chip: open Memberships.

---

### 3.2 Revenue Received

**Display label:** Revenue Received

**Definition:** Cash successfully received during the selected historical period.

It is not MRR. It is not ARR. It is not invoice value. It is not forecast.

**Subtext:**

```text
Cash banked · selected period
```

**Data behaviour:**

- `invoice.payment_succeeded` is preferred.
- `charge.succeeded` is fallback where no invoice exists.
- Refunds are netted according to the canonical revenue policy.
- Duplicate Stripe events are deduped by the canonical payment key.

**Primary drill-down:**

```text
/admin/reconciliation#revenue
```

**Operational drill-down:**

```text
/admin/ops/billing
```

**Card behaviour:**

- Click card body: open revenue reconciliation filtered to selected period.
- Sparkline shows daily cash received for the selected period.
- If the selected period has zero non-null data points, hide the sparkline and keep the card clean.

---

### 3.3 Projected Cash Due

**Display label:** Projected Cash Due

**Definition:** Expected renewals due during the selected forecast horizon.

This uses a separate forecast horizon, not the historical dashboard period.

**Subtext:**

```text
Expected renewals · forecast horizon
```

**Forecast horizon selector:**

- Remaining this month
- Next month
- Next 30 days
- Current quarter
- Current year
- Custom

**Data behaviour:**

Sources are the canonical renewal rails:

- active subscriptions with upcoming current period end,
- legacy renewal anchors,
- BD seed renewal anchors,
- scheduled starts where applicable.

Do not include subscriptions with `cancel_at_period_end = true` as future cash.

**Primary drill-down:**

```text
/admin/reconciliation#forecast
```

**Operational drill-down:**

```text
/admin/memberships
```

**Card behaviour:**

- Click card body: open forecast reconciliation.
- Forecast sparkline always uses the forecast horizon, not the dashboard historical period.
- Subtitle must include visible date range, for example:

```text
Due 1 Jul–31 Jul
```

Dates beat vague labels.

---

### 3.4 Net Member Growth

**Display label:** Net Member Growth

**Definition:** Joined minus churned during the selected historical period.

**Formula:**

```text
Net Member Growth = Joined in period − Churned in period
```

**Subtext:**

```text
Joined X · Churned Y
```

**Important distinction:**

BD migration import is not growth. Migration does not create new members; it imports existing ones.

**Primary drill-down:**

```text
/admin/reconciliation#growth
```

**Card behaviour:**

- Positive values use growth language.
- Negative values use loss language.
- Zero values use neutral language.
- Do not hide the card when zero.

---

## 4. Period Controls

The dashboard has two independent controls.

### 4.1 Historical Period Selector

Drives:

- Revenue Received
- Net Member Growth
- Joined
- Churned
- historical charts

Options:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Month to date
- Previous month
- Quarter to date
- Year to date
- Custom

All bounds are Europe/London anchored.

The selected period must be stored in URL search params.

### 4.2 Forecast Horizon Selector

Drives only Projected Cash Due and forecast chart.

Options:

- Remaining this month
- Next month
- Next 30 days
- Current quarter
- Current year
- Custom

This is stored separately in URL search params.

### 4.3 Why the selectors are separate

Historical metrics answer:

> What happened?

Forecast metrics answer:

> What is due?

One selector cannot represent both without confusing the operator.

---

## 5. Dashboard Layout

### Desktop layout

```text
Header
  Title: Dashboard
  Subtitle: Business performance and membership health
  Actions: Historical period selector · Forecast horizon selector · Reconciliation

Health strip
  Platform health summary · Failed payment banner if active · Alert count if active

KPI row
  Active Paying Members · Revenue Received · Projected Cash Due · Net Member Growth

Charts row
  Member Growth · Revenue Received

Charts row
  Projected Cash Due · Member Mix

Business activity row
  Recent member activity · Top operational links
```

### Mobile layout

- Header controls collapse into a sheet.
- KPI cards stack vertically.
- Charts become full-width.
- Table-heavy sections collapse into summary cards with drill-down links.

---

## 6. Charts

All charts use shadcn chart components and Recharts.

Required primitives:

- `ChartContainer`
- `ChartTooltip`
- `ChartTooltipContent`
- Recharts `AreaChart`, `BarChart`, `LineChart` as needed
- `accessibilityLayer`

### Chart 1 — Member Growth

Shows:

- cumulative Active Paying Members
- joined count overlay
- churned count overlay if non-zero

Purpose:

> Are we growing steadily?

### Chart 2 — Revenue Received

Shows daily cash received for selected period.

Purpose:

> When did cash arrive?

### Chart 3 — Projected Cash Due

Shows expected renewals by day across forecast horizon.

Purpose:

> When will cash land?

### Chart 4 — Member Mix

Shows Core, Pro, Studio distribution.

Purpose:

> What is the current paid membership composition?

### Chart design rules

- Charts must have fixed vertical height.
- Charts must use chart tokens.
- Tooltips must use human labels.
- Axes must be readable but not visually heavy.
- Empty data must render a useful empty state, not a blank chart.

---

## 7. Drill-downs

Every card and chart must be clickable.

| Surface | Destination |
|---|---|
| Active Paying Members card | Reconciliation members tab |
| Revenue card | Revenue reconciliation |
| Projected Cash Due card | Forecast reconciliation |
| Net Growth card | Growth reconciliation |
| Member Growth chart | Growth reconciliation |
| Revenue chart | Revenue reconciliation |
| Forecast chart | Forecast reconciliation |
| Member Mix chart | Memberships |
| Failed payment banner | Payment recovery list |
| Platform health strip | `/admin/ops/platform` |

No number appears without a path to explanation.

---

## 8. Health Strip

The dashboard includes a compact health strip above the KPI row.

It is not the Operations Centre. It is a signal.

States:

- Healthy
- Attention needed
- Critical

Inputs:

- platform health snapshot
- failed payment count
- webhook DLQ count
- email queue health
- cron status
- unresolved alerts

Rules:

- Healthy strip should take minimal space.
- Warnings should link to the owning operations page.
- Critical issues should use a banner.
- The dashboard should never bury a revenue-impacting issue below the fold.

---

## 9. Metric Language

The dashboard uses only canonical language.

Allowed:

- Active Paying Members
- Revenue Received
- Projected Cash Due
- Net Member Growth

Not allowed:

- Total Members
- Paid Users
- Subscribers
- Active Subs
- Monthly Revenue when meaning cash received
- Forecast Revenue when meaning renewals due

If a label is ambiguous, it is wrong.

---

## 10. Empty States

### No revenue in period

Message:

```text
No cash received in this period.
```

Actions:

- Change period
- View billing health
- View reconciliation

### No forecast in horizon

Message:

```text
No renewals due in this horizon.
```

Actions:

- Change forecast horizon
- View membership forecast

### No member growth

Message:

```text
No joined or churned members in this period.
```

---

## 11. Error States

If KPI data fails to load:

- Do not show stale numbers without a stale indicator.
- Show a degraded state.
- Provide a Retry button.
- Link to Operations Centre if the issue may be systemic.

Example:

```text
Revenue unavailable
Could not load payment events. Retry or open Billing Health.
```

---

## 12. Permissions

The dashboard is admin-only.

All data is loaded through server functions protected by:

- authenticated user requirement,
- admin role check,
- no client-side direct table access for sensitive business data.

---

## 13. Performance Targets

| Interaction | Target |
|---|---|---|
| Initial dashboard load | < 1.5s warm |
| Period change | < 1s cached / < 2s cold |
| Forecast horizon change | < 1.5s |
| Drill-down open | < 2s |
| Chart render | no visible layout shift |

Use skeletons for chart areas and KPI rows.

---

## 14. Anti-patterns

Do not:

- add operational tables to the dashboard,
- expose raw Stripe event names in headline areas,
- create a fifth KPI for short-term convenience,
- duplicate Memberships or Payments pages inside the dashboard,
- show fake numbers,
- use different calculations for the same metric on different pages,
- hide failed payment warnings below charts.

---

## 15. Acceptance Criteria

The dashboard is complete when:

- the four KPI cards are present and only those four,
- every KPI uses the metric registry source of truth,
- historical and forecast selectors are independent,
- every chart uses shadcn chart primitives and Recharts accessibility layer,
- every number drills to raw records or reconciliation,
- no ambiguous labels remain,
- the dashboard can be understood in under thirty seconds,
- an operator can explain why each number is what it is without querying the database.



---


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



---


# REPS Admin v2
## Part IV — Member Lifecycle & Member Management

**Document:** 04  
**Status:** Draft specification for approval  
**Audience:** Founder, operations, support, engineering, Lovable implementation agent  
**Scope:** Professionals, Active Paying Members, Member Timeline, Member 360 direction, lifecycle states, status language, cross-linking  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

REPS has two related but distinct people concepts:

1. **Professional** — a person in the REPS professional register/directory.
2. **Active Paying Member** — a person currently entitled to paid access.

They overlap, but they are not the same thing.

Admin v2 must make this distinction obvious. Confusing these concepts is how the admin ends up showing apparently contradictory numbers. The member-management system must be built around the full lifecycle of a professional and their paid membership entitlement.

The central rule is:

> Every person has one operational home: the Member Timeline.

Professionals, billing rows, support tickets, verification cases, reviews and churn records all link back to it.

---

## 1. Core Concepts

### Professional

A Professional is represented by a `professionals` row and related profile data.

A Professional may be:

- confirmed or unconfirmed,
- verified or unverified,
- published or unpublished,
- free or paid,
- suspended,
- demo,
- deleted.

### Active Professional

Canonical definition:

> Email-confirmed, non-demo professional, excluding admins.

This is a directory/register metric, not a billing metric.

### Active Paying Member

Canonical definition:

> Distinct person with currently valid paid entitlement, deduped across Stripe subscription, legacy link and BD seed rails.

This is a billing/membership metric, not a directory metric.

### Paid Professional

A Professional who is also in the Active Paying Member collection.

This is the bridge concept between directory and membership.

---

## 2. Lifecycle Model

Every professional moves through a lifecycle.

```text
Signup
  ↓
Email confirmation
  ↓
Profile created
  ↓
Professional record created
  ↓
Verification submitted
  ↓
Verification approved/rejected
  ↓
Membership purchased or migrated
  ↓
Active paid entitlement
  ↓
Renewal
  ↓
Payment success or failure
  ↓
Recovery or churn
  ↓
Cancellation / deletion
```

Not every member passes through every stage. Legacy BD members may arrive at the paid entitlement stage before they have a normal Stripe subscription. Free professionals may remain in the professional register without ever purchasing.

---

## 3. Status Language

Status labels must describe business state, not database state.

| Business status | Meaning | Examples of implementation state |
|---|---|---|
| Active Paying | Current valid paid entitlement | active subscription, valid legacy access, valid BD due date |
| Free Professional | Confirmed pro without paid entitlement | professional row, no active paid membership |
| Verification Pending | Verification submitted and waiting | pending qualification/identity/insurance |
| Verified Professional | Trust checks approved | verification_status='verified' |
| Payment Failed | Payment collection failed and recovery is active | past_due, unpaid, incomplete, recovery token |
| In Recovery | Member is in churn/recovery lifecycle | churn_lifecycle non-terminal stage |
| Pending Cancellation | Paid membership will end at period end | cancel_at_period_end=true |
| Churned | Member no longer has paid entitlement | canceled/lapsed terminal stage |
| Suspended | Platform admin has restricted account | admin action / suspension flag |
| Deleted | Account deletion completed | auth deletion + erasure/cascade |

Do not display raw statuses like `past_due` as primary labels unless inside a technical detail drawer.

---

## 4. Professionals Page

### Route

```text
/admin/professionals
```

### Purpose

Manage the professional register.

### Primary questions

- Who is in the REPS register?
- Which professionals are verified?
- Which professionals are published?
- Which professionals need attention?
- Which professionals are paid?

### KPI row

| KPI | Definition |
|---|---|
| Active Professionals | confirmed non-demo professionals excluding admins |
| Verified Professionals | verified subset of Active Professionals |
| Paid Professionals | Active Professionals who are Active Paying Members |
| New Professionals 30d | confirmed professional signups in last 30d |

### Required table columns

- name,
- email,
- location,
- profession/specialism,
- verification status,
- membership status,
- published status,
- risk flags,
- last active,
- actions.

### Row actions

Every row must provide:

- Open Timeline,
- View public profile,
- Edit professional,
- View verification,
- View support tickets,
- View billing,
- suspend with confirmation,
- delete with confirmation,
- impersonate if permitted.

### Filters

- status,
- verification,
- membership tier,
- published/unpublished,
- location,
- specialism,
- risk flags,
- demo.

### Search

Search by:

- name,
- email,
- user id,
- slug,
- Stripe customer id,
- BD member id.

---

## 5. Member Timeline

The Member Timeline is the canonical operational view for one person.

### Route

```text
/admin/ops/member/$userId
```

### Header

The header shows:

- full name,
- email,
- professional status,
- membership status,
- tier,
- verification status,
- risk badges,
- last activity,
- open alerts for this member.

### Header actions

- Send email,
- Open support ticket,
- Open Stripe,
- Send recovery email where applicable,
- Open professional profile,
- Open verification case,
- Open reviews,
- Copy user id.

### Timeline grouping

Events are grouped by day, then sorted newest-first by default.

The user can reverse to oldest-first for lifecycle reconstruction.

### Source filters

- All
- Payments
- Membership
- Emails
- Support
- Verification
- Reviews
- Profile
- Admin

### Empty state

If a member has little activity:

```text
No operational events yet.
This member exists, but no payment, support, verification or admin events have been recorded.
```

---

## 6. Future Member 360

Admin v2 may later introduce:

```text
/admin/member/$userId
```

with tabs:

- Overview
- Timeline
- Billing
- Verification
- Support
- Reviews
- Admin actions

This is not required for the first Admin v2 implementation because the Flight Recorder already provides the operational spine. If built, it must use the Timeline as the default tab.

---

## 7. Membership Entitlement Display

Every place displaying membership must use these labels:

| UI label | Internal tier |
|---|---|
| Core | `verified` |
| Pro | `pro` |
| Studio | `studio` |
| Free | `free` |

The UI must never use "Verified" to mean the Core tier. "Verified" is reserved for professional trust status.

### Membership badge examples

```text
Core · Active
Pro · Pending cancellation
Free · Not paying
Core · Payment failed
Legacy · Migrating
```

---

## 8. Churn and Recovery

Churn is not only a billing state. It is an operational workflow.

### Churn page route

```text
/admin/churn
```

### Purpose

Manage retention and recovery.

### Required sections

- lifecycle stage counts,
- members in recovery,
- failed payment nudges,
- pending cancellations,
- recovered members,
- win-back campaign links.

### Row actions

- Open Timeline,
- Send nudge,
- Send card update email,
- Open Stripe,
- Open support ticket,
- mark reviewed,
- create campaign segment.

---

## 9. Account Deletion and Suspension

Destructive actions must use `AlertDialog`.

### Suspend

Requires:

- reason,
- optional internal note,
- confirmation,
- audit log entry.

### Delete

Requires:

- typed confirmation,
- reason,
- Stripe cancellation verification,
- GDPR erasure path,
- audit log entry.

Delete must never be a single-click dropdown item.

---

## 10. Cross-linking Contract

Any row with a member/person/professional must include Open Timeline.

Required surfaces:

- Professionals
- Memberships
- Payments
- Churn
- Support
- Reviews
- Verification
- Activity Stream
- Reconciliation
- Email Operations
- Webhook Recovery

This removes the need for operators to remember which page owns the context.

---

## 11. Data Quality States

Some states are not normal lifecycle states but data integrity issues.

Examples:

- ghost subscription,
- orphan payment event,
- missing profile,
- missing professional row,
- duplicate merge,
- unresolved Stripe customer.

These states must be surfaced as integrity warnings, not silently hidden.

A paying subscription with missing user linkage should show as:

```text
Ghost subscription
```

with remediation actions.

---

## 12. Accessibility and Keyboard

High-throughput member pages should support:

- keyboard navigation in tables,
- slash search focus,
- Enter to open selected row,
- Esc to close drawers,
- consistent focus return after dialogs.

The Verification and Support pages set the pattern.

---

## 13. Acceptance Criteria

Member management is complete when:

- Active Professionals and Active Paying Members are visibly distinct,
- every member row links to Timeline,
- destructive actions require confirmation,
- Core is used consistently as the tier label,
- Free professionals are not confused with paid members,
- recovery and churn members are visible and actionable,
- no operator needs to copy a UUID between pages,
- every lifecycle state can be explained from one member screen.



---


# REPS Admin v2
## Part V — Revenue & Billing

**Document:** 05  
**Status:** Draft specification for approval  
**Audience:** Founder, finance, operations, engineering, Lovable implementation agent  
**Scope:** Revenue, Payments, Memberships, Forecast, Refunds, Failed Payments, Reconciliation, Stripe terminology  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Revenue and billing must be boring.

An operator should be able to answer three questions instantly:

1. **How much cash did we receive?**
2. **What cash is due next?**
3. **Who has a payment problem?**

Admin v2 separates business finance from operational billing:

- Dashboard shows cash received and projected cash due.
- Payments shows Stripe/payment records.
- Memberships shows renewal and entitlement health.
- Billing Health shows operational failures.
- Reconciliation proves every number.

No page should invent its own revenue calculation.

---

## 1. Canonical Revenue Concepts

### Revenue Received

Cash successfully received during a selected period.

Not MRR.
Not ARR.
Not invoice value.
Not projected renewals.

### Projected Cash Due

Expected renewals due during a forecast horizon.

Not received cash.
Not guaranteed cash.
Not MRR.

### MRR

Monthly recurring run-rate from live active/trialing Stripe subscriptions, normalised to monthly values.

MRR is a run-rate metric, not cash received.

### ARR

12 × MRR.

ARR is a run-rate metric, not cash received.

### Failed Payments

Canonical definition:

```text
subscriptions.status in ('past_due', 'unpaid', 'incomplete')
```

This includes initial payment failures and renewal failures.

---

## 2. Revenue Section Architecture

```text
Revenue
  Payments
  Memberships
  Reconciliation
```

### Payments

Raw financial transaction and Stripe operational view.

### Memberships

Membership forecast, renewal schedule and tier health.

### Reconciliation

Audit trail proving dashboard and revenue numbers.

These pages may cross-link, but each has a distinct owner responsibility.

---

## 3. Payments Page

### Route

```text
/admin/payments
```

### Purpose

Manage and investigate payment events, invoices, refunds and Stripe state.

### Tabs

1. REPS Subscriptions
2. Stripe Events
3. Refunds
4. Marketplace / Connect

### REPS Subscriptions tab

Shows:

- MRR,
- ARR,
- live Stripe subscriptions,
- new paid subscriptions this month,
- failed payments,
- recent subscription events.

Subtitles must be precise:

Bad:

```text
390 active subscribers
```

Good:

```text
390 live Stripe subscriptions
```

### Stripe Events tab

Shows:

- event type,
- status,
- received at,
- processed at,
- latency,
- user resolution,
- error/retry state,
- open timeline,
- open Stripe.

Raw event names may appear here because this is a technical payments page.

### Refunds tab

Shows:

- refund event,
- amount,
- original payment,
- member,
- reason,
- whether revenue was netted,
- open Stripe,
- open Timeline.

### Marketplace / Connect tab

Must clearly state:

```text
Marketplace payments are trainer/marketplace activity. They are not REPS subscription revenue unless otherwise labelled.
```

---

## 4. Memberships Page

### Route

```text
/admin/memberships
```

### Purpose

Manage membership entitlement health, tier mix, renewals and forecast.

### Primary metrics

- Core Members
- Pro Members
- Studio Members
- Scheduled Starts
- Trialing Now
- Upcoming Renewals
- Pending Cancellations

Avoid label "Total Members". If a combined number is useful, label it explicitly:

```text
Paying + Scheduled
```

and show the components:

```text
390 active paying + 2 scheduled starts
```

### Forecast chart

Shows upcoming renewals by date and tier.

Must differentiate:

- expected cash due,
- scheduled starts,
- pending cancellations excluded.

### Upcoming payments

Shows members due within the next N days.

Each row includes:

- member,
- tier,
- amount,
- due date,
- source rail,
- risk status,
- open timeline.

---

## 5. Reconciliation Page

### Route

```text
/admin/reconciliation
```

### Purpose

Prove every business metric.

### Required tabs

- Revenue
- Forecast
- Active Paying Members
- Payment Failed
- Registrations
- Growth

### Rules

- Reconciliation may expose raw database concepts.
- Reconciliation is allowed to be technical.
- Every row must explain inclusion/exclusion.
- Every dashboard number must link here.

### Payment failed section

Must support:

- Send recovery email,
- Open Timeline,
- Open Stripe,
- mark as reviewed.

---

## 6. Billing Health Page

### Route

```text
/admin/ops/billing
```

### Purpose

Operate payment failures, webhooks and recovery.

This page owns:

- failed payment counts,
- DLQ,
- replay queue,
- webhook latency,
- recovery actions,
- operational payment health.

It does not own MRR or ARR.

---

## 7. Payment Event Lifecycle

### Successful checkout

```text
Checkout started
  ↓
Stripe payment succeeds
  ↓
Webhook received
  ↓
Subscription upserted
  ↓
Membership active
  ↓
Email sent
  ↓
Dashboard updates
```

### Failed first payment

```text
Checkout / renewal attempted
  ↓
Payment fails
  ↓
Webhook received
  ↓
Subscription incomplete/past_due
  ↓
Churn/recovery lifecycle starts
  ↓
Card update email sent
  ↓
Member appears in Failed Payments
```

### Refund

```text
Refund issued
  ↓
Stripe event received
  ↓
Refund logged
  ↓
Revenue netted
  ↓
Refund appears in Payments and Reconciliation
```

---

## 8. Forecast Logic

Projected Cash Due includes:

- eligible active subscriptions,
- eligible legacy links,
- eligible BD seed renewals,
- scheduled starts where explicitly included.

It excludes:

- cancel_at_period_end subscriptions,
- failed payments already in recovery unless retry is scheduled and explicitly included,
- churned members,
- expired access outside recovery rules.

Forecast must mirror the production renewal engine as closely as possible.

---

## 9. Refund Rules

Revenue reporting must handle:

- full refunds,
- partial refunds,
- standalone charge refunds,
- invoice-linked refunds.

Every refund must be traceable to:

- original payment,
- member,
- amount,
- date,
- source event,
- revenue impact.

---

## 10. Failed Payment Rules

Canonical failed payment metric includes:

```text
past_due ∪ unpaid ∪ incomplete
```

All pages must use the same definition when displaying Failed Payments.

Churn page may display At Risk as lifecycle stage, but must subtitle it clearly:

```text
Recoverable churn lifecycle stages
```

---

## 11. Stripe Links

Every payment-related row should link to Stripe where safe:

- customer,
- subscription,
- invoice,
- payment intent,
- charge,
- refund.

External links open in a new tab.

Never require an operator to manually search Stripe for routine support.

---

## 12. Export

Payments page must support CSV export for:

- subscriptions,
- payments,
- refunds,
- marketplace activity.

Export must respect filters.

Exports must include a generated-at timestamp and filter summary.

---

## 13. Naming Rules

Use:

- Revenue Received
- Projected Cash Due
- MRR
- ARR
- Payments Today
- Refunds Today
- Failed Payments
- Pending Cancellations
- Live Stripe Subscriptions

Avoid:

- Revenue when meaning MRR,
- Total Members,
- Active Subscribers when meaning paying members,
- Forecast Revenue when meaning due renewals,
- Past Due when incomplete/unpaid are included.

---

## 14. Acceptance Criteria

Revenue and billing are complete when:

- cash received reconciles to raw payment events,
- refunds are netted correctly,
- forecast excludes pending cancellations,
- failed payments are consistently defined,
- Stripe-only metrics are labelled Stripe-only,
- every payment row links to Timeline and Stripe,
- no page uses ambiguous revenue terminology,
- an operator can answer "did we take the money?" in under one minute.



---


# REPS Admin v2
## Part VI — Verification, Trust & Safety

**Document:** 06  
**Status:** Draft specification for approval  
**Audience:** Trust team, operations, support, engineering, Lovable implementation agent  
**Scope:** Verification queue, identity, qualifications, insurance, reviews, CPD, trust state, moderation, compliance  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Trust is the product.

REPS is not simply a directory. It is a professional register. The admin must make trust decisions fast, consistent and auditable.

Verification, reviews, insurance and CPD all contribute to public confidence. Admin v2 treats them as a coherent Trust & Safety system rather than disconnected pages.

---

## 1. Trust Surfaces

```text
Verification
  Qualifications
  Identity
  Insurance

Reviews
  Moderation
  Trust signals
  Abuse prevention

CPD
  Compliance
  Ongoing learning
  At-risk professionals
```

Each surface contributes to the public trust status of a professional.

---

## 2. Verification Page

### Route

```text
/admin/verification
```

### Purpose

Review and decide professional trust submissions.

### Workspace model

Use a split workspace:

```text
Queue list          Review workspace
----------          ----------------
Pending items       Professional summary
Claim status        Evidence/document preview
SLA signal          Checks
Filters             Decision actions
```

This layout is correct and should remain the pattern.

### Queue item requirements

Each queue item shows:

- professional name,
- submission type,
- submitted at,
- SLA state,
- claimed by,
- risk flags,
- linked member timeline.

### Workspace requirements

The workspace shows:

- profile summary,
- submitted evidence,
- previous decisions,
- related qualifications,
- Ofqual check result where applicable,
- checklist,
- decision buttons.

---

## 3. Verification Decisions

Allowed decisions:

- Approve
- Request changes
- Reject
- Revoke existing verification

Every decision requires:

- reviewer id,
- timestamp,
- reason,
- notes where relevant,
- audit log entry,
- member timeline event,
- email where relevant.

### Approve & next

High-throughput reviewers need:

```text
Approve & next
```

This approves the current clean case and loads the next pending case.

### Keyboard shortcuts

Recommended:

- `j` / `k`: next / previous queue item
- `a`: approve
- `r`: reject
- `c`: request changes
- `/`: search
- `Esc`: close drawer/dialog

Shortcuts must be discoverable in a help tooltip.

---

## 4. Identity Verification

Identity verification answers:

> Is this person who they claim to be?

The admin must show:

- identity status,
- document status,
- verification provider result,
- mismatch flags,
- previous identity attempts,
- related profile data,
- actions.

Identity data is sensitive. Access must be admin-only and logged.

---

## 5. Qualification Verification

Qualification verification answers:

> Is this professional qualified to claim the credentials they show?

The workspace must show:

- qualification name,
- awarding body,
- level,
- certificate evidence,
- Ofqual match result,
- AI confidence where used,
- manual reviewer decision.

AI may assist but must not be the sole decision-maker for trust status.

---

## 6. Insurance Verification

Insurance verification answers:

> Does this professional currently have valid cover?

The admin must show:

- insurer,
- policy date,
- expiry date,
- coverage notes,
- document preview,
- expiry warning,
- renewal reminder status.

Expired insurance must surface operationally.

If insurance expiry affects public verification status, that relationship must be explicit.

---

## 7. Reviews Moderation

### Route

```text
/admin/reviews
```

### Purpose

Protect public trust in reviews.

### Required capabilities

- pending reviews queue,
- approved/removed tabs,
- AI verdict filter,
- suspect-first sort,
- rating filter,
- search by pro/member,
- approve,
- remove with reason,
- internal note,
- notify reviewer/pro option,
- timeline link.

### Moderation reasons

Standard categories:

- spam,
- abusive,
- conflict of interest,
- unverifiable,
- personal data,
- inappropriate content,
- duplicate,
- other.

Every removal requires a category and note.

---

## 8. Trust Status Model

A professional's public trust state should be understandable.

Example labels:

- Verified
- Verification pending
- Changes requested
- Insurance expiring
- Insurance expired
- Review flagged
- Suspended

Do not overload "Verified" to mean Core tier.

---

## 9. CPD

### Route

```text
/admin/cpd
```

### Current principle

If CPD is not connected to real data, the page must be clearly marked as preview-only or hidden from primary navigation.

Fake named individuals are not allowed in production-looking admin.

### Future CPD purpose

When real:

- track CPD compliance,
- show points/credits,
- identify at-risk professionals,
- send reminders,
- review CPD submissions,
- surface compliance trends.

### CPD actions

- send reminder,
- approve CPD evidence,
- reject CPD evidence,
- grant manual credit,
- open timeline.

---

## 10. Trust Audit Trail

Every trust action creates:

- admin audit log entry,
- member timeline event,
- optional email log,
- decision record.

A reviewer must be able to explain why a professional is trusted.

---

## 11. Trust Page Cross-links

Every Trust page links to:

- Member Timeline,
- Professional profile,
- Support tickets,
- Reviews,
- Verification history.

---

## 12. Safety and Compliance

Sensitive documents must:

- be viewed through authenticated admin-only routes,
- not be indexed,
- not expose public URLs unnecessarily,
- log admin access where required.

Destructive or trust-changing actions require confirmation.

---

## 13. Empty States

### Verification queue empty

```text
No verification cases waiting.
```

Actions:

- View recently approved
- View rejected
- Open Professionals

### Reviews empty

```text
No reviews need moderation.
```

Actions:

- View approved reviews
- View flagged history

### CPD not live

```text
CPD oversight is not connected to live data yet.
```

No fake data.

---

## 14. Acceptance Criteria

Trust & Safety is complete when:

- reviewers can process cases without navigation friction,
- every trust decision is audited,
- identity/qualification/insurance are clearly separated,
- reviews are sorted so risky content is seen first,
- CPD never displays fake data as live,
- every professional trust state is explainable,
- every trust surface links to Timeline.



---


# REPS Admin v2
## Part VII — Support & Communications

**Document:** 07  
**Status:** Draft specification for approval  
**Audience:** Support, operations, growth, engineering, Lovable implementation agent  
**Scope:** Support inbox, campaigns, transactional emails, email operations, notifications, message history, operator workflows  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Support is where operational reality meets the customer.

The admin must let a small team answer members quickly with full context. The support operator should not need to ask engineering:

- Did they pay?
- Did the webhook arrive?
- Did the email send?
- Are they verified?
- Are they in churn recovery?

Admin v2 links support directly to the Member Timeline, billing, verification, email history and account status.

---

## 1. Support Page

### Route

```text
/admin/support
```

### Purpose

Operate inbound support conversations.

### Required capabilities

- inbox tabs,
- live updates,
- search,
- keyboard shortcuts,
- ticket sheet,
- internal notes,
- reply composer,
- AI draft,
- status management,
- bulk actions,
- undo for reversible actions,
- Open Timeline.

---

## 2. Support Inbox Model

### Inboxes

- Support
- Professionals
- Partners
- Press

Each inbox maps to a real email address or source.

### Ticket statuses

- New
- Open
- Pending
- Solved
- Closed
- Spam
- Trash

### SLA states

- On track
- Due soon
- Breached

SLA state must be visible in the ticket list and inside the ticket.

---

## 3. Ticket Sheet

The ticket sheet should contain:

- requester details,
- member status,
- linked Timeline,
- conversation thread,
- internal notes,
- related payments,
- related verification cases,
- AI draft,
- reply composer,
- status/actions.

### Header actions

- Open Timeline,
- View Professional,
- View Billing,
- Assign,
- Add note,
- Create follow-up.

---

## 4. Support Keyboard Standards

Support sets the admin standard for keyboard interaction.

Recommended shortcuts:

- `/` focus search
- `j` next ticket
- `k` previous ticket
- `Enter` open ticket
- `Esc` close sheet
- `c` compose
- `r` reply
- `n` note

Shortcuts must be documented on-page.

---

## 5. Canned Responses

Future support should include macros.

Initial macro categories:

- payment failed,
- card update,
- verification pending,
- verification rejected,
- refund request,
- cancellation,
- profile publishing,
- directory visibility,
- account deletion.

Macros must be editable by admins and should never auto-send without review.

---

## 6. Campaigns Page

### Route

```text
/admin/campaigns
```

### Purpose

Send managed broadcast or segmented communications.

### Required capabilities

- campaign list,
- draft creation,
- audience selection,
- recipient count preview,
- send confirmation,
- schedule send,
- template selection,
- status tracking,
- open/click stats where available,
- suppression handling.

### Campaign safety

Before send, show:

```text
Send to 391 Core members?
```

with:

- audience definition,
- estimated count,
- exclusions,
- suppression count,
- sample recipients.

No campaign should send blind.

---

## 7. Transactional Emails

Transactional emails are not campaigns.

They are system-triggered messages such as:

- welcome,
- purchase confirmation,
- cancellation confirmation,
- card update,
- verification reminder,
- support reply,
- review request,
- admin invite.

Every transactional email must have:

- template name,
- trigger,
- idempotency key,
- delivery log,
- failure path,
- suppression behaviour,
- preview.

---

## 8. Email Operations

Email Operations lives under Operations, not Campaigns.

It answers:

> What happened to this email?

It owns:

- email log,
- delivery lifecycle,
- suppressions,
- bounces,
- complaints,
- DLQ,
- retry/requeue.

Support and Campaigns link into Email Operations when investigating delivery.

---

## 9. Notifications

Admin notifications include:

- in-app banners,
- alert emails,
- optional Slack later,
- support badges,
- verification badges,
- review badges.

Notifications should not create duplicate sources of truth. They route operators to the owning page.

---

## 10. Communication Timeline

Every member's Timeline must show:

- transactional emails,
- campaign sends where relevant,
- support replies,
- internal notes as admin-only events,
- suppression changes,
- failed email deliveries.

A support operator should know whether the member was actually contacted.

---

## 11. Message Tone

Admin-generated customer messages should be:

- clear,
- concise,
- factual,
- human,
- not over-technical.

For payment failures:

Bad:

```text
Your subscription status is incomplete.
```

Good:

```text
We couldn't collect your renewal payment. Please update your card to keep your REPS membership active.
```

---

## 12. Suppression Management

Operators must be able to:

- search suppressed addresses,
- see suppression reason,
- remove suppression with confirmation,
- audit removal,
- open related email history.

Removing a suppression is a sensitive action and must be logged.

---

## 13. Support to Billing Flow

If a member says:

> I paid but nothing happened.

Support path:

```text
Open ticket
  ↓
Open Timeline
  ↓
Check payment events
  ↓
Check subscription state
  ↓
Check email delivery
  ↓
Open Billing Health / Reconciliation if needed
```

This should be one or two clicks, not database investigation.

---

## 14. Support to Verification Flow

If a professional asks:

> Why am I not verified?

Support path:

```text
Open ticket
  ↓
Open Timeline
  ↓
Open Verification history
  ↓
Review decision/reason
  ↓
Reply with clear next step
```

---

## 15. Acceptance Criteria

Support & Communications is complete when:

- every ticket links to Timeline,
- every customer email can be traced,
- every campaign shows recipient count before send,
- transactional emails have delivery records,
- suppressions can be managed safely,
- support can answer payment/verification/account questions without engineering,
- communication history appears in the member Timeline.



---


# REPS Admin v2
## Part VIII — Content, Growth & Discovery

**Document:** 08  
**Status:** Draft specification for approval  
**Audience:** Growth, content, operations, product, Lovable implementation agent  
**Scope:** Directory, Gyms, Campaigns as growth surface, CPD visibility, public discovery, content quality, search health  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

REPS grows when professionals are discoverable and trusted.

The content and discovery admin exists to manage the public-facing surfaces that make REPS useful:

- professional directory,
- gym directory,
- public profile quality,
- location coverage,
- content completeness,
- campaigns,
- CPD when live.

This section is not a dumping ground for miscellaneous admin pages. Every content page must connect directly to public visibility, activation or growth.

---

## 1. Content & Discovery Architecture

```text
Content & Discovery
  Directory
  Gyms
  Campaigns
  CPD
```

### Directory

Public professional search health.

### Gyms

Gym and location moderation.

### Campaigns

Broadcast/segmented growth and lifecycle communications.

### CPD

Future compliance/engagement product. Hidden or marked preview until connected to real data.

---

## 2. Directory Page

### Route

```text
/admin/directory
```

### Purpose

Answer:

> Is the public directory healthy?

### Metrics

- live listings,
- completeness score,
- listings needing attention,
- city coverage,
- featured rotation health,
- unpublished but eligible professionals,
- broken public profile fields.

### Required sections

1. Directory health summary
2. Featured professionals
3. Listings needing attention
4. Geographic coverage
5. Public visibility rules

### Listings needing attention

Rows should show:

- professional,
- issue,
- completeness score,
- missing fields,
- public visibility,
- Open Timeline,
- View public profile,
- Edit profile.

### Placeholder rule

Panels for future crawlers or broken-link systems must not appear as live controls until functional.

---

## 3. Directory Quality Model

A professional listing quality score may include:

- profile photo,
- bio,
- specialisms,
- location,
- qualifications,
- insurance,
- reviews,
- REP content,
- availability/contact readiness.

The score must be explainable.

If an operator sees 76%, they must be able to see what is missing.

---

## 4. Public Visibility States

| State | Meaning |
|---|---|
| Published | visible publicly |
| Hidden | not visible publicly |
| Eligible | can be published |
| Needs attention | missing required fields |
| Suspended | hidden due to admin action |
| Verification blocked | cannot publish until trust issue resolved |

Do not collapse all unpublished states into one label.

---

## 5. Gyms Page

### Route

```text
/admin/gyms
```

### Purpose

Moderate and maintain gym/location records.

### Required capabilities

- search,
- filter by status,
- source badge,
- approve/reject,
- promote Google-sourced gym,
- geocode backfill,
- pagination,
- public link where available,
- count badges.

### Gym statuses

- Pending
- Active
- Rejected
- Curated
- Google-imported
- Needs geocode

### Bulk actions

Future capability:

- bulk approve,
- bulk reject,
- bulk geocode.

---

## 6. Campaigns as Growth Surface

Campaigns appear in Content & Discovery because many campaigns are growth/lifecycle campaigns, not support tickets.

Campaign types:

- onboarding,
- activation,
- renewal nudge,
- win-back,
- profile completion,
- verification reminder,
- CPD reminder,
- product launch.

Every campaign must show:

- audience definition,
- estimated recipients,
- exclusions,
- suppression count,
- status,
- send/schedule date,
- performance stats.

---

## 7. CPD Page

### Route

```text
/admin/cpd
```

### Version 1 requirement

If CPD data is not real, the page must show:

```text
Preview only — CPD data is not connected yet.
```

and must not display named fake individuals as if live.

### Future CPD product

When live, the page should show:

- compliance rate,
- at-risk professionals,
- CPD points,
- expiring compliance windows,
- reminder actions,
- course catalogue moderation,
- evidence review.

CPD should link to the Member Timeline and Campaigns.

---

## 8. Growth Metrics

Growth metrics belong here only when they relate to public discovery or campaigns.

Examples:

- profile completion,
- directory impressions,
- public profile views,
- search appearances,
- enquiry starts,
- campaign click-through.

Do not duplicate Business Dashboard KPIs.

---

## 9. Search and Discovery Health

Future Directory Health should include:

- search queries with no results,
- cities with low coverage,
- specialisms with low coverage,
- popular filters,
- professionals receiving high impressions but low enquiries,
- professionals hidden due to missing data.

This supports product growth without turning admin into marketing analytics.

---

## 10. Content Actions

Actions across content pages:

- Open Timeline,
- View public page,
- Edit content,
- Send completion reminder,
- Approve/reject gym,
- Promote listing,
- Create campaign segment.

Every action must be audited where it changes public state.

---

## 11. Empty States

### Directory has no issues

```text
All public listings meet the current quality threshold.
```

### No gyms pending

```text
No gym submissions waiting.
```

### CPD preview

```text
CPD oversight is not live yet.
```

---

## 12. Acceptance Criteria

Content & Discovery is complete when:

- public directory health is visible,
- listing quality issues are actionable,
- gyms can be moderated safely,
- campaigns show recipient count before send,
- CPD never displays fake live data,
- content pages link to member context,
- growth surfaces do not duplicate dashboard KPIs.



---


# REPS Admin v2
## Part IX — System, Settings & Platform Governance

**Document:** 09  
**Status:** Draft specification for approval  
**Audience:** Founder, engineering, operations, security, Lovable implementation agent  
**Scope:** Team, Settings, roles, permissions, impersonation, audit logs, feature flags, GDPR, retention, migration governance  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

System pages are dangerous because they often look simple but control important platform behaviour.

Admin v2 separates configuration, governance and operations. Settings is not a place for broken forms or fake integration status. Team management must be explicit. Audit logs must be available. Impersonation must be visible. GDPR retention must be documented.

The System section is small by design.

---

## 1. System Navigation

```text
System
  Team
  Settings
```

Related operational tools live elsewhere:

- Platform Health lives in Operations.
- Webhook Recovery lives in Operations.
- Migration lives in Operations.
- Reconciliation lives in Revenue.

---

## 2. Team Page

### Route

```text
/admin/team
```

### Purpose

Manage admin access.

### Required capabilities

- list admins,
- grant admin by email,
- invite new admin,
- revoke admin,
- block self-revoke,
- show last login,
- show pending invites,
- audit every change.

### Required columns

- name,
- email,
- role,
- granted by,
- granted at,
- last login,
- status,
- actions.

### Revocation

Revoke requires confirmation.

Self-revoke is blocked.

---

## 3. Settings Page

### Route

```text
/admin/settings
```

### Purpose

Manage platform configuration.

### Rule

If a setting is not editable, it must not present an active Edit button.

Bad:

```text
Edit
```

with no action.

Good:

```text
Read-only
```

or

```text
Coming soon
```

### Settings groups

- General
- Branding
- Email
- Integrations
- Feature Flags
- Maintenance
- Audit Log

Tabs must switch content. If tabs are not ready, show all sections scrollably or disable unavailable tabs.

---

## 4. Feature Flags

Feature flags must be real or clearly marked.

A feature flag row should show:

- key,
- description,
- current value,
- scope,
- last changed by,
- last changed at,
- audit link.

Changing a flag requires confirmation if it affects production users.

---

## 5. Integrations

Integration status must be live where possible.

Examples:

- Stripe
- Mail provider
- Supabase Storage
- Google APIs
- AI providers

Settings may link to Ops Platform Health for live connectivity.

Do not hardcode "Connected" without checking.

---

## 6. Maintenance Tools

Maintenance tools must be visually separated from settings.

Examples:

- backfill location data,
- sweep orphan subscriptions,
- run safe reindex,
- refresh cache.

Every maintenance action must show:

- what it does,
- whether it writes data,
- estimated scope,
- confirmation if destructive,
- audit log entry,
- result summary.

---

## 7. Audit Log

The audit log records admin actions.

It should be searchable and filterable by:

- actor,
- action,
- target kind,
- target id,
- date range,
- severity.

Each row should show:

- actor,
- action,
- target,
- before/after summary,
- timestamp,
- IP/device where available.

Audit log retention must be documented.

---

## 8. Impersonation

Impersonation is a powerful support tool and must be obvious.

Requirements:

- global impersonation banner,
- target user shown,
- actor shown,
- stop impersonation button,
- audit log entry,
- no destructive admin actions while impersonating unless explicitly allowed,
- clear visual separation.

Every admin page must render the impersonation banner.

---

## 9. Permissions

All admin pages require admin role.

Role checks must be server-enforced, not only client-side.

Public callable RPCs must be deliberate and documented.

Security-definer functions must have:

- restricted grants where possible,
- explicit `search_path`,
- comments explaining why definer is required.

---

## 10. GDPR and Retention

Account deletion must handle:

- auth user,
- profiles,
- professionals,
- subscriptions,
- payment records,
- payment events,
- legacy links,
- BD seed data,
- storage objects,
- email logs,
- audit logs,
- analytics events.

Some records are retained for legal/accounting purposes. Retention must be documented.

### Retention documentation required

- admin_audit_log,
- email_send_log,
- payment_events,
- Stripe IDs,
- support tickets,
- verification records.

The admin should link to the retention policy from Settings.

---

## 11. Migration Governance

Migration tools are operational, not permanent system features.

Migration pages must show:

- migration status,
- remaining rows,
- last run,
- errors,
- safe dry-run,
- destructive action confirmations,
- audit history.

The migration section should be removed or archived once migration is complete.

---

## 12. No Dead Controls

System pages have a stricter rule:

> If it looks like it changes production, it must either work or be disabled.

No dead Edit buttons.
No inactive toggles.
No fake integration status.
No fake settings rows.

---

## 13. Acceptance Criteria

System & Platform Governance is complete when:

- admin access is manageable and auditable,
- settings are either functional or honestly disabled,
- maintenance actions are safe and audited,
- impersonation is visible everywhere,
- retention policy is documented,
- dangerous actions require confirmation,
- no system page displays fake controls or fake statuses.



---


# REPS Admin v2
## Part X — Design System & Component Library

**Document:** 10  
**Status:** Draft specification for approval  
**Audience:** Design, engineering, Lovable implementation agent  
**Scope:** shadcn/ui usage, layout primitives, KPI cards, charts, tables, drawers, dialogs, timelines, states, tokens and interaction rules  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Admin v2 uses shadcn/ui as the design system foundation.

The goal is not to make the admin decorative. The goal is to make it consistent, accessible and fast to understand.

Every page should feel like part of the same product. Operators should not learn a new UI pattern on every route.

---

## 1. Design Principles

### Clear before clever

Operators are making business decisions. The UI must be obvious.

### Data dense, not cluttered

Admin pages can show a lot of information, but hierarchy must remain clear.

### Action near context

Actions should appear where the operator sees the relevant record.

### Explain states visually and verbally

Colour alone is not enough. Use labels and tooltips.

### Reuse primitives

Do not invent bespoke cards, dialogs or tables when a shared primitive exists.

---

## 2. shadcn/ui Foundation

Use shadcn/ui primitives for:

- Button
- Badge
- Card
- Sheet
- Drawer
- AlertDialog
- Dialog
- Tooltip
- HoverCard
- Popover
- Calendar
- Select
- Command
- Tabs
- Table/DataTable
- ScrollArea
- Skeleton
- Sonner/Toast
- DropdownMenu
- ContextMenu
- NavigationMenu
- Chart

If a component exists in shadcn, use it before creating a custom primitive.

---

## 3. Layout Primitives

### PageShell

For admin pages.

Contains:

- title,
- subtitle,
- actions,
- optional tabs/subnav,
- optional alert/banner slot.

### SectionPanel

For grouped content.

Contains:

- heading,
- description,
- optional action,
- content.

### KPIGrid

Responsive grid for KPI cards.

### DataSection

For tables with filters and actions.

### SplitWorkspace

For high-throughput review flows such as Verification and Support.

---

## 4. KPI Cards

KPI cards must include:

- label,
- value,
- subtitle,
- trend/delta where relevant,
- status where relevant,
- drill-down affordance.

KPI cards must not include raw implementation detail.

### KPI card states

- neutral,
- positive,
- warning,
- critical,
- loading,
- empty,
- error.

### KPI card click behaviour

If a card is clickable, use hover affordance and arrow.

If not clickable, do not show pointer cursor.

---

## 5. Tables and Data Grids

Tables must support:

- clear column labels,
- sorting where useful,
- filtering,
- pagination or virtualisation,
- row actions,
- empty states,
- loading states,
- export where relevant.

### Standard row actions

- Open Timeline
- Open record
- Open Stripe where relevant
- Copy ID
- Action-specific buttons

### Dangerous actions

Dangerous actions must be separated visually and require AlertDialog confirmation.

---

## 6. Charts

All charts use the shadcn chart component with Recharts.

Required:

- `ChartContainer`
- `ChartTooltip`
- `ChartTooltipContent`
- `accessibilityLayer`
- fixed/min height
- chart config with human labels
- CSS variables using `var(--chart-1)` style tokens

### Chart types

| Purpose | Chart |
|---|---|
| cumulative growth | AreaChart |
| daily cash | BarChart |
| forecast by date | BarChart |
| tier mix | BarChart horizontal |
| latency over time | LineChart |
| distribution | BarChart |

### Chart rules

- Charts must have meaningful empty states.
- Tooltips must use human currency/date labels.
- Do not use random colours.
- Do not hide axes on large explanatory charts.
- Sparklines may hide axes.

---

## 7. Badges

Badges communicate state.

### Membership badges

- Core
- Pro
- Studio
- Free
- Legacy
- BD

### Status badges

- Active
- Pending
- Failed payment
- In recovery
- Pending cancellation
- Churned
- Suspended
- Verified
- Needs review

### Tone mapping

| Tone | Meaning |
|---|---|
| Neutral | informational |
| Success | healthy/complete |
| Warning | needs attention |
| Critical | action required |
| Muted | inactive/resolved |

Never rely on colour alone.

---

## 8. Alert Banners

Alert banners appear at the top of pages.

### Types

- Critical platform issue
- Payment recovery issue
- Placeholder/preview warning
- Impersonation
- Read-only/settings warning

### Rules

- Critical banners link to owning page.
- Placeholder banners must be visually obvious.
- Impersonation banner is always visible while active.
- Banners must not stack endlessly; group where possible.

---

## 9. Dialogs and Confirmation

Use `AlertDialog` for destructive or irreversible actions.

Examples:

- delete professional,
- suspend professional,
- seed all migration rows,
- reset linking,
- live webhook replay,
- remove email suppression,
- revoke admin.

Confirmation dialog includes:

- action name,
- consequence,
- affected entity,
- optional typed confirmation for severe actions,
- cancel button,
- destructive confirm button.

---

## 10. Drawers, Sheets and Side Panels

Use side panels for contextual detail without losing place.

Examples:

- email lifecycle drawer,
- review removal details,
- support ticket sheet,
- verification certificate drawer,
- activity event detail.

Do not navigate away for small detail inspection.

---

## 11. Timeline Component

The Timeline is a reusable component.

Required features:

- grouped by day,
- icon per source,
- status tone,
- summary,
- timestamp,
- entity links,
- external links,
- expandable details,
- filter chips,
- search,
- pagination.

Timeline items must be written in human language.

Bad:

```text
invoice.payment_failed
```

Good:

```text
Renewal payment failed
```

Raw event type can appear in details.

---

## 12. Empty States

Empty states must explain what absence means.

Bad:

```text
No data
```

Good:

```text
No failed payments. All active subscriptions are currently paid.
```

Every empty state should include next action when useful.

---

## 13. Loading States

Use skeletons for:

- KPI cards,
- chart panels,
- tables,
- timeline rows.

Do not show layout jumps.

---

## 14. Error States

Errors should include:

- human message,
- retry action,
- support/debug link where relevant,
- degraded fallback if available.

Never silently show zero when a query failed.

---

## 15. Navigation

Sidebar is the primary admin navigation.

Ops pages also use the Ops sub-nav.

Breadcrumbs are useful for deep pages:

```text
Admin > Operations > Billing
```

Member Timeline should show member context in the header so deep links are understandable.

---

## 16. Command Palette

Future Admin v2 should support a command palette.

Primary commands:

- Find member
- Open dashboard
- Open billing health
- Open verification queue
- Open support
- Open reconciliation
- Open webhook recovery
- Create campaign

This is optional for first implementation but should be supported by the IA.

---

## 17. Responsive Behaviour

Admin is desktop-first but must remain usable on laptop/tablet.

Mobile is supported for emergency checks, not heavy operations.

Rules:

- tables become card lists on small screens where required,
- critical alerts remain visible,
- destructive actions remain confirmed,
- charts keep minimum height,
- filters collapse into sheets.

---

## 18. Accessibility

Requirements:

- keyboard navigable,
- focus states visible,
- dialogs trap focus,
- charts use accessibility layer,
- icon-only buttons have labels,
- colour not the only signal,
- headings form logical hierarchy.

---

## 19. Design Tokens

Use existing Tailwind/shadcn tokens.

Do not hardcode arbitrary one-off colours for operational state.

Chart colours use chart variables.

Severity tones should be centralised.

---

## 20. Acceptance Criteria

The Design System is complete when:

- all admin pages use shared primitives,
- all charts use shadcn chart conventions,
- all destructive actions use AlertDialog,
- all tables use consistent actions and filters,
- all operational states use consistent badge language,
- fake/dead UI is impossible to mistake as live,
- an operator can move between pages without relearning the UI.



---


# REPS Admin v2
## Part XI — Operational Workflows

**Document:** 11  
**Status:** Draft specification for approval  
**Audience:** Founder, operations, support, engineering, Lovable implementation agent  
**Scope:** End-to-end workflows across registration, purchase, renewal, failure, recovery, refund, cancellation, verification, support, migration and incidents  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Admin v2 is judged by workflows, not pages.

A beautiful page is useless if the operator cannot complete the task. This document defines the critical workflows that REPS must support without database access.

Each workflow includes:

- trigger,
- operator path,
- expected system state,
- required admin surfaces,
- failure handling,
- success criteria.

---

## 1. New Member Signup

### Trigger

A new professional signs up.

### Expected system path

```text
User submits signup
  ↓
Auth user created
  ↓
Email verification sent
  ↓
Profile created
  ↓
Professional row created
  ↓
Welcome email queued
  ↓
Admin Professionals shows new professional
```

### Admin surfaces

- Professionals
- Member Timeline
- Email Operations

### Operator check

Search by email in Member Finder and open Timeline.

Timeline should show:

- signup,
- email verification sent,
- profile/professional created,
- welcome email status.

---

## 2. Core Purchase

### Trigger

Professional purchases Core membership.

### Expected system path

```text
Checkout started
  ↓
Stripe checkout completed
  ↓
Webhook received
  ↓
Subscription created/upserted
  ↓
Active Paying Member collection updated
  ↓
Purchase confirmation email sent
  ↓
Dashboard updates
```

### Admin surfaces

- Dashboard
- Payments
- Memberships
- Billing Health
- Reconciliation
- Member Timeline

### Success criteria

- member appears as Active Paying Member,
- Core badge visible,
- Revenue Received reflects cash in selected period,
- Timeline shows checkout/payment/subscription/email.

---

## 3. Pro / Studio Purchase

### Trigger

User attempts to purchase Pro or Studio.

### Rules

- Pro must obey server-side gate.
- Studio must be waitlist or admin-controlled until live.
- UI-only gates are not sufficient.

### Admin surfaces

- Payments
- Memberships
- Member Timeline
- Team/admin testing controls if applicable.

---

## 4. Successful Renewal

### Trigger

Existing member renews.

### Expected path

```text
Renewal due
  ↓
Stripe attempts payment
  ↓
Payment succeeds
  ↓
Webhook processed
  ↓
Current period advances
  ↓
Projected Cash Due decreases accordingly
  ↓
Revenue Received increases
  ↓
Receipt/confirmation email sent
```

### Admin surfaces

- Dashboard
- Memberships
- Payments
- Member Timeline

### Success criteria

The operator can see:

- payment event,
- subscription period update,
- revenue effect,
- email sent.

---

## 5. Failed Renewal

### Trigger

Stripe cannot collect renewal payment.

### Expected path

```text
Payment fails
  ↓
Webhook received
  ↓
Subscription status becomes past_due/unpaid/incomplete
  ↓
Churn/recovery lifecycle begins
  ↓
Renewal token minted
  ↓
Card update email sent
  ↓
Member appears in Failed Payments
  ↓
Member appears in Churn/Recovery where relevant
```

### Admin surfaces

- Billing Health
- Customer Health
- Churn
- Reconciliation
- Member Timeline
- Email Operations

### Operator path

```text
Open alert or Billing Health
  ↓
Click Failed Payments
  ↓
Open member row
  ↓
Send recovery email if not sent
  ↓
Open Timeline to verify
```

---

## 6. Payment Recovery

### Trigger

Member updates card and payment succeeds.

### Expected path

```text
Card updated
  ↓
Retry/payment succeeds
  ↓
Subscription becomes active
  ↓
Churn lifecycle stage becomes recovered
  ↓
Recovery token consumed
  ↓
Member removed from Failed Payments
  ↓
Timeline shows recovery
```

### Success criteria

- no active failed payment remains,
- member is Active Paying,
- recovery email and payment events are visible.

---

## 7. Cancellation

### Trigger

Member cancels.

### Expected path
```text
Cancellation requested
  ↓
Stripe cancel_at_period_end set or immediate cancellation
  ↓
Cancellation email sent
  ↓
Forecast excludes future cash
  ↓
Pending Cancellation visible
  ↓
At period end, member churns
```

### Admin surfaces

- Memberships
- Payments
- Customer Health
- Churn
- Timeline

### Important rule

Pending cancellation is not the same as churned.

---

## 8. Refund

### Trigger

Refund issued in Stripe.

### Expected path

```text
Refund event received
  ↓
Refund logged
  ↓
Revenue netted
  ↓
Payment record shows refund
  ↓
Timeline shows refund
```

### Operator path

```text
Open Payments > Refunds
  ↓
Search refund/member
  ↓
Open Timeline
  ↓
Confirm revenue effect in Reconciliation
```

---

## 9. Account Deletion

### Trigger

User requests deletion or admin deletes account.

### Expected path

```text
Deletion requested
  ↓
Stripe subscriptions cancelled or confirmed absent
  ↓
Storage objects removed
  ↓
Auth user deleted
  ↓
Profile/professional cascades
  ↓
PII erased/anonymised where retention required
  ↓
Audit record retained
```

### Admin surfaces

- Professionals
- Settings / audit log
- Timeline before deletion
- Reconciliation integrity checks

### Success criteria

No ghost subscription remains.

---

## 10. Verification Approval

### Trigger

Professional submits qualification/identity/insurance.

### Operator path

```text
Open Verification
  ↓
Claim case
  ↓
Review evidence
  ↓
Approve / request changes / reject
  ↓
Approve & next if clean
```

### Success criteria

- decision recorded,
- email sent where relevant,
- Timeline updated,
- professional status updated.

---

## 11. Review Moderation

### Trigger

Review submitted or flagged.

### Operator path

```text
Open Reviews
  ↓
Suspect reviews appear first
  ↓
Approve or remove with reason
  ↓
Timeline updated
```

---

## 12. Support Ticket

### Trigger

Support ticket arrives.

### Operator path

```text
Open Support
  ↓
Open ticket
  ↓
Open Timeline
  ↓
Review billing/verification/email state
  ↓
Draft reply
  ↓
Send and set status
```

### Success criteria

Support can answer without leaving admin.

---

## 13. Webhook Failure

### Trigger

Webhook event fails processing or enters DLQ.

### Operator path

```text
Alert banner fires
  ↓
Open Billing Health / Webhook Recovery
  ↓
Run diagnosis
  ↓
Run dry replay
  ↓
Approve live replay if safe
  ↓
Verify result
```

### Success criteria

- failed event processed or dead-lettered with reason,
- no duplicate subscription/payment effects,
- Timeline updated if member-related.

---

## 14. Email Failure

### Trigger

Email fails, bounces, enters DLQ or suppression blocks send.

### Operator path

```text
Open Email Operations
  ↓
Search recipient/message_id
  ↓
Open lifecycle drawer
  ↓
Retry/remove suppression if appropriate
  ↓
Verify status
```

---

## 15. Legacy / BD Migration Renewal

### Trigger

Legacy/BD member reaches renewal anchor.

### Expected path

```text
Renewal job evaluates due member
  ↓
Stripe subscription/payment attempted
  ↓
Webhook processed
  ↓
Subscription/membership updated
  ↓
Legacy/BD next due date advanced on success
  ↓
Recovery begins on failure
```

### Admin surfaces

- Migration
- Memberships
- Billing Health
- Webhook Recovery
- Timeline

---

## 16. Campaign Send

### Trigger

Operator sends campaign.

### Operator path

```text
Open Campaigns
  ↓
Create campaign
  ↓
Select audience
  ↓
Review recipient count and exclusions
  ↓
Confirm send/schedule
  ↓
Monitor Email Operations
```

---

## 17. Incident Response

### Trigger

Platform alert fires.

### Operator path

```text
See alert banner
  ↓
Open Alerts
  ↓
Read plain-English summary
  ↓
Open owning operational page
  ↓
Acknowledge/mute if known
  ↓
Resolve underlying issue
```

---

## 18. Workflow Acceptance Criteria

Admin v2 workflows are complete when:

- every critical lifecycle can be executed without database access,
- every workflow ends with a verifiable Timeline event,
- every failure path has an operational owner page,
- every destructive action is confirmed,
- every payment, email and verification decision is traceable,
- support can solve common customer problems from the admin alone.



---


# REPS Admin v2
## Part XII — Implementation Roadmap & Migration Plan

**Document:** 12  
**Status:** Draft specification for approval  
**Audience:** Founder, engineering, Lovable implementation agent  
**Scope:** Admin v2 build plan, v1 fallback, rollout, QA, migration sequencing, governance and freeze  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Admin v2 should not be implemented as a risky big-bang replacement.

The current admin remains available as the fallback while Admin v2 is built, tested and rolled out route by route. The objective is to improve coherence and trust without destabilising the production platform.

Admin v2 is a product layer over the existing stable platform foundation. It must not rewrite billing, webhooks, renewals, churn or reconciliation unless a genuine production bug is discovered.

---

## 1. Implementation Principles

### Keep v1 available

Admin v1 remains in the background until v2 is verified.

### Build by capability, not by visual page

Start with shared primitives and metric contracts, then pages.

### No business logic rewrites

Admin v2 consumes existing server functions and canonical domain helpers wherever possible.

### Metric registry first

No KPI work begins until the metric registry is enforced.

### Support fallback

Operators must be able to return to v1 during rollout.

---

## 2. Suggested Route Strategy

Two safe options.

### Option A — Parallel namespace

```text
/admin-v2
/admin-v2/ops
/admin-v2/professionals
```

Pros:

- safest,
- no disruption,
- easy side-by-side comparison.

Cons:

- duplicates route set during build,
- needs final cutover.

### Option B — Feature flag inside existing admin

```text
/admin?admin_v=2
```

Pros:

- easier routing,
- less duplication.

Cons:

- more conditional logic,
- harder to reason about fallback.

### Recommendation

Use parallel namespace for initial build, then cut over.

---

## 3. Build Phases

### Phase 0 — Contract enforcement

- freeze metric registry,
- standardise labels,
- fix same-label/different-calculation issues,
- replace remaining tier "Verified" UI strings with "Core",
- document source-of-truth map.

### Phase 1 — Design system primitives

Build or standardise:

- PageShell,
- KPICard,
- HealthStatusStrip,
- DataTable primitive,
- Timeline component,
- MemberFinder,
- EmptyState,
- ConfirmActionDialog,
- ChartPanel,
- OpsSubNav.

### Phase 2 — Dashboard v2

Implement Business Dashboard exactly as Document 02.

Compare v1 and v2 numbers side by side.

### Phase 3 — Operations Centre v2

Implement Operations home, Billing, Platform, Customer, Email, Activity, Alerts and Timeline.

Keep existing operational server functions.

### Phase 4 — Member management

Implement Professionals and member lifecycle cross-links.

Do not build full Member 360 unless explicitly approved.

### Phase 5 — Revenue & Billing

Implement Payments, Memberships and Reconciliation presentation consistency.

Do not merge pages unless production usage proves it necessary.

### Phase 6 — Trust & Support

Implement Verification, Reviews, Support and Communications improvements.

### Phase 7 — Content & System

Implement Directory, Gyms, CPD placeholder/real state, Campaigns, Team, Settings.

### Phase 8 — QA and cutover

Run full admin workflow QA.

Compare v1/v2 metrics.

Cut over only when accepted.

---

## 4. v1 Fallback

During rollout, v1 remains accessible.

Suggested fallback route:

```text
/admin/v1
```

or protected feature flag.

Operators should see a banner in v2 during beta:

```text
Admin v2 beta · Return to Admin v1
```

---

## 5. QA Gates

### Gate 1 — Metric consistency

Verify:

- Active Paying Members match across dashboard and customer health.
- Paid Professionals uses canonical paying collection.
- Paying + Scheduled label explains scheduled cohort.
- Failed Payments uses canonical definition.
- Core label used for tier everywhere.

### Gate 2 — Navigation

Verify:

- every sidebar item works,
- no stale redirects in visible nav,
- every member row has Open Timeline,
- every major workflow has an obvious path.

### Gate 3 — Workflow QA

Run workflows from Document 11.

Each must pass without database access.

### Gate 4 — Accessibility

Verify:

- keyboard navigation,
- dialogs,
- chart accessibility,
- labels,
- focus states.

### Gate 5 — Performance

Measure:

- dashboard load,
- operations load,
- timeline load,
- search latency.

---

## 6. Lovable / AI Implementation Rules

Implementation agent must:

- read these docs before coding,
- avoid unrequested architecture changes,
- use shadcn/ui primitives,
- use existing server functions where possible,
- not create mock data,
- not change billing/webhook/renewal/churn logic,
- keep v1 fallback available,
- run typecheck,
- provide screenshot evidence.

### shadcn MCP

Where available, use the shadcn MCP server/registry to inspect existing component patterns and avoid bespoke UI. Admin v2 should not create a parallel design system.

---

## 7. File Organisation

Suggested docs location:

```text
/docs/admin-v2/
```

Suggested component areas:

```text
src/components/admin-v2/
src/components/admin-v2/primitives/
src/components/admin-v2/ops/
src/components/admin-v2/dashboard/
src/components/admin-v2/timeline/
```

Do not mix v2 primitives into old page-specific components until stable.

---

## 8. Migration Safety

Admin v2 should require minimal database migrations.

Allowed migrations:

- missing audit fields,
- safe indexes for read performance,
- comments/metadata,
- configuration where already approved.

Not allowed without separate approval:

- subscription schema changes,
- payment event semantics changes,
- webhook processing changes,
- churn lifecycle changes,
- renewal engine changes.

---

## 9. Cutover Plan

### Step 1 — Internal preview

Founder/admin only.

### Step 2 — Side-by-side comparison

Open v1 and v2:

- Dashboard
- Operations
- Professionals
- Payments
- Reconciliation

Compare numbers and workflows.

### Step 3 — Operator trial

Use v2 for normal operations for one week.

Record friction.

### Step 4 — Cutover

Make v2 default `/admin`.

Keep v1 behind fallback link for 30 days.

### Step 5 — Remove v1

Only after:

- no unresolved v2 blockers,
- no reliance on v1 pages,
- metrics match or are intentionally renamed,
- workflows pass.

---

## 10. Freeze Governance

After Admin v2 cutover, freeze:

- sidebar structure,
- metric names,
- page ownership,
- dashboard KPI set,
- operations architecture,
- timeline contract.

Future changes require one of:

- production bug,
- security issue,
- revenue issue,
- new product module,
- demonstrated operator pain from real usage.

No speculative admin redesigns.

---

## 11. Success Criteria

Admin v2 is successful when:

- the founder trusts the Dashboard,
- support uses Timeline as first response tool,
- operations sees problems before customers do,
- payments and renewals are explainable,
- verification reviewers move quickly,
- no fake/dead UI remains,
- no ambiguous metric labels remain,
- v1 can be retired safely.

---

## 12. Final Recommendation

Build Admin v2 deliberately, not reactively.

The current platform foundation is now strong. Admin v2 should translate that strength into a coherent operator experience. The goal is not more admin. The goal is less friction, more trust and faster decisions.

