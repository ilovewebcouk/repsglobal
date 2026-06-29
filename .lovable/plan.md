## Admin v2 — Full Architecture Map + Stripe Billing Truth + Public Visibility + Single Delete Action

A **read-only-first**, non-destructive QA and ordering pass over the entire admin platform. Billing stays untouched until the audit is approved — current billing behaviour is the best it's been, so this plan only proposes changes after evidence is on the table. Final deliverable is one consolidated report plus the prioritised rebuild order.

---

### Phase 0 — Guardrails (before anything)

- **No DB writes, no Stripe mutations, no email sends, no cron edits, no deletions, no visibility flips** until Phase 1 + Phase 2 reports are reviewed and approved.
- All reports and CSVs land under `/mnt/documents/admin-v2/` so they're downloadable; markdown reports also committed to `docs/admin-v2/`.
- Playwright screenshots land in `/mnt/documents/admin-v2/screenshots/`.

---

### Phase 1 — Full Admin Architecture Map (read-only)

Produce **the** map of what the admin is today.

**Markdown**
- `docs/admin-v2/admin-architecture-map-2026-06-29.md`
- `docs/admin-v2/admin-route-dependency-graph.md` (Mermaid graph: routes → server fns → tables → Stripe objects)

**CSVs** (one row per item, all 30 fields per route):
- `admin-architecture-map.csv` — every admin route (full list from your spec: `/admin`, `/admin/professionals`, `/admin/memberships`, `/admin/members/{id}`, `/admin/churn`, `/admin/payments`, `/admin/reconciliation`, `/admin/ops`, `/admin/ops/billing`, `/admin/ops/customer`, `/admin/ops/member/{id}`, `/admin/webhook-recovery`, `/admin/migration`, `/admin/settings`, `/admin/directory`, `/admin/reviews`, `/admin/verification`, `/admin/support`, `/admin/cpd`, `/admin/gyms`, `/admin/campaigns`, `/admin/team`, `/admin/billing`, `/admin/health`) with: route path, file, parent layout, page component, child components, server fns called, hooks, Supabase tables read/written, Stripe objects read/written, cron/webhook deps, KPIs, charts, tables, action buttons, role checks, public-visibility deps, billing/verification/review/support deps, canonical-resolver use, public-visibility-fn use, BD/legacy references, free-tier references, duplication, keep/merge/archive/delete/rebuild verdict, screenshot path, known issues, required fixes.
- `admin-kpi-map.csv` — every KPI (page, component, server fn, query, source-of-truth, Stripe object/event, table, date window, filters, tier-breakdown support, free-tier leakage, BD/legacy leakage, pass/fail).
- `admin-chart-map.csv` — every chart (page, component, data fn, source query, date grouping, tier grouping, tooltip implementation, tokens, contrast issues, Core/Pro/Studio split present, pass/fail).
- `admin-action-button-map.csv` — every action button (label, page/component, fn, side effects, Stripe/DB/email/cron mutations, destructive?, confirmation?, audit-log?, keep/remove/simplify). Explicitly include the four Member 360 destructive buttons (close + end trial, cancel + close, cancel now + close, delete account) with current behaviour + collapse proposal.
- `admin-server-function-map.csv` — every file under `src/lib/admin/**`, `src/lib/ops/**`, `src/lib/billing/**` (exports, callers, tables R/W, Stripe deps, canonical-resolver use, BD/legacy use, keep/refactor/archive/delete).
- `admin-component-map.csv` — every component under `src/components/admin/**`, `src/components/ops/**` (rendered where, props, renders KPIs/charts/tables/actions, contains billing logic, contains legacy language, keep/refactor/delete).

**Sweeps** (via `rg`): `/admin`, `createFileRoute`, `createServerFn`, `KPICard`, `Chart`, `subscriptions`, `payment_events`, `disputes`, `churn_lifecycle`, `professionals`, `reviews`, `support`, `legacy_stripe_link`, `bd_member_seed`, `Brilliant`, `BD`, `migrated`, `verified_annual`, `free`, `delete account`, `cancel and close`, `close member account`, `reconcile`. Each hit classified: remove now / archive only / debug-only / docs-only / UNSAFE active reference / user-facing violation.

