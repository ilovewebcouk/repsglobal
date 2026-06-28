# Admin Freeze (Post Admin v2 Pass)

**Status:** Binding · the admin architecture is frozen as of 2026-06-28.
**Owner:** Platform / Admin architecture.
**Companion docs:** `docs/admin-v2/00-deviations.md`, the rest of the
Admin v2 pack in this folder, `docs/11_admin_metric_registry.md`.

After this pass, the admin's information architecture, sidebar, metric
registry, page responsibilities, and operations architecture are
**frozen**. Future changes follow the rules in §6 below.

---

## 1 · Frozen sidebar structure

Five groups, in this exact order. No new top-level entries without a
production justification (§6).

| Group | Routes | Purpose |
|---|---|---|
| **Overview** | `/admin` | Business dashboard — 4 KPIs + supporting charts. |
| **Members** | `/admin/professionals` · `/admin/memberships` · `/admin/team` · `/admin/verification` · `/admin/cpd` · `/admin/directory` | The member-facing register and identity surface. |
| **Revenue** | `/admin/payments` · `/admin/churn` · `/admin/migration` · `/admin/webhook-recovery` · `/admin/campaigns` | Money in, money lost, money at risk. |
| **Content** | `/admin/reviews` · `/admin/support` · `/admin/gyms` | Member-generated content moderation. |
| **Operations** | `/admin/ops` · `/admin/ops/billing` · `/admin/ops/platform` · `/admin/ops/customer` · `/admin/ops/email` · `/admin/ops/activity` · `/admin/ops/alerts` · `/admin/ops/member/$userId` · `/admin/health` · `/admin/reconciliation` | Health, alerts, drill-downs, forensics. |
| **System** | `/admin/settings` | Platform-wide configuration. |

## 2 · Frozen metric registry

`docs/11_admin_metric_registry.md` is the binding contract for every
number rendered in the admin. No metric may be displayed without an entry
in §1 of that document. The display name on screen MUST match the
registry entry character-for-character.

Current canonical names (do not invent synonyms):

- **Active paying members** (M1) — single deduped union (Subs + Legacy + BD).
- **Active professionals** (M2) — confirmed pros, all tiers.
- **Verified professionals** (M3) — M2 with 3-pillar pass.
- **Paying + scheduled** (M4) — M1 plus the future-billing BD cohort.
- **Failed payments** (M5) — past_due · unpaid · incomplete (one constant).
- **Awaiting payment update** (M6) — unconsumed `/renew/$token` links.
- **Pending cancellations** (M7) — `cancel_at_period_end = true`.
- **Churn (7d)** (M8) · **Recoveries (7d)** (M9).
- **MRR** (M10) · **ARR (run-rate)** (M11) — Stripe rail only.
- **Revenue received** (M12) · **Projected cash due** (M13) · **Net member growth** (M14).
- **New signups (30d)** (M15).
- **New Core / Pro / Studio (7d)** (M16).

**Banned labels** (do not reintroduce): "Active members" (used to mean
either M1 or M2 depending on the page — use the explicit name), "Total
members", "Failed renewals", standalone "Past due" counts. The metric
registry's §2 "Banned synonyms" table is authoritative.

## 3 · Frozen page responsibilities

Each page has one job. Do not overload.

