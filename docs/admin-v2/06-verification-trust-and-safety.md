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
