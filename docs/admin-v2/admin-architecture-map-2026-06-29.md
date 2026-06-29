# REPS Admin — Architecture Map (Phase 1, read-only)

**Date:** 2026-06-29
**Scope:** Every admin route, page, component, server function, KPI, chart, action button, and Stripe/Supabase dependency that the admin dashboard currently relies on.
**Status:** Read-only audit. No code, DB, Stripe, email, cron or visibility changes made. This document is the **Phase 1 gate** of the approved plan in `.lovable/plan.md`.

CSV deliverables live alongside this report at `/mnt/documents/admin-v2/` and link from each section.

---

## 1. Sidebar today (9 links)

From `src/components/dashboard/nav-data.ts` (admin role):

| Group | Link | Route |
|---|---|---|
| — | Overview | `/admin` |
| Members | Professionals | `/admin/professionals` |
| Members | Verification | `/admin/verification` |
| Members | Reviews | `/admin/reviews` |
| Revenue | Billing | `/admin/billing` |
| Discovery | Directory | `/admin/directory` |
| Discovery | Gyms | `/admin/gyms` |
| Discovery | CPD | `/admin/cpd` |
| System | Operations | `/admin/ops` |
| System | Support | `/admin/support` |
| System | Campaigns | `/admin/campaigns` |
| System | Team | `/admin/team` |
| System | Settings | `/admin/settings` |

`Memberships`, `Churn`, `Payments`, `Reconciliation`, `Health` no longer exist as standalone links — their route files are thin redirects to `/admin/billing` or `/admin/ops/platform`. Member 360 (`/admin/members/{id}`) is reachable from the Professionals list and `MemberFinder`, not the sidebar.

## 2. Route inventory (24 files)

Full per-route detail in [`admin-architecture-map.csv`](/mnt/documents/admin-v2/admin-architecture-map.csv) with all 30 fields. Summary verdicts:

| Verdict | Count | Routes |
|---|---|---|
| KEEP as-is | 12 | `/admin/ops`, `/admin/ops/alerts`, `/admin/ops/activity`, `/admin/ops/platform`, `/admin/verification`, `/admin/reviews`, `/admin/cpd`, `/admin/gyms`, `/admin/campaigns`, `/admin/team`, `/admin/billing`, `/admin/ops/email` |
| KEEP + extend | 1 | `/admin` (Phase 3 tier charts) |
| KEEP + simplify | 4 | `/admin/professionals`, `/admin/members/$id`, `/admin/support`, `/admin/directory` |
| ARCHIVE majority of cards | 1 | `/admin/ops/billing` (BD cards) |
| MERGE into Member 360 | 1 | `/admin/ops/customer` |
| DELETE / DEDUPLICATE | 1 | `/admin/ops/member/$userId` (M360 already covers) |
| REDIRECT-only stub | 5 | `/admin/memberships`, `/admin/payments`, `/admin/churn`, `/admin/reconciliation`, `/admin/health` |

## 3. KPIs — source of truth

Full table in [`admin-kpi-map.csv`](/mnt/documents/admin-v2/admin-kpi-map.csv). Highlights:

- **All five Overview KPIs** (Active Paying Members, Revenue Received, Projected Cash, Total Revenue, Member Growth) source from `getAdminOverview` against the `subscriptions` + `payment_events` mirrors — Stripe is the upstream truth. **No KPI currently breaks out Core / Pro / Studio.**
- **Active Paying Members** filter is `status in (active, trialing, past_due) AND tier in (core, pro, studio)` → does **not** count free or no-sub users. ✅
- **Projected Cash** is `current_period_end` window only; correctly excludes free and canceled. ✅
- **Professionals KPIs** include a `Total professionals` tile that counts everyone (including no-sub free rows) — flagged REVIEW.
- **/admin/ops/billing** has 16 health tiles all sourced from Stripe mirrors via `getBillingHealth`. All ✅.

## 4. Charts

Full table in [`admin-chart-map.csv`](/mnt/documents/admin-v2/admin-chart-map.csv). Highlights:

- Four Overview **sparklines** in `OverviewKpis.tsx` use Recharts default tooltips → low-contrast grey text on dark background. Marked WARN. None split by tier.
- The two main Overview charts in `RevenueAndMembership.tsx` (Member Growth + Revenue Received) are **FAIL** for contrast and tier breakdown.
- Forecast chart is a single blue area with no tier explanation.
- `RenewalEngineCard` chart on `/admin/ops/billing` is fine.

## 5. Action buttons — destructive surface

Full table in [`admin-action-button-map.csv`](/mnt/documents/admin-v2/admin-action-button-map.csv). The destructive footprint today:

