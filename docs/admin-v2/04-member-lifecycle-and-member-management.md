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
