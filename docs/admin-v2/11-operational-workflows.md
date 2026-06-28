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