**Screenshots** via Playwright (logged-in admin session): every admin route in the list, plus Jordon Gumbley + Richard Bennett Member 360, KPI tooltip closeups, Member 360 destructive-action set, public directory state.

**Final section of the architecture report:**
- What the admin currently consists of
- Which files power each page
- Trustworthy pages
- Duplicated pages
- Pages with legacy logic
- Pages to merge
- Pages to archive
- Pages to delete
- Files safe to refactor
- Files dangerous to touch
- Exact rebuild order

**Gate**: stop here. Nothing else proceeds without user sign-off on the map.

---

### Phase 2 — Stripe Billing Source-of-Truth QA (still read-only)

`docs/admin-v2/stripe-billing-overview-final-qa-2026-06-29.md` + CSVs:
- `billing-source-map.csv` — Active Paying Members, Core/Pro/Studio counts, Revenue Received, Total Revenue, Projected Cash, Forecast, Member Growth, Failed, Recoveries, Cancelling, Hidden, Public Visible: source of truth, Stripe object/event, local cache, server fn, page, BD/legacy involvement, removal verdict.
- `overview-kpi-source-audit.csv`, `overview-chart-tier-breakdown-audit.csv`
- `member-entitlement-final-audit.csv` — every user classified: active paid / scheduled paid / cancelling-in-period / failed / canceled / no-sub / free / test/demo / admin / manual review. `delete_candidate` flag (proposal only, no action).
- `no-subscription-delete-candidates.csv`, `free-tier-audit.csv`
- `brilliant-bd-legacy-reference-sweep.csv` (from Phase 1 sweep + active-vs-archive classification)
- `public-visibility-audit.csv` — for every published professional, why they're public; flag free / no-sub / lapsed publicly visible.
- `member360-billing-qa.csv` — per-user: real Stripe sub id, customer id, price id (`price_…` vs `verified_annual` alias), tier, status, current_period_end, cancel_at_period_end; flag pill/label inconsistencies.
- `stripe-payment-integrity-audit.csv` — webhook coverage (`invoice.payment_succeeded/failed`, `customer.subscription.created/updated/deleted`, `charge.dispute.*`, refunds) vs mirror state.

**Gate**: stop here. No mutations.

---

### Phase 3 — Conservative Overview rebuild (non-destructive, opt-in per change)

Only after Phase 1+2 are approved. Each change is small, reversible, and ships behind UI-only edits where possible.

- `OverviewKpis.tsx`: remove "Reconcile →" chips from KPI tiles; add small muted source subtitle ("Stripe subscriptions" / "Stripe payments" / "Stripe forecast" / "Net Stripe growth"). No KPI math changes.
- `RevenueAndMembership.tsx` + `overview.functions.ts`: extend loader to return per-tier series. Add Core/Pro/Studio split to Member Growth (stacked lines), Revenue Received (stacked bars), and Forecast (stacked). Per-tier tooltip with totals.
- Tooltip contrast fix using existing tokens (`bg-reps-panel text-white border border-white/10`).
- **No removals of existing KPI math.** Tier split is additive.

---

### Phase 4 — Member 360 billing surface fixes (read-side only)

- Surface real `stripe_price_id` (`price_…`), not the `verified_annual` alias. When mirror holds the alias, resolve via Stripe in `member-stripe-sync.server.ts` and backfill mirror row. No deletions.
- Snapshot displays: Stripe Sub id, Customer id, Price id, tier, amount, interval, status, current_period_end, cancel_at_period_end, single source badge.
- Collapse confusing duplicate pills in Current Subscription to **one** label: `Existing paid period — renews {date}` (for trialing-as-scheduled-renewal) or `Scheduled Core renewal — renews {date}`. Never "Trial user" / "Free trial".
- Verify Jordon Gumbley and Richard Bennett render identically across `/admin/memberships`, `/admin/professionals`, M360, `/admin/churn`, `/admin/ops/billing`, `/admin/billing`, and public profile.

---

### Phase 5 — Canonical public-visibility contract (additive)

New `src/lib/public/public-visibility.server.ts` exporting `canShowProfessionalPublicly(userId)`:

True iff professional exists, not admin/demo/test/suspended/deleted, Stripe entitlement is one of {active, trialing-paid, scheduled paid, cancel_at_period_end inside current period}, tier ∈ {Core, Pro, Studio}, not manually hidden.