| Page | Single job | Must NOT do |
|---|---|---|
| `/admin` | Answer 4 business questions: how many paying members, how much revenue received, how much cash projected, are we growing? | Render operational alerts as primary content (the health banner is a *secondary* surface — operators click through to `/admin/ops`). |
| `/admin/ops` | Hub: at-a-glance health of billing, platform, customers, email, activity, alerts. | Replace the business dashboard. |
| `/admin/ops/billing` | Money flow health: payments today, refunds, failed cards, recovery state. | Show MRR/ARR (that's `/admin/payments`). |
| `/admin/ops/platform` | Infrastructure health: cron, queues, DLQs, webhook latency. | Show member or revenue metrics. |
| `/admin/ops/customer` | Customer-base health: failed payments, awaiting card update, pending cancellations, churn, recoveries, new joiners by tier. | Re-define M1/M5 — must consume canonical helpers. |
| `/admin/ops/email` | Email lifecycle: send queue, suppression, DLQ, deliverability. | Manage transactional templates (that's a code change). |
| `/admin/ops/activity` | Chronological global event stream. | Filter or summarise — that's the Flight Recorder. |
| `/admin/ops/alerts` | Open / recent alerts feed with ack, mute, notes. | Render raw enum kinds or JSON contexts (use `humaniseAlert`). |
| `/admin/ops/member/$userId` | **The Flight Recorder** — every operationally significant event for one member. | Render anything not in the canonical timeline provider. |
| `/admin/reconciliation` | Row-level audit of the canonical metrics. Operators come here when a number on `/admin` looks wrong. | Replace `/admin` — link, don't duplicate. |
| `/admin/professionals` | The register: search, filter, list, row actions including **Open timeline**. | Show subscription state ahead of identity state. |
| `/admin/memberships` | Subscription-by-subscription view of paying + scheduled members. | Re-derive M1 — consume canonical collection. |
| `/admin/payments` | Subscription product metrics (MRR/ARR, recent events, failed payment list). | Operational queues — those live under `/admin/ops/billing`. |
| `/admin/churn` | Churn lifecycle stages and recovery flow. | Re-define terminal stages — use `TERMINAL_CHURN_STAGES`. |
| `/admin/webhook-recovery` | The 27 / N "missing Stripe ID" cohort and the `/renew/$token` flow. | Be confused with `/admin/ops/billing` — recovery is operator-driven; billing health is automated. |
| `/admin/support` | Tickets queue + thread view. | Manage email templates. |
| `/admin/reviews` | Review moderation queue. | Re-implement publishing — that's the trigger. |
| `/admin/verification` | The 3-pillar linear workspace (ID → Qual → Insurance). | Skip the AI insurance step — use the existing Gemini pipeline. |
| `/admin/team` | Add/remove admins. | Be the source of role checks — `has_role` is. |
| `/admin/settings` | Platform-wide knobs: feature flags, etc. | Per-member configuration. |

## 4 · Frozen operations architecture

- **One alert evaluator**: `public.ops_alerts_evaluate()` runs every 5 min
  via `pg_cron`. New alert kinds MUST be added there AND in
  `src/lib/ops/alert-humanizer.ts` in the same PR.
- **Alerts surface**: `/admin/ops/alerts` is the only place where raw
  `ops_alerts` rows are user-facing. Everywhere else uses
  `humaniseAlert(kind, context)`.
- **Member Timeline (Flight Recorder)** is the canonical operational
  view of an individual member. Reached via the `OpenTimelineLink`
  primitive (`src/components/admin/primitives/OpenTimelineLink.tsx`).
- **Activity stream** (global) ≠ **Flight Recorder** (per-member). Both
  source the same underlying events but serve different operator
  questions and MUST stay separate routes.
- **MemberFinder** is the universal "jump to any member" control. It is
  promoted into `OpsSubNav` / dashboard chrome — not duplicated.

## 5 · Promoted admin primitives

The following primitives are the **complete** set extracted by the
Admin v2 pass. No others. New shared UI must justify why it should be
promoted alongside these.

| Primitive | Location | Purpose |
|---|---|---|
| `DashboardShell` | `src/components/dashboard/DashboardShell` | Outer chrome (sidebar, header, search, role gate). |
| `OpsSubNav` | `src/components/ops/OpsSubNav.tsx` | Sticky strip across `/admin/ops/*`. |
| `MemberFinder` | `src/components/ops/MemberFinder.tsx` | Universal member jump. |
| `SystemStatusStrip` | `src/components/ops/SystemStatusStrip.tsx` | Stripe / Mailgun / Storage probes. |
| `OpenTimelineLink` | `src/components/admin/primitives/OpenTimelineLink.tsx` | Canonical "Open member timeline" action; inline + button variants. |
| `StatTile`, `AdminCard`, `PanelHeader`, `PCard`, `PPanel`, `RangePill`, `Delta` | `src/components/admin/*` | KPI / panel composition. |
| `PeriodSelector` | `src/components/admin/PeriodSelector.tsx` | Period range on `/admin`. |
| shadcn `AlertDialog` | `@/components/ui/alert-dialog` | Confirm destructive actions. `window.confirm` is banned. |
| shadcn `Chart` | `@/components/ui/chart` | All Recharts wrappers go through this. |
| shadcn `Table`, `DropdownMenu`, `Sheet`, `Dialog`, `Badge`, `Empty` | `@/components/ui/*` | All admin lists / row actions / menus. |
| `humaniseAlert` | `src/lib/ops/alert-humanizer.ts` | Operator-facing label/summary/CTA for every `ops_alerts.kind`. |
| `fetchActivePayingMemberCollection` | `src/lib/members/active-paying-member.ts` | The single source for M1 / M4 across every admin surface. |
| `FAILED_PAYMENT_STATUSES`, `TERMINAL_CHURN_STAGES` | `src/lib/admin/metrics-definitions.ts` | Canonical predicates — no inline forks. |

## 6 · Rules for future admin changes

No further admin restructuring after this pass unless there is:

1. **A production bug.** File a fix scoped to the bug. Don't reshape
   adjacent surfaces.
2. **A security issue.** Same — scope it.
3. **A revenue-impacting issue.** Document the dollar impact in the PR
   description.
4. **Proven operator pain from real usage.** Cite the operator and the
   pain. Anecdote is not enough; show the missed action or the wasted
   minutes.

What is explicitly **off the table** unless one of the above triggers:

- Renaming canonical metrics (use the registry).
- Inventing new sidebar groups.
- Building a parallel admin (`/admin-v3`, etc.).
- Promoting more primitives "just in case".
- Merging or splitting the named pages in §3.

What is **always fine** without triggering this rule:

- Adding a new column to an existing table.
- Adding a row action that uses an existing primitive
  (e.g. `OpenTimelineLink`) to an existing list.
- Adding a new alert kind (with its humaniser and `ops_alerts_evaluate`
  entry in the same PR).
- Wiring a new surface for an existing canonical metric.
- Editing copy and subtitles to be clearer.

## 7 · Companion artifacts

- `docs/admin-v2/00-deviations.md` — what we knowingly did not implement
  from the spec.
- `docs/admin-v2/REPS-admin-v2-complete-spec.md` — the full architecture
  contract.
- `docs/11_admin_metric_registry.md` — the binding metric registry.
- `src/lib/admin/metrics-definitions.ts` — canonical predicates &
  constants.
- `src/lib/members/active-paying-member.ts` — canonical M1/M4 model.
- `src/lib/ops/alert-humanizer.ts` — operator-facing alert copy.
- `src/components/admin/primitives/OpenTimelineLink.tsx` — Flight
  Recorder entry point.
