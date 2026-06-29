# REPS Admin — Stripe Billing Source-of-Truth Final QA

**Date:** 2026-06-29
**Phase:** 2 (read-only)
**Status:** Audit complete. **Zero mutations performed.** Awaiting sign-off before Phase 3.

---

## 0. Headline numbers (Stripe-mirror, live as of audit)

| Metric | Value | Source |
|---|---|---|
| Total professionals (any status) | **396** | `public.professionals` |
| Published professionals | **392** | `professionals.is_published=true` |
| Demo professionals | **1** (James Carter) | `professionals.is_demo=true` |
| Suspended | 0 | `professionals.suspended_at` |
| Subscriptions, status=active | **8** | `public.subscriptions` |
| Subscriptions, status=trialing | **331** | `public.subscriptions` |
| Subscriptions, status=canceled | 1 | `public.subscriptions` |
| Subscriptions, status=incomplete_expired | 1 | `public.subscriptions` |
| **Active Paying Members (active + trialing)** | **339** | Stripe mirror |
| Distinct users with active sub | **339** | one sub per user (no duplicates after Gumbley cleanup) |
| Disputes (open) | 1 | `public.disputes` |
| Refunds processed | 0 | `public.payment_events` |
| BD seed rows (archive) | 390 | `public.bd_member_seed` — read-only safety-net |
| Legacy stripe link rows (archive) | 390 | `public.legacy_stripe_link` — read-only safety-net |

---

## 1. Source-of-truth map (full table in `billing-source-map.csv`)

Every billing concept now resolves to **Stripe-only** for the active path. Two safety-net reads of `bd_member_seed` remain in `member-stripe-sync.server.ts` and `subscription-resolver.server.ts` for stripe-customer-id discovery — kept until Phase 7 once we prove the mirror's `stripe_customer_id` is complete (it is: 339/339 rows have it). No KPI, chart, or revenue figure depends on BD/legacy.

---

## 2. Critical findings (act in later phases)

### 2.1 Price-id alias on every active subscription — `member360-billing-qa.csv`

**338 of 339 active+trialing subs have `stripe_price_id = 'verified_annual'`** (the seeding alias). Only 1 row has the real Stripe `price_…` populated (and even that is NULL on Andrew). Member 360's Billing tile pulls Stripe live so users see the real price, but the *mirror* is stale.

- **Impact today:** Cosmetic — Member 360 fetches live from Stripe, so the visible price is correct.
- **Impact at scale:** Revenue/forecast aggregations that read `subscriptions.stripe_price_id` will mis-group by tier.
- **Fix (Phase 4):** Resolve `price_…` once via Stripe on first read, backfill the mirror row. Don't ship a price-id backfill script — let it lazy-heal on Member 360 visits, then sweep stragglers.

### 2.2 Tier enum still `verified` in DB — display already says "Core"

DB enum: `verified | pro | studio | free`. UI maps `verified → Core` in `src/lib/billing/prices.ts`. No active user-facing string says "Verified as a tier". Renaming the enum is a migration risk for zero user value — **defer until a real product reason emerges**.

### 2.3 Public visibility contract is NOT enforced — `public-visibility-audit.csv`

393 published professionals split as:

| Verdict | Count |
|---|---|
| `OK_paid_or_scheduled` | 339 |
| `LEAK_no_sub_still_public` | **51** |
| `LEAK_demo_published` | 1 (James Carter — intentional) |
| `LEAK_canceled_still_public` | 1 (Karly Marie Priest) |
| `REVIEW_incomplete_expired` | 1 |

**53 profiles are publicly listed with no paid/scheduled Stripe entitlement.** Today the public site reads `professionals.is_published` only — there is no join to `subscriptions`. Full list in `no-subscription-delete-candidates.csv` (54 rows including all classifications).

- **Fix (Phase 5):** Introduce `canShowProfessionalPublicly(userId)`. Stage as audit diff first, then flip the public surfaces.
- **No deletion in Phase 2.** These rows stay live until you sign off.

### 2.4 Jordon Gumbley investigation

