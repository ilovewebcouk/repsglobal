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
