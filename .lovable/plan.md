
# Admin Reconciliation Page

Goal: stop guessing. Build a read-only admin page that shows the exact rows behind each KPI on `/admin`, grouped and annotated, so any number can be traced to source data. No KPI logic changes in this task.

## Route

- New file: `src/routes/_authenticated/_admin/admin_.reconciliation.tsx`
- URL: `/admin/reconciliation?period=...`
- Reuses the same `period` selector and `overview-period.ts` boundaries as `/admin` so reconciliation always matches what the dashboard shows.
- Admin-gated via existing `_admin` layout (`has_role(admin)`).
- Linked from each KPI tile on `/admin` with a small "Reconcile →" link that deep-links to the relevant section (`#revenue`, `#members`, `#registrations`). No KPI math changes — only an anchor link is added.

## Data source

New server functions in `src/lib/admin/reconciliation.functions.ts` (protected by `requireSupabaseAuth` + admin check). These run the **same SQL shape** the dashboard uses for filtering windows, but return **row-level data plus the dashboard's decision** for each row, never recomputed totals from a parallel formula.

Approach: import the existing helpers from `src/lib/admin/overview.functions.ts` where possible, or replicate the exact filter predicates verbatim and mark each row with `included_in_total` + `exclusion_reason` based on those predicates. Totals shown at the bottom are a `SUM` over `included_in_total = true` rows — if it disagrees with `/admin`, that is the bug surfaced (not fixed here).

## Sections

### 1. Revenue reconciliation (`#revenue`)

Query `payment_events` in window, join nothing (payload is JSON). For each row return:

- `id`, `stripe_event_id`, `event_type`, `processed_at`, `created_at`
- `payload.data.object.customer` → `customer_id`
- `payload.data.object.subscription` → `subscription_id`
- `payload.data.object.invoice` or `.id` (for invoice events) → `invoice_id`
- `payload.data.object.payment_intent` → `payment_intent`
- `payload.data.object.charge` or `.id` (for charge events) → `charge_id`
- `livemode`, `currency`, `amount_paid`, `amount`, `amount_refunded`, `refunded`
- `calculated_amount_used_by_dashboard` (pence/£ the dashboard de-dup map ended up using)
- `included_in_total` (boolean)
- `exclusion_reason` (e.g. `"duplicate of invoice X (charge.succeeded skipped)"`, `"livemode=false"`, `"refunded"`, `"non-revenue event_type"`, `"outside window"`)

UI: shadcn `Table` grouped by **dedupe key** (`pi:<id>` / `charge:<id>` / `object:<id>` — same keys the dashboard uses). Each group has a header row showing the chosen canonical event and the £ that contributed. Duplicates render greyed-out with the exclusion reason.

Footer row:
- Raw event count in window
- Distinct `stripe_event_id` count
- Total revenue used by dashboard (£)

Jordon Gumbley's £99 will appear as a group containing his `invoice.payment_succeeded` (canonical, £99) and `charge.succeeded` (excluded, reason: "deduped: same payment_intent as invoice").

### 2. Membership reconciliation (`#members`)

Query `subscriptions` with the same predicates the Total Members KPI uses. For each row return:

- user id, `email` (from `profiles` / `auth.users`)
- subscription `id`, `tier`, `status`, livemode/environment
- `created_at`, `current_period_end`, `cancel_at_period_end`, `cancelled_at`
- `included_in_member_count`, `exclusion_reason` (e.g. `"status=canceled"`, `"livemode=false"`, `"churn_lifecycle stage=lapsed"`)

shadcn `Table` with status badge column. Footer shows final member total.

### 3. Registration reconciliation (`#registrations`)

For every profile/user considered for the New Registrations KPI in window:

- `email`
- `profiles.created_at`
- `auth.users.email_confirmed_at`
- first `subscriptions.created_at` (if any)
- `included_in_registration_count`, `exclusion_reason` (e.g. `"no paid subscription in window"`, `"email_confirmed_at outside window"`, `"demo account"`)

Footer shows final registration total.

## Constraints

- **No edits** to `src/lib/admin/overview.functions.ts`, `overview-period.ts`, dashboard components, or any KPI calculation.
- Reconciliation rows derive `included_in_total` / `exclusion_reason` by **calling or mirroring** the dashboard predicates — never a new ad-hoc formula.
- If totals at the bottom of any section disagree with `/admin`, the page renders a red banner: *"Dashboard says £X, reconciliation says £Y — discrepancy at <predicate>. Recommended fix: <one-line code change>"*. No code change applied.
- Read-only. No mutations, no Stripe API calls.

## Acceptance checklist

- Page loads at `/admin/reconciliation?period=yesterday` for admins only.
- Revenue section answers: why total is £X, which payments compose it, why Jordon is in/out.
- Members section answers: why total is X, which subs are in/out and why.
- Registrations section answers: why total is X, which users are in/out and why.
- Every excluded row has a non-empty `exclusion_reason`.
- KPI tiles on `/admin` have a "Reconcile →" anchor link (the only change to existing dashboard code).

## Files

- ADD `src/routes/_authenticated/_admin/admin_.reconciliation.tsx`
- ADD `src/lib/admin/reconciliation.functions.ts`
- EDIT `src/components/admin/overview/*` (KPI tiles only) to add anchor links — no math changes.
