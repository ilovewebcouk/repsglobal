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