| Surface | Button | Underlying fn | Audit-log | Decision |
|---|---|---|---|---|
| Member 360 | End trial & close | `cancelAndDeleteMember(end_trial)` | ✅ | COLLAPSE |
| Member 360 | Cancel & close | `cancelAndDeleteMember(period_end)` | ✅ | COLLAPSE |
| Member 360 | Cancel now & close | `cancelAndDeleteMember(immediate)` | ✅ | COLLAPSE |
| Member 360 | Delete account | `cancelAndDeleteMember(delete)` | ✅ | **KEEP — the only one** |
| /admin/professionals row menu | Cancel subscription | `cancelProfessionalSubscription` | ✅ | REMOVE (link to M360) |
| /admin/professionals row menu | Delete professional | `deleteProfessional` | ✅ | REMOVE (link to M360) |
| /admin/support thread | Close account (MemberCancelCard) | `cancelAndDeleteMember` | ✅ | REMOVE (link to M360) |
| /admin/reviews | Remove review | `reviews.functions.remove` | ✅ | KEEP |
| /admin/verification | Reject | `verification.functions.reject` | ✅ | KEEP |

**Important:** All four Member 360 buttons already funnel through the same `cancelAndDeleteMember` fn (which cancels Stripe → archives email → deletes auth user → audit log). They differ only in the `reason` enum passed in. Collapsing them is purely UI work — no business-logic risk.

## 6. Server functions

Full table in [`admin-server-function-map.csv`](/mnt/documents/admin-v2/admin-server-function-map.csv). 31 server-function files under `src/lib/admin/**`. Verdict breakdown:

- **KEEP (16):** `overview`, `professionals`, `member360`, `member-billing-row`, `member-stripe-sync`, `subscription-resolver` (canonical), `billing-actions` (cancelAndDeleteMember only), `billing-console/list`, `resync-stripe`, `team`, `invites`, `impersonation`, `platform-health`, `bd-recrop` (rename), `backfill-price-ids` (one-off), period/metric helpers.
- **REFACTOR (3):** `overview.functions.ts` (drop `bd_member_seed` dep), `professionals.functions.ts` (remove duplicate destructive actions), `billing-actions.functions.ts` (deprecate three of four destructive entry points).
- **ARCHIVE (8):** `reconciliation`, `memberships`, `webhook-recovery`, `webhook-replay`, `stripe-linking`, `bd-migration`, `bd-seed`, `bd-photos`.
- **REVIEW (4):** `payment-recovery` (cron-only, keep if cron stays), `send-relaunch-*` (one-off campaigns), `member-row-check`.

## 7. Components

Full table in [`admin-component-map.csv`](/mnt/documents/admin-v2/admin-component-map.csv). 35 components under `src/components/admin/**` and `src/components/ops/**`. Notable:

- **REFACTOR:** `OverviewKpis.tsx` (Reconcile chips + tier subtitles), `RevenueAndMembership.tsx` (tier stacks + tooltip contrast).
- **DELETE:** `sections/MemberReconciliationStrip.tsx`, `ops/source-pill.tsx`.
- **REMOVE:** `support/MemberCancelCard.tsx`.
- **ARCHIVE:** `ops/BdRailSwapCard.tsx`, `ops/BdSetupLinkCard.tsx`.
- **RENAME:** `BdRecropPanel.tsx` → drop the BD prefix; the photo recrop tool is generally useful.

## 8. Brilliant / BD / legacy reference sweep (raw counts)

`rg -c 'bd_member_seed|legacy_stripe_link|migrated_from_bd|verified_annual|Brilliant'` — top 20 files:

```
src/lib/admin/stripe-linking.functions.ts     30
src/lib/admin/webhook-replay.functions.ts     13
src/lib/admin/webhook-recovery.functions.ts   12
src/lib/billing/convert-legacy.server.ts      12
src/lib/admin/reconciliation.functions.ts      7
src/lib/admin/bd-migration.functions.ts        7
src/routes/api/public/payments/webhook.ts      6
src/lib/admin/bd-seed.functions.ts             6
src/lib/billing/setup-link.server.ts           5
src/lib/admin/bd-recrop.functions.ts           5
src/lib/ops/renewal-engine.functions.ts        4
src/lib/billing.ts                             3
src/lib/admin/overview.functions.ts            3
src/routes/api/public/hooks/lifecycle-cron.ts  2
src/lib/members/active-paying-member.*         2
src/lib/admin/member-stripe-sync.server.ts     2
src/lib/admin/bd-photos.functions.ts           2
```