**Rollout is staged behind a feature flag.** Phase-5a wires it into a read-only audit endpoint that diffs current vs proposed visibility (output to `public-visibility-diff.csv`). Phase-5b — only after diff is reviewed — switches directory, search, `/pro/$slug`, profile cards, featured, sitemap, `/r/$token`, gym pages, professions/cities, public APIs to the contract.

---

### Phase 6 — Member 360 destructive-action collapse (single Delete account)

In `admin_.members.$userId.tsx`:
- Remove the four overlapping buttons (close + end trial, cancel + close, cancel now + close, delete account).
- Keep **one** Danger Zone action: **Delete account**.
- Modal requires typing the member's email (or `DELETE`) to enable.
- Calls existing `cancelAndDeleteMember` (cancels Stripe → archives email → deletes auth user) and additionally: revokes entitlement immediately, hides profile via Phase 5 contract, writes `admin_audit_log`, preserves invoice/dispute/audit records.
- Remove standalone `MemberCancelCard` from support tickets; link to Member 360 Danger Zone instead (one canonical path).

---

### Phase 7 — Brilliant / BD / legacy sweep removal (active code paths only)

Using `brilliant-bd-legacy-reference-sweep.csv`:
- Remove BD/legacy reads from active billing / visibility / KPI / forecast paths.
- Retire `legacy-renewal` cron route + `bd_member_seed` / `legacy_stripe_link` reads from admin UI (tables stay as archive; no UI surface).
- Strip user-facing strings: "Brilliant", "Legacy", "Migrated", "Verified" as tier (use Core), "Trial user", "Free trial".
- Leave `docs/admin-v2/*` historical files untouched.

---

### Phase 8 — Stripe webhook / payment integrity re-audit (verify, don't rewrite)

Confirm `src/routes/api/public/stripe/*` handles: `invoice.payment_succeeded/failed`, `customer.subscription.created/updated/deleted`, `charge.dispute.*`, refunds. Verify canceled/lapsed/incomplete_expired/unpaid → visibility-false via Phase 5 contract; disputes write only to `public.disputes`; failed payments surface in `/admin/billing` + Churn; mirror stays in sync. Fix only the gaps the audit finds.

---

### Phase 9 — Next-pass plan for Member 360 Profile + Reviews panes (plan only)

`docs/admin-v2/member360-next-pass-plan.md` covering: Profile pane (preview, completeness, image, bio, location, specialisms, quals, directory state, edit links) and Reviews pane (count, avg, latest, pending, flagged, moderation actions, timeline) + activity-timeline integration. No code in this phase.

---

### Phase 10 — Final consolidated report

`docs/admin-v2/admin-final-report-2026-06-29.md` pulling everything together:
- Architecture map summary + rebuild order
- Billing source-of-truth verdict
- Overview rebuild result with before/after screenshots
- Member 360 fixes (price id, pill collapse, Jordon + Richard parity)
- Public visibility contract diff and rollout state
- Destructive action collapse summary
- BD/legacy sweep results
- Webhook integrity verdict
- Outstanding risks + recommended next sprint

---

### Acceptance

- Every admin route, KPI, chart, action button, server fn, component, Stripe dep, Supabase table dep, BD/legacy ref, free-tier ref, destructive action, and duplicate surface is mapped in the CSVs.
- Final report contains the rebuild order.
- Stripe is the documented source of billing truth; current billing behaviour preserved unless an audit-backed change was explicitly approved.
- Overview KPIs + 3 charts segmented by tier with readable tooltips; no Reconcile chips.
- M360 shows real Stripe price id; one clear status label; Jordon + Richard verified.
- One **Delete account** action everywhere; Stripe cancelled + profile hidden + entitlement revoked + audit logged.
- `canShowProfessionalPublicly` used by every public surface (after diff approval); zero free / no-sub public profiles.
- Zero active code paths reference Brilliant/BD/legacy/Verified-as-tier; archive tables untouched.
- Typecheck passes; Playwright screenshots stored.

### Notes on safety

- Billing math, cron schedules, and webhook handlers are not modified in Phases 1–2.
- Public-visibility switch is gated by a reviewed diff (Phase 5a → 5b).
- BD/legacy archive tables are preserved; only their use in active UI is removed.
- All destructive admin actions (Phase 6) require typed confirmation + audit log.
