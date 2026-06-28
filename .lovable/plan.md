# Admin Remediation Plan — From 67/100 to Freeze

Goal: close every P0/P1 from the audit, ship the must-have polish, then freeze admin architecture and shift to customer-facing work. No changes to billing, webhook, renewal, churn, reconciliation, recovery business logic.

Delivered in three waves so you can ship, test, and decide whether to continue before each one.

---

## Wave 1 — Safety + Quick Wins (half a day)

Hard safety fixes and the 30-min nav cleanups. Highest impact per minute.

**Safety (P0)**
1. AlertDialog confirmation on **Delete professional** (`/admin/professionals` row action).
2. AlertDialog confirmation on **Suspend professional**.
3. AlertDialog confirmation on **Migration → Seed all**.
4. Replace `window.confirm()` on **Webhook recovery → Live replay** with AlertDialog.
5. Add a top "⚠️ Placeholder data — not connected yet" banner to `/admin/cpd`.
6. Add "⚠️ Editing not yet available" notice to `/admin/settings`; collapse non-working tabs to disabled.

**Navigation cleanup (P1, all ~5 min each)**
7. Add `/admin/webhook-recovery` to sidebar under Operations.
8. Add `/admin/reconciliation` to sidebar under Revenue.
9. Remove "Health" from sidebar (route stays as redirect).
10. Fix `active="Churn"` on webhook-recovery → `active="Operations"`.
11. Fix `active="Overview"` on reconciliation → new `active="Reconciliation"`.
12. Health banner on `/admin` links straight to `/admin/ops/platform` (no redirect hop).
13. Hide "Crawl alerts" placeholder panel in `/admin/directory`.
14. Fix campaigns queryKey namespace `"support"` → `"admin"`.

**Sidebar re-group** to the structure in §2 of the report:
`OVERVIEW · MEMBERS & PROS · REVENUE · CONTENT & DISCOVERY · OPERATIONS · SYSTEM`.

---

## Wave 2 — Operational Gaps (3–4 days)

The audit's P1 list — turning read-only screens into screens an operator can act from.

1. **Persistent ops sub-nav strip** (`Billing | Platform | Customer | Emails | Activity | Alerts`) visible across all `/admin/ops/*` pages, plus a back-to-Ops breadcrumb in `DashboardShell` for the admin role. Kills the 2-click hub bounce.
2. **`/admin/ops/customer` drill-downs** — every tile links to a filtered member list (Churn → `/admin/churn`, Failed renewals → `/admin/ops/billing?kind=failed_active`, etc.).
3. **`/admin/ops/billing` failed_active recovery** — inline "Send recovery email" action on drill rows; humanise drill-table titles (enum → label); add Refresh button.
4. **`/admin/ops/email` suppression management** — remove-from-suppression action, paginate suppression list, "Clear filters" button, DLQ retry/requeue action, link DLQ tile from platform → email filtered view.
5. **`/admin/churn` actions** — "Send nudge" per-row, link to Campaigns for bulk win-back, tabs: Lifecycle | Win-back | Recovery actions.
6. **`/admin/reviews`** — default sort surfaces AI-suspect verdicts first.
7. **`/admin/payments` Export** — wire the broken export button.
8. **Verification workspace** — "Approve & next" button, keyboard shortcuts (j/k/a/r) matching support.
9. **Support → Member 360 link** — "Open member timeline →" from every ticket.
10. **Campaigns** — recipient-count preview in compose dialog + send confirmation step.

---

## Wave 3 — Consolidation + Freeze (2–3 days)

Resolve the structural duplication called out in §5 and §10 of the report, then freeze.

1. **Canonical revenue page** — merge `/admin/memberships` into `/admin/payments` as a "Forecast" tab; retire memberships route. `/admin` keeps business KPIs, `/admin/ops/billing` keeps operational. Document each KPI's source of truth in `metrics-definitions.ts`.
2. **"Open member timeline" everywhere** — professionals row actions, billing drill rows, churn rows, activity stream events. Standard primitive.
3. **Alert humanisation** — map `kind` enums to display labels + descriptions, summarise `context` JSON as plain English, add severity filter.
4. **Activity stream polish** — truncation warning at 500 cap, text search, member-event deep links.
5. **Freeze marker** — write `mem://admin/freeze-2026-06` capturing: sidebar structure, ops sub-nav, KPI source-of-truth map, list of pages that may not be restructured without explicit ask. Add the same lock note to the audit report.

Explicitly **out of scope** (per audit §10 large redesigns — defer unless you ask):
- Unified `/admin/member/$userId` 360 view (cross-tab Profile/Billing/Timeline/Support/Verification).
- Churn → full Retention Centre (cohort analysis, funnel viz).
- `/admin/cpd` real-data wiring (banner only until CPD product scope is decided).
- `/admin/settings` editability (notice only).

---

## Technical Notes

- Sidebar source of truth: `src/components/dashboard/nav-data.ts` (`ADMIN_NAV`) + `AdminActive` union in `src/components/dashboard/DashboardSidebar.tsx`. Adding sidebar entries needs both updated.
- Confirmation dialogs: use existing shadcn `AlertDialog` primitive — do not roll a new one.
- Ops sub-nav: implement once as `<OpsSubNav />` in `src/components/ops/`, render from each `/admin/ops/*` page header (or the `admin_.ops.tsx` parent if we accept always-rendered chrome).
- Drill-downs: use existing `?kind=` URL-param pattern from `/admin/ops/billing` for consistency.
- Suppression removal: needs a server fn calling Resend's suppression API + local `email_suppressions` row delete; HMAC-protected DLQ retry endpoint already exists under `/api/public/ops/*` — reuse, don't fork.
- Reuse `MemberFinder` for the "Open member timeline" links — already production-grade.
- No migrations expected in Wave 1; Waves 2–3 may need 1–2 small ones (suppression actions audit log, freeze metadata) — flagged before applying.

---

## Decision Points

- **After Wave 1**: ship & confirm; decide whether to continue. Wave 1 alone closes every P0 and most of the §8 quick-wins list.
- **After Wave 2**: ship & confirm; this is the point at which the admin is operationally complete.
- **After Wave 3**: freeze admin, redirect engineering effort to the customer-facing product as you described.

Shall I start Wave 1?
