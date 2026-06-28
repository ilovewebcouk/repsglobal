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