All references classified in [`admin-server-function-map.csv`](/mnt/documents/admin-v2/admin-server-function-map.csv) → `bd_legacy_use` column. The only active **safety-net** reads we recommend keeping are the per-user `bd_member_seed` Stripe-customer-id lookups in `member-stripe-sync.server.ts` and `member-billing-row.server.ts` — these protect a small cohort whose customer id was never linked to `subscriptions.stripe_customer_id`. Everything else is either an archive table or a one-off migration tool that can be parked behind an `/admin/_legacy/*` route family.

## 9. Free-tier and "no subscription" references

In active billing/UI code (`src/lib/admin/**`, `src/components/admin/**`):

- `tier='free'` appears in 12 files but **only as an exclusion filter** ("not free") — there is no active KPI that counts free users as paying.
- The Professionals total tile is the one ambiguous surface: it does count `tier='free'` rows. Phase 1's recommendation is to split that tile into `Total professionals` (all) and `Paying members` (Stripe) rather than removing it, so admins still see signup counts.

## 10. Screenshots

Captured 2026-06-29 against the running preview at `/admin/*` using the injected admin Supabase session. All screenshots stored in `/mnt/documents/admin-v2/screenshots/`:

```
overview.png            professionals.png      billing.png           ops.png
ops-billing.png         ops-alerts.png         ops-customer.png      ops-platform.png
verification.png        reviews.png            support.png           directory.png
settings.png            campaigns.png          team.png              gyms.png
cpd.png                 member-360-richard.png
```

All 18 captures completed successfully; no route returned an error overlay during capture.

---

## 11. What the admin currently consists of

- **One canonical Overview** (`/admin`) with five KPI tiles and two main charts.
- **One canonical Billing console** (`/admin/billing`) that already absorbs Memberships, Payments, Disputes, Refunds and renders directly from a live Stripe resync on mount.
- **One canonical Member 360** (`/admin/members/$id`) that does a per-user live Stripe pull on load and shows snapshot + timeline + destructive actions.
- **An Operations hub** (`/admin/ops` with five sub-pages) that today is a mix of useful steady-state surfaces (alerts, activity, platform health, email) and BD migration cards.
- **Domain pages** for Verification, Reviews, Support, Directory, Gyms, CPD, Campaigns, Team, Settings — all kept.
- **Five legacy redirect stubs** (Memberships, Payments, Churn, Reconciliation, Health) that exist only to preserve old bookmarks.

## 12. Trustworthy pages (safe to use as the spine of v2)

`/admin`, `/admin/billing`, `/admin/members/$id`, `/admin/professionals`, `/admin/verification`, `/admin/reviews`, `/admin/support`, `/admin/campaigns`, `/admin/team`, `/admin/settings`, `/admin/ops/platform`, `/admin/ops/alerts`, `/admin/ops/activity`, `/admin/ops/email`.

## 13. Pages with active legacy / duplication

| Page | Issue | Disposition |
|---|---|---|
| `/admin/ops/billing` | Hosts `BdRailSwapCard`, `BdSetupLinkCard`, `PriceIdBackfillCard` + duplicates billing tiles | Phase 7 — strip BD cards, keep RenewalEngine, SiteTime, Health |
| `/admin/ops/customer` | Functionality overlaps Member 360 | Phase 9 — fold into M360 |
| `/admin/ops/member/$id` | Pure duplicate of `/admin/members/$id` timeline | Phase 9 — redirect |
| `/admin/professionals` row menu | Has standalone Cancel/Delete destructive actions | Phase 6 — remove, link to M360 |
| `/admin/support` thread | `MemberCancelCard` duplicates M360 Danger Zone | Phase 6 — replace with M360 link |

## 14. Pages to merge / archive / delete

- **Merge:** `/admin/ops/customer` → Member 360 (Phase 9).
- **Archive (route + module behind `/admin/_legacy/`):** `/admin/ops/billing` BD cards, `src/lib/admin/bd-*`, `src/lib/admin/webhook-recovery`, `src/lib/admin/webhook-replay`, `src/lib/admin/stripe-linking`, `src/lib/admin/reconciliation`, `src/lib/admin/memberships`, `src/lib/billing/convert-legacy*`, `src/lib/billing/setup-link.server.ts`.
- **Delete:** redirect stubs can stay (cheap), but `sections/MemberReconciliationStrip.tsx` and `ops/source-pill.tsx` are no longer referenced and should be removed.
- **Rename:** `BdRecropPanel.tsx` → `PhotoRecropPanel.tsx`.

## 15. Files safe to refactor

- `src/components/admin/sections/OverviewKpis.tsx`
- `src/components/admin/sections/RevenueAndMembership.tsx`
- `src/lib/admin/overview.functions.ts`
- `src/routes/admin_.members.$userId.tsx` (Billing actions block)
- `src/routes/admin_.professionals.tsx` (row menu only)
- `src/components/admin/support/MemberCancelCard.tsx` (replace with a link)

