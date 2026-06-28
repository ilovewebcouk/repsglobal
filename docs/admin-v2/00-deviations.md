# Admin v2 — Deviations from the Spec

**Status:** Accepted · binding companion to the docs in this folder.
**Owner:** Platform / Admin architecture.
**Last updated:** 2026-06-28.

The 15-file Admin v2 spec in this folder is the architecture contract for
the admin. We are executing it as an **in-place refinement of `/admin`**
rather than a parallel `/admin-v2` namespace. This preface records every
deviation we are knowingly accepting so future readers don't try to
reconcile the codebase with a literal reading of the spec.

---

## 1 · No parallel `/admin-v2` route tree

The spec proposes building `/admin-v2/*` alongside `/admin/*` and cutting
over once parity is reached. We are **not doing that**.

Reasons:
- The existing `/admin` shell, sidebar, route gates, RLS, and SSR loaders
  are stable and production-grade.
- A parallel tree doubles surface area for metric drift — the exact
  failure mode the spec is trying to prevent.
- Operators are actively using `/admin` daily; a flag-gated cutover would
  create two sources of truth during the migration.

Instead, we refactor existing routes page-by-page against the spec.
Where the spec assumes new routes (e.g. `/admin-v2/operations/*`) we map
them onto the existing `/admin/ops/*` tree.

## 2 · No new design system

The spec sketches a fresh component library. We are **not building one**.
We extend the existing REPS admin visual language (semantic tokens in
`src/styles.css`, `DashboardShell`, the existing `AdminCard` / `StatTile`
/ `PanelHeader` / `PCard` family) and reach for shadcn primitives first
before hand-rolling anything.

The "promoted primitives" listed in §6 of the user brief are the *full*
set we are extracting in this pass. We are not inventing a parallel
typography scale, spacing scale, or color system.

## 3 · Items the spec lists as "Phase 1/2" that are already done

The following work the spec frames as upcoming is already shipped and
does not need a second build:

- **Metric registry** — `docs/11_admin_metric_registry.md` is the binding
  contract. `src/lib/admin/metrics-definitions.ts` and
  `src/lib/members/active-paying-member.ts` are the canonical sources.
  Admin v2 work consumes them rather than re-defining them.
- **CPD labels / verification gates / Ofqual scraping / AI insurance
  review** — already in production under `/admin/verification` and the
  3-pillar verification model.
- **Customer Health drill-downs** — already at `/admin/ops/customer`.
- **Suppression management** — already at `/admin/ops/email`.
- **MemberFinder + Member Timeline (Flight Recorder)** — already at
  `src/components/ops/MemberFinder.tsx` and
  `/admin/ops/member/$userId`.

Where the spec names a different file path or component name, treat the
existing path/name as canonical. Do not duplicate.

## 4 · Business logic is frozen

Per the closing rules of the user brief, this pass changes **labels,
component composition, surfacing of the Member Timeline, and the alert
presentation layer**. It does NOT change:

- Billing logic.
- Webhook logic.
- Renewal logic.
- Churn lifecycle logic.
- Reconciliation logic.
- Payment recovery logic.

Any spec section that proposes rewriting one of the above is treated as
informational, not a directive. If we discover a bug in those domains we
fix it as a separate, named change with its own migration / PR.

## 5 · Sidebar and page responsibilities

The sidebar groupings (Overview / Members / Revenue / Content /
Operations / System) shipped in the earlier "Wave 1/2" pass already
match the spec. We do not re-shuffle.

`/admin` is the **business dashboard** only — it answers four questions
(see `admin-freeze.md`). All operational firefighting lives under
`/admin/ops/*`. The spec agrees with this and we are enforcing it.

## 6 · What this pack IS used for

- The architectural contract for naming, separation of concerns, and
  metric ownership.
- The reference for which surfaces must expose the Member Timeline.
- The reference for which primitives are promoted and which are
  intentionally left local.
- The source for `admin-freeze.md`, which is the post-pass binding
  document.

If a future change wants to deviate from the spec in a way not listed
here, add a new section to this file in the same PR.

---

## 7 · Operator Trust Pass clarifications (2026-06-29)

These three clarifications are binding on every Admin v2 surface and
override any conflicting wording elsewhere in the pack.

### 7.1 Payment Recovery routing

"Payment Recovery" is a **member lifecycle** state, not a webhook state.
Every UI affordance labelled "Payment Recovery" must link to
`/admin/churn` (or `/admin/ops/billing?kind=in_recovery` where a sub-feed
is needed). It must **never** link to `/admin/webhook-recovery`.

`/admin/webhook-recovery` is reserved exclusively for failed Stripe
webhook processing, dead-letter queues, and replay tooling.

### 7.2 "Verified" terminology

"Verified" is **banned as a user-facing tier label**. Any UI that
displays the membership tier must say **Core**.

Permitted uses of "Verified":
- Internal DB / code tier keys (`tier === "verified"`,
  `TIER_RENEWAL_PENCE.verified`, Stripe metadata) — left untouched.
- UI strings that refer to **professional verification status**
  (ID / qualifications / insurance) — e.g. "Verified Professionals",
  "REPS Verified" badge.

### 7.3 Memberships visual hierarchy

`/admin/memberships` must make the arithmetic visually obvious:

    Active Paying Members = Core + Pro + Studio

Scheduled Starts, Legacy / BD setup, and Awaiting-Stripe-Setup cohorts
are reported in a **separate** "Migration & setup" section and must
never be merged into the Active Paying Members total.

No large aggregate number may be displayed without a label that names
exactly what it counts. Bare totals like "392" without registry-mapped
context are forbidden.

