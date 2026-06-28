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