## 16. Files dangerous to touch (canonical billing path)

- `src/lib/admin/subscription-resolver.server.ts`
- `src/lib/admin/member-billing-row.server.ts`
- `src/lib/admin/member-stripe-sync.server.ts`
- `src/lib/admin/billing-actions.functions.ts` — keep `cancelAndDeleteMember` 100% intact; only the UI entry points collapse.
- `src/lib/admin/billing-console/list.functions.ts`
- `src/lib/admin/resync-stripe.functions.ts`
- `src/routes/api/public/payments/webhook.ts`

Billing math, cron schedules, and webhook handlers stay untouched until Phase 8 verifies them.

## 17. Exact rebuild order

1. **Phase 2 — Billing source-of-truth QA** (`stripe-billing-overview-final-qa-2026-06-29.md` + 8 CSVs). Still read-only.
2. **Phase 3 — Overview UI polish.** Drop Reconcile chips; add per-tier stacks to Member Growth, Revenue Received, Forecast; rebuild tooltip with `bg-reps-panel` tokens. Loader extends but does not change existing KPI math.
3. **Phase 4 — Member 360 read-side fixes.** Real `price_…` resolution and one consolidated status pill. No destructive-action changes yet.
4. **Phase 5a — Public-visibility contract (diff endpoint).** New `canShowProfessionalPublicly()` plus a read-only diff CSV (`public-visibility-diff.csv`). Stop and review.
5. **Phase 5b — Wire the contract** into directory/search/profile/featured/sitemap/`/r/$token`/gyms/professions/cities/public APIs after the diff is approved.
6. **Phase 6 — Collapse destructive actions** to a single Member 360 Danger Zone `Delete account`; redirect `/admin/professionals` row Cancel/Delete and support `MemberCancelCard` to it.
7. **Phase 7 — BD/legacy sweep.** Move BD cards off `/admin/ops/billing`, archive the eight server-fn files, retire `legacy-renewal` cron (replace with 410 stub), strip user-facing legacy strings.
8. **Phase 8 — Webhook & payment integrity re-audit.** Verify, don't rewrite.
9. **Phase 9 — Member 360 v2 plan only** (Profile + Reviews panes; fold `/admin/ops/customer` and `/admin/ops/member/$id`).
10. **Phase 10 — Final consolidated report** with before/after screenshots and outstanding-risk list.

This order keeps billing behaviour stable through Phases 2–4, validates public visibility behind a reviewed diff, and only removes destructive UI surfaces and legacy cards once the canonical paths are confirmed safe.

---

## Appendix A — File inventory (raw `ls`)

```
src/routes/admin*.tsx (24)
  admin.tsx, admin_.billing.tsx, admin_.campaigns.tsx, admin_.churn.tsx,
  admin_.cpd.tsx, admin_.directory.tsx, admin_.gyms.tsx, admin_.health.tsx,
  admin_.members.$userId.tsx, admin_.memberships.tsx, admin_.ops.activity.tsx,
  admin_.ops.alerts.tsx, admin_.ops.billing.tsx, admin_.ops.customer.tsx,
  admin_.ops.email.tsx, admin_.ops.member.$userId.tsx, admin_.ops.platform.tsx,
  admin_.ops.tsx, admin_.payments.tsx, admin_.professionals.tsx,
  admin_.reconciliation.tsx, admin_.reviews.tsx, admin_.settings.tsx,
  admin_.support.tsx, admin_.team.tsx, admin_.verification.tsx

src/lib/admin (31 files) — see admin-server-function-map.csv
src/lib/ops (12 files)   — see admin-server-function-map.csv
src/lib/billing (12 files) — see admin-server-function-map.csv
src/components/admin (11 + 4 sections + 5 support + 2 campaigns + 1 primitives)
src/components/ops (8 files) — see admin-component-map.csv
```

## Appendix B — Crons / webhooks touching the admin surface

| File | Purpose | Verdict |
|---|---|---|
| `src/routes/api/public/payments/webhook.ts` | Stripe webhook (subs, invoices, charges, disputes, refunds) | KEEP (Phase 8 verify) |
| `src/routes/api/public/hooks/lifecycle-cron.ts` | Daily churn lifecycle nudges | KEEP |
| `src/routes/api/public/hooks/legacy-renewal.ts` | BD legacy renewal cron | RETIRE (return 410) — Phase 7 |
| `src/routes/api/public/hooks/send-scheduled-campaigns.ts` | Scheduled campaign sender | KEEP |
| `src/routes/api/public/ops/alert-dispatch.ts` | Ops alert dispatcher | KEEP |

---

**Phase 1 gate.** No further changes recommended until the Stripe Billing QA (Phase 2) is also delivered and both this map and the billing CSVs are reviewed.