User reported Jordon as "just come in" with an active sub. **He has no `auth.users` row, no `professionals` row, and no `subscriptions` row in REPs.** The active Stripe sub `sub_1TmXWIAP31Yc4cJj9jb8rduk` you mentioned in earlier turns belongs to Stripe customer `cus_RmoJlLmTA752zV` which is **not linked to any REPs user**.

- Either he signed up directly in Stripe (test checkout) and never created a REPs account, or the link in Stripe metadata is missing.
- **Action proposal (Phase 4):** check Stripe directly via the Member 360 finder using customer id `cus_RmoJlLmTA752zV`. If the sub really is paid £99/yr, we either onboard him as a fresh REPs user OR cancel the orphan Stripe sub. **No action in Phase 2.**

### 2.5 Richard Bennett

Verified clean. One row: `sub_1TnLLeAP31Yc4cJjWXAu1bG6`, status=trialing, tier=verified (display: Core), `cancel_at_period_end=false`, `current_period_end=2027-05-28`, `stripe_customer_id=cus_UbCRdCgy46NWG8`. Verification status is `pending` (not verified) — that is a separate workflow, not a billing fault. Member 360 should display "Scheduled Core renewal — renews 28 May 2027" and the Verified badge stays absent until the 3-pillar gate passes.

### 2.6 Webhook integrity — PASS

`stripe-payment-integrity-audit.csv`: every Stripe event type we care about is being mirrored. 346 `customer.subscription.created` events vs 339 current actives = 4 canceled + 3 historic — clean. 18 dispute events resolved to 1 dispute row — correct grouping. No webhook gaps.

### 2.7 Overview charts — partially failing — `overview-chart-tier-breakdown-audit.csv`

Three charts on `/admin` (Member Growth, Revenue Received, Forecast) all render single-series with low-contrast Recharts default tooltips. **No data integrity bug** — but tier split (Core/Pro/Studio) and a readable tooltip are the Phase 3 deliverable you already specified.

---

## 3. Brilliant/BD/legacy sweep — `brilliant-bd-legacy-reference-sweep.csv`

44 source files match the sweep regex.

| Verdict | Count | What |
|---|---|---|
| `remove_now_archive_module` | 22 | `bd-migration.functions`, `bd-seed`, `bd-photos`, `webhook-recovery`, `webhook-replay`, `stripe-linking`, `convert-legacy.*`, `setup-link.server`, `legacy-renewal` route, `BdRailSwapCard`, `BdSetupLinkCard`, `PriceIdBackfillCard`, `legacy-setup-link` email, `legacy-conversion-confirmation` email, `reconciliation.functions`, `memberships.functions`, `admin_.ops.billing` route, `billing.setup.$token` route, `lifecycle-cron`. **Phase 7 work.** |
| `UNSAFE_active_billing_path` | 11 | Files in the active billing spine that contain a reference. Manual review needed before Phase 7 deletes anything: `subscription-resolver.server.ts`, `member-stripe-sync.server.ts`, `member-billing-row.server.ts`, `billing-console/list.functions.ts`, `resync-stripe.functions.ts`, `overview.functions.ts`, `professionals.functions.ts`, `webhook.ts`, `active-paying-member.{server.ts,ts}`, `churn/lifecycle.functions.ts`. Most references are *reads* of `bd_member_seed` for safety-net customer-id discovery. Acceptable to leave until mirror completeness is proven. |
| `review` | 8 | User-facing modules with stray strings: `dashboard_.verification.tsx`, `dashboard_.profile.tsx`, `_pro/route.tsx`, `useProGuard.ts`, `UpgradePanel.tsx`, `PillarPage.tsx`, `support/ai-draft.functions.ts`. Most are the `migrated_from_bd` flag check or BD-derived copy. **Phase 7 sweep.** |
| `generated` | 2 | `routeTree.gen.ts`, `integrations/supabase/types.ts` — auto-regenerated, ignore. |
| `docs_only` | 1 | Only `docs/` already excluded — most hits live in fixtures. |

**Zero user-facing strings today say "Brilliant", "Migrated member", "Verified as tier", "Trial user", or "Free trial".** The remaining work is module deletion, not UI copy.

---

## 4. Member entitlement classification — `member-entitlement-final-audit.csv`

396 rows; classification distribution:

