
# Platform Overview — 4 Canonical KPIs

Move `/admin` from "metric dashboard" to "operational decision surface". Four KPIs, one definition each, one source of truth, one reconciliation table per KPI. Historical and forecast windows are kept strictly separate.

## 1. Canonical metric definitions (single source of truth)

Create `src/lib/admin/metrics-definitions.ts`. Every KPI calculation in overview AND reconciliation must import from this module — no duplicate logic anywhere.

| KPI | Definition | Source of truth | Window |
|---|---|---|---|
| Active Members | Distinct `user_id` with a `subscriptions` row where `environment='live'`, `status IN ('active','trialing')`, `tier IN ('verified','pro','studio')`. Tier deduped by rank studio>pro>verified. | `subscriptions` | Point-in-time (now) + joins/churns within the selected historical window |
| Revenue Received | Sum of pence for unique payments (deduped by `payment_intent` → `charge` → `object id`) from `payment_events`, preferring `invoice.payment_succeeded` over `charge.succeeded`. Refunds netted on standalone charges. | `payment_events` | Selected historical window |
| Projected Cash Due | Three-source forecast (active subs `current_period_end`, then `legacy_stripe_link.access_expires_at`, then `bd_member_seed.bd_next_due_date`), deduped by user/member. Amount per row = production renewal engine's per-tier price. | `subscriptions` ∪ `legacy_stripe_link` ∪ `bd_member_seed` | **Independent forecast horizon** |
| Net Member Growth | Joined − Churned in the selected historical window. Joined = first paid subscription `created_at` per user inside window. Churned = `churn_lifecycle` rows whose stage entered a terminal state (`churned`/`final`) inside window. | `subscriptions` (joins) + `churn_lifecycle` (churns) | Selected historical window |

All four definitions exported as pure functions that take the raw rows and a window, and return `{ value, supportingRows }`. Reconciliation tags each supportingRow with `included_in_total` and `exclusion_reason` exactly as today.

## 2. Independent forecast horizon

Top bar:
- **Historical period selector** (existing): drives KPIs 1, 2, 4 and all charts that show actuals.
- **Forecast horizon selector** (new, lives on the Projected Cash Due card only): `Remaining this month`, `Next month`, `Next 30 days`, `Current quarter`, `Current year`, `Custom`.

`overview-period.ts` gains a `forecastWindowFor(horizon)` helper. The historical `from/to` is never reused for forecast math — enforced by `getAdminOverview` accepting two distinct window params.

## 3. KPI cards (new layout)

```text
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Active Members   │ Revenue Received │ Projected Cash   │ Net Member Growth│
│ 1,247            │ £12,480          │ Due              │ +34              │
│ +34 net (period) │ (period)         │ £41,560          │ Joined 52        │
│ ↳ Joined 52      │ Reconcile →      │ [horizon ▾]      │ Churned 18       │
│ ↳ Churned 18     │                  │ Reconcile →      │ Reconcile →      │
│ Reconcile →      │                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

Registrations is demoted: removed from headline tiles, kept as a small chart in the supporting section and exposed in the reconciliation page.

## 4. Reconciliation-first rollout (no calc changes until reconciliation proves the numbers)

Order of operations is strict:

1. **Phase A — Reconciliation parity.** Refactor `reconciliation.functions.ts` to import from `metrics-definitions.ts`. Add Net Member Growth section (Joined table + Churned table, each with included/excluded rows and reasons). Verify on `/admin/reconciliation` that the four KPIs match the *current* overview byte-for-byte before touching the overview.
2. **Phase B — Overview swap.** Change `getAdminOverview` to call the same `metrics-definitions.ts` functions. Numbers must not move. Swap the tile layout to the four canonical tiles. Move Registrations into the supporting charts block.
3. **Phase C — Forecast horizon.** Add the horizon selector to the Projected Cash Due tile, plumb a second window through `getAdminOverview`, mirror it in reconciliation's Forecast section.
4. **Phase D — Churn wiring.** Confirm `churn_lifecycle` terminal transitions are timestamped; if not, add a `churned_at` column (set by the existing stage trigger) so the Churned half of Net Member Growth is row-traceable.

## Dashboard principles (enforced in code review)

- One canonical business definition — lives in `metrics-definitions.ts`.
- One source of truth — listed in the table above.
- One reconciliation table per KPI — Active Members, Revenue Received, Projected Cash Due (already exists), Net Member Growth (new).
- Every number traceable — `included_in_total` + `exclusion_reason` on every supporting row.
- No duplicate business logic — `getAdminOverview` and `getXxxReconciliation` both call the shared module; lint rule (or PR check) forbids re-implementing tier/price/window math elsewhere.
- Historical and forecast windows never share the same selector.

## Technical notes

- `metrics-definitions.ts` is server-only logic but lives in `src/lib/admin/` (not `*.server.ts`) so both `overview.functions.ts` and `reconciliation.functions.ts` can import it. It contains no Supabase client — callers pass in already-fetched rows so the same pure functions power both endpoints.
- Forecast horizon state is a URL search param on `/admin` (e.g. `?fcast=next_30d`), validated with `fallback(z.enum([...]), 'next_30d')`. The historical `period` param stays as-is.
- Churn detection: `churn_lifecycle.stage` transitions to `churned`/`final` — add `churned_at timestamptz` if missing, populated by the existing stage-transition trigger. Until that exists, Net Member Growth's "Churned" half reads zero with a "data not yet wired" badge instead of guessing.
- No new KPIs are added. Forecast Revenue is renamed to Projected Cash Due to match the operational framing.
- Reconciliation deep-links from each tile (`/admin/reconciliation#active-members` etc.) — same pattern as today.

## Out of scope

- New visualisations or charts beyond moving Registrations into the supporting block.
- Changing the production renewal engine (forecast must mirror it, not modify it).
- Cohort/LTV/MRR analytics — those are future, separate KPIs.
