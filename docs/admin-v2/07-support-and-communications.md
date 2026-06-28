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
