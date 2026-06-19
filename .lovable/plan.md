## Scope

Data-source fixes only. No card redesign, no `/admin/payments` UI changes, no public pages, no checkout, no BD migration billing execution, no Stripe write actions (no customers/subscriptions/invoices/schedules/items/charges created or modified in Stripe). Card redesign is deferred to a follow-up pass once numbers are trustworthy.

Brutal-truth pre-amble (recorded so the redesign pass doesn't repeat the mistake): of the four KPIs in the proposed mock, only "Total members" is computable today. "MRR vs last month", "Foundation→Pro conversion %" and "Monthly churn %" all need a historical snapshot table that doesn't exist, and "Foundation" isn't a tier you sell. The redesign pass will use Monthly revenue / Total members / Forecast ARR / Trialing now until snapshots accrue.

---

## 1. Environment integrity (Stripe livemode → DB environment)

**File:** `src/routes/api/public/payments/webhook.ts`

- Derive `env` strictly from `event.livemode`: `event.livemode === true → 'live'`, `event.livemode === false → 'sandbox'`.
- The `?env=` URL parameter is now used only to pick which webhook secret to verify against. If `event.livemode` and `?env=` disagree after signature verification, log a `webhook_env_mismatch` warning row with `{ event_id, livemode, url_env }` and use `event.livemode` as the source of truth for any DB write (never silently write the wrong env).
- All `subscriptions` writes inside the webhook (`customer.subscription.*`, invoice handlers that touch `subscriptions`) write `environment` from this derived value.

**One-off data correction (via `supabase--insert`, no Stripe call):**
- `UPDATE public.subscriptions SET environment='sandbox', updated_at=now() WHERE stripe_subscription_id='sub_1ThB2X…'` (the confirmed test-mode row).
- Re-verify with a SELECT: only `livemode=true` subs remain `environment='live'`.

---

## 2. Billing-period integrity (annual vs monthly)

**Schema (migration):**
- Add `billing_period text` to `public.subscriptions` with CHECK in (`'monthly'`,`'annual'`), nullable for now.
- Backfill: for each live row, derive from Stripe subscription metadata already stored (`billing_period` on `sub.metadata`) — `sub_1Ti0uW…` → `annual`, `sub_1TjwoJ…` → `annual`, `sub_1ThB2X…` → `monthly` (and the row is sandbox anyway).
- No default. New rows must set it explicitly.

**Webhook:** when writing/updating a subscription row, set `billing_period` from `subscription.metadata.billing_period` (fallback: derive from the price's `recurring.interval`).

**Forecast math:** `src/lib/admin/billing-metrics.ts` gets period-aware helpers used everywhere downstream:
- `paymentPenceFor(tier, period)` — Pro+annual = `CHECKOUT_OFFERS.pro.annual.display` (£590), Pro+monthly = £59, Verified+annual = £99, Studio+monthly = £149.
- `annualPenceFor(tier, period)` — annual rows = the annual price as-is; monthly rows = `monthlyPence × 12`.
- `cadenceMonthsFor(tier, period)` — annual = 12, monthly = 1.

**Consumers:** `src/lib/admin/memberships.functions.ts` — both `getMembershipMetrics` and `getRevenueForecast` select `billing_period` and use the new helpers for: live Forecast ARR, post-launch upcoming payments, past-due totals, and the 24-month recurring income chart. V7-cohort logic untouched.

---

## 3. Orphan exclusion (deleted auth users)

In `getMembershipMetrics` and `getRevenueForecast`:
- After loading live `subscriptions`, fetch the matching set of `auth.users.id`s via `supabaseAdmin.auth.admin.listUsers` (or a single targeted query) and build a `Set<string>` of valid `user_id`s.
- Partition `subsRaw` into `subsLinked` (user_id present) and `subsOrphan` (user_id missing).
- ALL KPIs, tier counts, ARR, recurring chart, and Upcoming Payments use `subsLinked` only.
- Add to `MembershipMetrics.diagnostics`: `orphanedSubsLive: number`, `orphanedSubsList: Array<{ stripe_subscription_id, tier, status, billing_period }>` (no PII, just IDs) — surfaced later in a Stripe/Payments diagnostics tile.
- Do not delete orphaned rows in this pass. Do not cancel in Stripe.

---

## Out of scope this pass

- `/admin/memberships` card visual redesign (KPI tiles, tier-card progress bars, "Payments in next 14 days" rename).
- `/admin/payments` UI.
- Public pages, checkout, BD migration billing execution.
- Stripe write actions of any kind.
- Snapshot table for MoM deltas (separate pass, prerequisite for churn % and MRR delta).

---

## Verification report (returned after build)

1. SELECT confirms 0 sandbox/test-mode subs counted in live metrics.
2. Table of all current `subscriptions` rows: `tier, status, environment, billing_period, forecast_cadence_months, forecast_payment_pence`.
3. Annual Pro subs forecast annually (£590 once per year, not £59 × 12).
4. Orphaned subs excluded from `/admin/memberships` aggregates; surfaced via `diagnostics.orphanedSubsLive`.
5. Recalculated Forecast ARR (live + V7 future) — expected ≈ £39,790 (2 linked annual Pro × £590 + 383 V7 future × £99 + 7 V7 honour × £99 anniversary).
6. Recalculated 24-month recurring chart totals.
7. Recalculated Pro trialing count = 2 (was 3).
8. Confirmation: no Stripe API write calls were issued; only DB reads + one DB UPDATE for the misclassified row.

---

## Technical notes

- Migration touches schema (`ALTER TABLE public.subscriptions ADD COLUMN billing_period text CHECK …`). The one-off `environment` correction goes through `supabase--insert`, not a migration.
- `auth.users` lookup happens server-side inside the admin server functions (already use `supabaseAdmin` and gate on `has_role(_, 'admin')`); no new RLS or grants needed.
- Webhook signature verification flow is unchanged — only the post-verification `env` derivation changes.
