# REPS Admin v2
## Part XII — Implementation Roadmap & Migration Plan

**Document:** 12  
**Status:** Draft specification for approval  
**Audience:** Founder, engineering, Lovable implementation agent  
**Scope:** Admin v2 build plan, v1 fallback, rollout, QA, migration sequencing, governance and freeze  
**Last updated:** 2026-06-28

---

## 0. Executive Summary

Admin v2 should not be implemented as a risky big-bang replacement.

The current admin remains available as the fallback while Admin v2 is built, tested and rolled out route by route. The objective is to improve coherence and trust without destabilising the production platform.

Admin v2 is a product layer over the existing stable platform foundation. It must not rewrite billing, webhooks, renewals, churn or reconciliation unless a genuine production bug is discovered.

---

## 1. Implementation Principles

### Keep v1 available

Admin v1 remains in the background until v2 is verified.

### Build by capability, not by visual page

Start with shared primitives and metric contracts, then pages.

### No business logic rewrites

Admin v2 consumes existing server functions and canonical domain helpers wherever possible.

### Metric registry first

No KPI work begins until the metric registry is enforced.

### Support fallback

Operators must be able to return to v1 during rollout.

---

## 2. Suggested Route Strategy

Two safe options.

### Option A — Parallel namespace

```text
/admin-v2
/admin-v2/ops
/admin-v2/professionals
```

Pros:

- safest,
- no disruption,
- easy side-by-side comparison.

Cons:

- duplicates route set during build,
- needs final cutover.

### Option B — Feature flag inside existing admin

```text
/admin?admin_v=2
```

Pros:

- easier routing,
- less duplication.

Cons:

- more conditional logic,
- harder to reason about fallback.

### Recommendation

Use parallel namespace for initial build, then cut over.

---

## 3. Build Phases

### Phase 0 — Contract enforcement

- freeze metric registry,
- standardise labels,
- fix same-label/different-calculation issues,
- replace remaining tier "Verified" UI strings with "Core",
- document source-of-truth map.

### Phase 1 — Design system primitives

Build or standardise:

- PageShell,
- KPICard,
- HealthStatusStrip,
- DataTable primitive,
- Timeline component,
- MemberFinder,
- EmptyState,
- ConfirmActionDialog,
- ChartPanel,
- OpsSubNav.

### Phase 2 — Dashboard v2

Implement Business Dashboard exactly as Document 02.

Compare v1 and v2 numbers side by side.

### Phase 3 — Operations Centre v2

Implement Operations home, Billing, Platform, Customer, Email, Activity, Alerts and Timeline.

Keep existing operational server functions.

### Phase 4 — Member management

Implement Professionals and member lifecycle cross-links.

Do not build full Member 360 unless explicitly approved.

### Phase 5 — Revenue & Billing

Implement Payments, Memberships and Reconciliation presentation consistency.

Do not merge pages unless production usage proves it necessary.

### Phase 6 — Trust & Support

Implement Verification, Reviews, Support and Communications improvements.

### Phase 7 — Content & System

Implement Directory, Gyms, CPD placeholder/real state, Campaigns, Team, Settings.

### Phase 8 — QA and cutover

Run full admin workflow QA.

Compare v1/v2 metrics.

Cut over only when accepted.

---

## 4. v1 Fallback

During rollout, v1 remains accessible.

Suggested fallback route:

```text
/admin/v1
```

or protected feature flag.

Operators should see a banner in v2 during beta:

```text
Admin v2 beta · Return to Admin v1
```

---

## 5. QA Gates

### Gate 1 — Metric consistency

Verify:

- Active Paying Members match across dashboard and customer health.
- Paid Professionals uses canonical paying collection.
- Paying + Scheduled label explains scheduled cohort.
- Failed Payments uses canonical definition.
- Core label used for tier everywhere.

### Gate 2 — Navigation

Verify:

- every sidebar item works,
- no stale redirects in visible nav,
- every member row has Open Timeline,
- every major workflow has an obvious path.

### Gate 3 — Workflow QA

Run workflows from Document 11.

Each must pass without database access.

### Gate 4 — Accessibility

Verify:

- keyboard navigation,
- dialogs,
- chart accessibility,
- labels,
- focus states.

### Gate 5 — Performance

Measure:

- dashboard load,
- operations load,
- timeline load,
- search latency.

---

## 6. Lovable / AI Implementation Rules

Implementation agent must:

- read these docs before coding,
- avoid unrequested architecture changes,
- use shadcn/ui primitives,
- use existing server functions where possible,
- not create mock data,
- not change billing/webhook/renewal/churn logic,
- keep v1 fallback available,
- run typecheck,
- provide screenshot evidence.

### shadcn MCP

Where available, use the shadcn MCP server/registry to inspect existing component patterns and avoid bespoke UI. Admin v2 should not create a parallel design system.

---

## 7. File Organisation

Suggested docs location:

```text
/docs/admin-v2/
```

Suggested component areas:

```text
src/components/admin-v2/
src/components/admin-v2/primitives/
src/components/admin-v2/ops/
src/components/admin-v2/dashboard/
src/components/admin-v2/timeline/
```

Do not mix v2 primitives into old page-specific components until stable.

---

## 8. Migration Safety

Admin v2 should require minimal database migrations.

Allowed migrations:

- missing audit fields,
- safe indexes for read performance,
- comments/metadata,
- configuration where already approved.

Not allowed without separate approval:

- subscription schema changes,
- payment event semantics changes,
- webhook processing changes,
- churn lifecycle changes,
- renewal engine changes.

---

## 9. Cutover Plan

### Step 1 — Internal preview

Founder/admin only.

### Step 2 — Side-by-side comparison

Open v1 and v2:

- Dashboard
- Operations
- Professionals
- Payments
- Reconciliation

Compare numbers and workflows.

### Step 3 — Operator trial

Use v2 for normal operations for one week.

Record friction.

### Step 4 — Cutover

Make v2 default `/admin`.

Keep v1 behind fallback link for 30 days.

### Step 5 — Remove v1

Only after:

- no unresolved v2 blockers,
- no reliance on v1 pages,
- metrics match or are intentionally renamed,
- workflows pass.

---

## 10. Freeze Governance

After Admin v2 cutover, freeze:

- sidebar structure,
- metric names,
- page ownership,
- dashboard KPI set,
- operations architecture,
- timeline contract.

Future changes require one of:

- production bug,
- security issue,
- revenue issue,
- new product module,
- demonstrated operator pain from real usage.

No speculative admin redesigns.

---

## 11. Success Criteria

Admin v2 is successful when:

- the founder trusts the Dashboard,
- support uses Timeline as first response tool,
- operations sees problems before customers do,
- payments and renewals are explainable,
- verification reviewers move quickly,
- no fake/dead UI remains,
- no ambiguous metric labels remain,
- v1 can be retired safely.

---

## 12. Final Recommendation

Build Admin v2 deliberately, not reactively.

The current platform foundation is now strong. Admin v2 should translate that strength into a coherent operator experience. The goal is not more admin. The goal is less friction, more trust and faster decisions.
