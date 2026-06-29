## Phase 2 — Stripe Billing Source-of-Truth QA (read-only)

Pure audit. **Zero mutations**: no DB writes, no Stripe API mutations, no emails, no cron edits, no visibility flips, no deletions. Current billing behaviour is preserved exactly.

### Deliverables

**Markdown report** — `docs/admin-v2/stripe-billing-overview-final-qa-2026-06-29.md`
Source-of-truth narrative for every billing concept (Active Paying Members, Core/Pro/Studio counts, Revenue Received, Total Revenue, Projected Cash Flow, Forecast, Member Growth, Failed Payments, Recoveries, Cancelling, Hidden, Public Visible) with: Stripe object/event used, local cache table, server fn, admin page, BD/legacy involvement, and a per-concept verdict (keep / refactor / remove BD path).

**CSVs** (all under `/mnt/documents/admin-v2/`):
1. `billing-source-map.csv` — one row per billing concept × surface.
2. `overview-kpi-source-audit.csv` — every KPI on `/admin` with source, query, filters, tier-split support, free/BD leakage, pass/fail.
3. `overview-chart-tier-breakdown-audit.csv` — Member Growth / Revenue Received / Forecast charts: data fn, grouping, tier-split present?, tooltip contrast, pass/fail.
4. `member-entitlement-final-audit.csv` — **every** user/professional classified: active paid / scheduled paid / cancelling-in-period / failed / canceled / no-sub / free / test/demo / admin / manual review. Columns include user_id, email, professional_id, slug, stripe_customer_id, stripe_subscription_id, stripe_price_id, tier, status, current_period_end, cancel_at_period_end, active_entitlement, public_visible, reason, action_required, **delete_candidate (proposal only)**, admin/demo/test flag.
5. `no-subscription-delete-candidates.csv` — subset of (4) where `delete_candidate=true`. **List only — no deletion.**
6. `free-tier-audit.csv` — anyone visible publicly without a paid/scheduled Stripe sub.
7. `brilliant-bd-legacy-reference-sweep.csv` — every BD/legacy/Brilliant/Verified-as-tier/verified_annual/migrated reference classified: remove-now / archive-only / debug-only / docs-only / UNSAFE active / user-facing violation.
8. `public-visibility-audit.csv` — every published professional + reason they're public; flags free/no-sub/lapsed leaks.
9. `member360-billing-qa.csv` — per active user: real Stripe sub id, customer id, **real `price_…` vs `verified_annual` alias flag**, tier, status, current_period_end, cancel_at_period_end, pill/label inconsistencies.
10. `stripe-payment-integrity-audit.csv` — webhook coverage (`invoice.payment_succeeded/failed`, `customer.subscription.*`, `charge.dispute.*`, refunds) vs `subscriptions` / `payment_events` / `disputes` mirror state.

### Method

- **Code reads** via `rg` + `code--view` over `src/lib/admin/**`, `src/lib/billing/**`, `src/lib/ops/**`, `src/routes/admin*.tsx`, `src/routes/api/public/payments/**` to map every KPI/chart/server-fn to its query.
- **Live DB reads** via `supabase--read_query` (SELECT only) for entitlement classification, price-id alias detection, mirror vs webhook integrity, public-visibility diffs.
- **Live Stripe reads** via a temporary read-only `createServerFn` that lists subscriptions/customers/invoices/disputes per cohort — invoked from a one-off audit script, results dumped to CSV. No Stripe writes.
- **Two specific users force-checked**: Jordon Gumbley (`jgumbley@hotmail.co.uk`) and Richard Bennett — verify Member 360 parity vs `/admin/professionals`, `/admin/billing`, public profile.

### Gate

Stop after deliverables land. Nothing in Phase 3+ runs until you've reviewed the report + CSVs and approved. Billing math, cron, webhooks remain untouched throughout this phase.

### Out of scope (deferred to later phases per `.lovable/plan.md`)

- Overview chart tier-split rebuild → Phase 3
- Member 360 price-id surfacing + pill collapse → Phase 4
- `canShowProfessionalPublicly` contract → Phase 5
- Single Delete account action → Phase 6
- BD/legacy code removal → Phase 7
- Webhook integrity fixes (if any found) → Phase 8
