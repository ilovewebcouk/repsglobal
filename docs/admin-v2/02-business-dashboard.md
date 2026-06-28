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
