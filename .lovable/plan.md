
# Phase C — Billing Console

This is the original Phase C from the admin rebuild plan: one billing workbench, four tabs, Stripe as the source of truth, and the scattered surfaces retired. Now built at `/admin/billing` (the `v2` namespace is dead).

Goal: a finance/ops person opens `/admin/billing` and can answer **"are we paid, who's churning, what's disputed, what got refunded"** without leaving the page.

## Information architecture

New layout route `admin_.billing.tsx` with shadcn tabs and pinned KPI strip:

```text
/admin/billing            → redirects to /admin/billing/payments
/admin/billing/payments       (default tab)
/admin/billing/subscriptions
/admin/billing/disputes
/admin/billing/refunds
```

Top of the page (sticky):
- KPI strip: MRR · Active paying · Trialing · Past due · Disputed · Refunded 30d
- Range picker (7d / 30d / 90d / This month / Last month)
- "Open in Stripe" deep link
- Freshness pill ("Mirror updated 12s ago") — reuses Phase A mirror metadata

Every row in every tab links member → `/admin/members/$userId` and customer/sub/charge → Stripe dashboard.

## Tab 1 — Payments

Sourced from the Stripe mirror (`charges` + `payment_intents`) via a new `listPayments` server fn.

Columns: Date · Member (avatar + name → Member 360) · Amount · Status (Succeeded / Failed / Refunded / Disputed) · Method · Stripe charge id (mono, copy + deep link).

Filters: status, range, ≥ amount, search by email / `cus_` / `ch_` / `pi_`.

Empty/error states use the dark `PANEL` token (no shadcn cream).

## Tab 2 — Subscriptions

Replaces `/admin/memberships` entirely. Reads from the same shared `member-billing-row.server.ts` the Members list uses, so renewal date / trial / cancel-at-period-end pills never diverge.

Saved-view chips at the top: All · Trialing · Active · Past due · Canceling · Canceled · Core · Pro · Studio.

Columns: Member · Plan + interval · Status · MRR · Renewal / Trial-ends · Cancel-at-period-end · Stripe sub id.

Row actions menu calls the existing `cancelAndDeleteMember` / `setMemberCancelAtPeriodEnd` / `endMemberTrialNow` server fns (same as Member 360 Billing tab) so behaviour stays identical.

## Tab 3 — Disputes

Reads from `public.disputes` (already wired by the Dispute Lifecycle work).

Columns: Opened · Member · Reason · Amount · Status (`needs_response` / `under_review` / `won` / `lost`) · Due-by · Stripe dispute id.

Inline actions: Open Stripe dispute · Mark evidence submitted · Open Member 360.

Hard-rule banner at the top: "Members in dispute lose good-financial-standing — `payment_standing` already enforces this." No new business logic here, just the surface.

## Tab 4 — Refunds

Read-only refund register from the Stripe mirror.

Columns: Date · Member · Amount · Reason · Refunded by · Original charge.

No "create refund" action yet — refunds still flow through Stripe directly; we record + display.

## Server functions

All under `src/lib/admin/billing-console/`:
- `listPayments.functions.ts` — paginated charges with filters.
- `listSubscriptions.functions.ts` — wraps the shared `member-billing-row` compute for parity with Members list.
- `listDisputes.functions.ts` — selects from `public.disputes` with member joins.
- `listRefunds.functions.ts` — refund register from mirror.
- `getBillingKpis.functions.ts` — single call for the sticky strip.

All `requireSupabaseAuth` + `has_role('admin')`, all dark-token UI, all use `member-billing-row` for any subscription/renewal/trial display so Member 360 ↔ Subscriptions tab ↔ Members list cannot drift.

## Retirements (this turn)

- **`/admin/reconciliation`** — deleted. Numbers reconcile because they come from one resolver; we don't ship a UI to explain discrepancies.
- **`/admin/memberships`** — deleted; redirect to `/admin/billing/subscriptions`.
- **`/admin/payments`** — deleted; redirect to `/admin/billing/payments`.
- **`/admin/ops/billing`** — deleted; ops-side cards (`PriceIdBackfillCard`, `RenewalEngineCard`, `BdSetupLinkCard`) move to `/admin/settings` (operator-only maintenance, not daily admin work).
- **Sidebar (`nav-data.ts`)** — drop Memberships, Stripe, Reconciliation, Churn; add a single **Billing** link pointing at `/admin/billing`. Churn data is already inside Subscriptions (Past due / Canceling chips), so the standalone page goes.

## Out of scope this phase

- Phase D ⌘K command palette
- Phase E `/admin/settings` absorbing ops cards (we move them this turn, but settings tabs come in Phase E)
- Members list saved-view chips (Phase B leftover)
- Any change to email pipeline, webhooks, or cancellation flow

## Files

**New**
- `src/routes/admin_.billing.tsx` (layout + KPI strip + tabs)
- `src/routes/admin_.billing.payments.tsx`
- `src/routes/admin_.billing.subscriptions.tsx`
- `src/routes/admin_.billing.disputes.tsx`
- `src/routes/admin_.billing.refunds.tsx`
- `src/lib/admin/billing-console/listPayments.functions.ts`
- `src/lib/admin/billing-console/listSubscriptions.functions.ts`
- `src/lib/admin/billing-console/listDisputes.functions.ts`
- `src/lib/admin/billing-console/listRefunds.functions.ts`
- `src/lib/admin/billing-console/getBillingKpis.functions.ts`

**Edit**
- `src/components/dashboard/nav-data.ts` (collapse to one Billing link)
- `src/routes/admin_.settings.tsx` (host the moved ops cards)

**Delete (with redirects where the URL was public to admins)**
- `src/routes/admin_.reconciliation.tsx`
- `src/routes/admin_.memberships.tsx`
- `src/routes/admin_.payments.tsx`
- `src/routes/admin_.ops.billing.tsx`
- `src/routes/admin_.churn.tsx` (data folded into Subscriptions tab)
- `src/components/admin/sections/MemberReconciliationStrip.tsx`

## Done means

- `/admin/billing` renders all 4 tabs with real data.
- Subscriptions tab renewal pills match Member 360 byte-for-byte (same resolver).
- Sidebar shows one Billing link.
- The 5 retired routes 404 or redirect; no dead links remain (`rg` clean for `/admin/reconciliation`, `/admin/memberships`, `/admin/payments`, `/admin/ops/billing`, `/admin/churn`).
- Typecheck green.

Reply **go** to build, or push back on anything before I start.