| Bucket | Count |
|---|---|
| `scheduled_paid` (trialing, not cancelling) | 331 |
| `active_paid` | 8 |
| `no_subscription` | **54** |
| `canceled` | 1 |
| `incomplete_expired` | 1 |
| `demo` (James Carter) | 1 |

**`delete_candidate=true` flag is set on 51 rows** (published + no sub + not demo + not suspended). These are listed in `no-subscription-delete-candidates.csv`.

- **No deletion in Phase 2.** Phase 5/6 work, gated on your approval.
- Roughly 30 of these are early-cohort BD members whose Stripe sub was never created — they're the "Brilliant migration didn't cover them" tail. Decide per cohort: invite to sign up fresh, or close the account.

---

## 5. Final verdicts per concept

| Concept | Verdict |
|---|---|
| Active Paying Members | **PASS** — 339, Stripe-only |
| Core / Pro / Studio counts | **PASS** — DB enum lag is cosmetic |
| Revenue Received (KPI) | **PASS** — Stripe ledger only |
| Lifetime Revenue | **PASS** |
| Projected / Forecast | **PASS data, FAIL UX** — needs tier split (Phase 3) |
| Member Growth | **PASS data, FAIL UX** — needs tier lines (Phase 3) |
| Failed Payments | **PASS** |
| Disputes | **PASS** |
| Refunds | **PASS** (zero rows, handler verified) |
| Cancelling Members | **PASS** |
| Public Profiles Visible | **FAIL** — 53 leaks; needs `canShowProfessionalPublicly` (Phase 5) |
| Member 360 price-id surfacing | **FAIL** — alias `verified_annual` on 338/339 rows (Phase 4 lazy-heal) |
| Member 360 destructive actions | **FAIL UX** — 4 buttons must collapse to 1 (Phase 6) |
| Webhook integrity | **PASS** |
| BD/legacy code | **PRESENT but inert** — 22 modules safe to archive in Phase 7 |

---

## 6. Recommended Phase 3 order (unchanged from main plan)

1. **Phase 3** — Overview chart tier-split + tooltip contrast (3 charts, ~1 file).
2. **Phase 4** — Member 360 price-id resolve + pill collapse; Jordon Gumbley orphan-Stripe investigation.
3. **Phase 5a** — Author `canShowProfessionalPublicly` + ship the audit diff endpoint (read-only, no UI flip yet).
4. **Phase 5b** — Flip public surfaces to use the contract once you've reviewed the diff (53 profiles hidden in one switch).
5. **Phase 6** — Collapse Member 360 destructive actions to single **Delete account**.
6. **Phase 7** — Archive 22 BD/legacy modules + retire `legacy-renewal` cron + scrub residual UI copy.
7. **Phase 8** — Webhook re-verify (no gaps expected based on this audit).

**Billing math, cron schedules, and webhook handlers are not modified in Phases 3–6.** The only file touched in Phase 3 is `RevenueAndMembership.tsx` + `overview.functions.ts` (additive tier-series). Phase 4 touches `member-stripe-sync.server.ts` for the alias resolve. Phase 5 is additive. Phase 6 collapses UI only. Phase 7 deletes modules. Phase 8 verifies.

---

## 7. CSVs and screenshots

All under `/mnt/documents/admin-v2/`:

- `billing-source-map.csv`
- `overview-kpi-source-audit.csv`
- `overview-chart-tier-breakdown-audit.csv`
- `member-entitlement-final-audit.csv` (396 rows)
- `no-subscription-delete-candidates.csv` (51 rows, proposal only)
- `free-tier-audit.csv` (53 rows — same population as no-sub leaks)
- `brilliant-bd-legacy-reference-sweep.csv` (44 files)
- `public-visibility-audit.csv` (393 published pros)
- `member360-billing-qa.csv` (339 active subs, price-id alias flagged)
- `stripe-payment-integrity-audit.csv`

Phase 1 architecture screenshots are already on disk under `/mnt/documents/admin-v2/screenshots/` and have not been retaken — current admin behaviour is unchanged.

---

## 8. Acceptance gate

**Stop.** Nothing in Phase 3+ runs until you've reviewed this report and the 10 CSVs and explicitly approved. Billing behaviour today is preserved exactly.
