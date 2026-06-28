# 11 · Admin Metric Registry (Canonical Contract)

**Status:** Approved · binding for all admin development from this point forward.
**Owner:** Platform / Admin architecture.
**Companion code:** `src/lib/admin/metrics-definitions.ts`,
`src/lib/members/active-paying-member.ts`,
`src/lib/members/active-paying-member.server.ts`.

---

## 0 · The Contract

1. **No business concept may have more than one name.**
2. **No display name may describe more than one business concept.**
3. If two pages display the **same** concept they MUST share:
   - the same **display name**,
   - the same **source function**,
   - the same **calculation**.
4. If two pages display **different** concepts they MUST:
   - use **different names**, and
   - include **subtitles** that explain the distinction wherever the
     similarity could be misread (e.g. "Active professionals" vs
     "Active paying members").
5. **No new KPI may be shipped to the admin until it is added to this
   registry.** PRs that introduce an un-registered KPI must be rejected
   in review.
6. The registry is part of the platform architecture and is enforced
   alongside the schema and the design system.

---

## 1 · Canonical Metrics

| # | Display name | Concept (one-line) | Source function | Surfaces |
|---|--------------|---------------------|------------------|----------|
| M1 | **Active paying members** | Deduped union of Stripe-active subscriptions, legacy migrated payers, and BD-seeded launch-day payers. The "how many people are paying us right now" number. | `fetchActivePayingMemberCollection()` → `counts.final_active_members` | `/admin` Overview · `/admin/ops/customer` · `/admin/professionals` ("Paid members") · `/admin/reconciliation` |
| M2 | **Active professionals** | Email-confirmed professionals (any tier, incl. Free). Excludes platform admins, demos, and invited-but-not-signed-up shells. | `count_confirmed_professionals({ _only_published: false })` minus confirmed admin pros | `/admin/professionals` |
| M3 | **Verified professionals** | Subset of M2 with `verification = 'verified'` (3-pillar pass). | `count_confirmed_professionals({ _verification: 'verified' })` | `/admin/professionals` |
| M4 | **Paying + scheduled** | M1 plus the verified-tier cohort whose first billing date is in the future (launch-day BD scheduled set). | `getMembershipsKpis()` → `totalMembers` | `/admin/memberships` |
| M5 | **Failed payments** | Subscriptions in a "card broken right now" state: `past_due`, `unpaid`, or `incomplete`. Single canonical set lives in `FAILED_PAYMENT_STATUSES`. | `getBillingHealth().failed_payments_active`, `getCustomerHealth().failed_renewals`, `getMembershipsKpis().pastDueCount`, `listPaymentFailedSubs()` | `/admin` red banner · `/admin/ops/billing` · `/admin/ops/customer` · `/admin/memberships` · `/admin/webhook-recovery` |
| M6 | **Awaiting payment update** | Members issued a `/renew/$token` card-capture link that is unconsumed and unexpired. | `getCustomerHealth().awaiting_payment_update` | `/admin/ops/customer` · `/admin/webhook-recovery` |
| M7 | **Pending cancellations** | Live subscriptions with `cancel_at_period_end = true`. | `getCustomerHealth().pending_cancellations` | `/admin/ops/customer` · `/admin/churn` |
| M8 | **Churn (7d)** | Subscriptions transitioned to `canceled` in the last 7 days. | `getCustomerHealth().churn_7d` | `/admin/ops/customer` · `/admin/churn` |
| M9 | **Recoveries (7d)** | `churn_lifecycle` rows that reached `stage = 'recovered'` in the last 7 days. | `getCustomerHealth().recoveries_7d` | `/admin/ops/customer` · `/admin/churn` |
| M10 | **MRR** | Sum of monthly-normalised price of `active`/`trialing` Stripe subscriptions only. Excludes legacy and BD cohorts by design (those are tracked under M1/M4 and Projected cash). | `getPaymentsMetrics().mrrPence` | `/admin/payments` |
| M11 | **ARR (run-rate)** | `MRR × 12`. Derived only. | `getPaymentsMetrics().arrPence` | `/admin/payments` |
| M12 | **Revenue received** | Sum of successful Stripe charges in the period. | `getOverviewKpis().revenueReceivedPence` | `/admin` Overview |
| M13 | **Projected cash due** | Forecasted renewal revenue across all three rails (Subs → legacy_stripe_link → bd_member_seed). | `getRevenueForecast()` | `/admin` Overview · `/admin/reconciliation` |
| M14 | **Net member growth** | New paying members minus churned, period-windowed. | `getOverviewKpis().netGrowth` | `/admin` Overview |
| M15 | **New signups (30d)** | Email-confirmed pro signups in the last 30 days; subtitle shows WoW delta vs prior 30d. | `count_confirmed_pro_signups()` | `/admin/professionals` |
| M16 | **New Core / Pro / Studio (7d)** | Live-environment subscriptions created in last 7 days for the named tier. | `getCustomerHealth().new_{core,pro,studio}_7d` | `/admin/ops/customer` · `/admin/memberships` |

---

## 2 · Banned synonyms (do not reintroduce)

| Banned label | Use instead | Why |
|---|---|---|
| "Failed renewals" | **Failed payments** (M5) | "Renewal" excludes brand-new `incomplete` first-charge failures, which are the same cohort operationally. |
| "Total members" | **Paying + scheduled** (M4) or **Active paying members** (M1) | "Total" hid the scheduled-not-yet-billing cohort and conflated M1 vs M4. |
| "Active members" used to mean professionals | **Active professionals** (M2) | M1 owns "Active … members"; M2 is a different denominator. |
| "Past due" as a standalone count | **Failed payments** (M5) | Single source set lives in `FAILED_PAYMENT_STATUSES`. |
| Per-page private constants like `FAILED_STATUSES`, `PAST_DUE_STATUSES` | Import `FAILED_PAYMENT_STATUSES` from `metrics-definitions.ts` | Inline forks are how drift starts. |

---

## 3 · Implementation rules

- **One source set, one constant.** `FAILED_PAYMENT_STATUSES` in
  `src/lib/admin/metrics-definitions.ts` is the only allowed definition
  of M5's status list. Surfaces that need a superset (e.g. the recovery
  list including `incomplete_expired`) MUST spread the canonical
  constant and document the addition next to it.
- **One fetch function for M1/M4.** All surfaces that show paying
  members go through `fetchActivePayingMemberCollection()`. Stripe-only
  "cheap proxies" are forbidden.
- **Subtitles are part of the metric.** A KPI is not just a number and a
  label — it is `{ label, value, subtitle, source_fn }`. The subtitle
  exists to make the denominator/source obvious without leaving the
  page.
- **Drill targets are part of the metric.** Every tile must link to the
  page that owns its underlying records.

---

## 4 · Adding a new KPI

1. Open this file. Add a row to §1 with a unique display name, the
   one-line concept, the source function, and the surfaces.
2. If it shares a concept with an existing row, do not add it — reuse
   the existing row and add the new surface to its "Surfaces" column.
3. If it needs a new source function, put the function in the file that
   owns its domain (`src/lib/admin/*.functions.ts` or
   `src/lib/ops/*.functions.ts`) and re-export any shared constants
   from `metrics-definitions.ts`.
4. Land the registry update and the code change in the same PR. Reviews
   block on the registry diff being present.

---

## 5 · Freeze note

This registry is the **last** thing landed before Admin v2 begins. From
v2 onward, all admin numeric displays must be traceable to a row in §1.
Reviewers: if a PR adds a number to the admin and you can't point to
the row, the PR is not ready.
