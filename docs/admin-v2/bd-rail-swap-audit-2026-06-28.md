# BD Legacy Rail Swap — Codebase Audit
**Date:** 2026-06-28  
**Author:** Automated audit (read-only)  
**Purpose:** Enumerate every BD / legacy PaymentIntent touchpoint so the Phase 2 migration (cron → native Stripe Subscriptions anchored to original BD renewal date) knows exactly what to delete, simplify, or change.

---

## 1. Tables & Schema

### 1.1 `legacy_stripe_link` (390 rows)

Primary control table for the legacy cron rail. One row per BD member.

| Column | Type | Purpose | Post-migration disposition |
|---|---|---|---|
| `bd_member_id` | bigint PK | FK to `bd_member_seed` | **Keep** as FK audit trail |
| `email` | citext | Billing email | **Keep** as audit trail |
| `stripe_customer_id` | text | Pre-existing Stripe cus_ | **Keep** — subscription moves onto same customer |
| `stripe_subscription_id` | text | The legacy recurring sub (7 rows non-null) | **Keep** as historical record |
| `current_price_id` | text | Legacy price — all `one_time` kind, so mostly null | **Delete column** after migration |
| `access_expires_at` | timestamptz | Window managed by cron | **Delete column** — replaced by `current_period_end` on native sub |
| `legacy_kind` | text (`one_time`\|`unknown`) | Controls cron eligibility | **Delete column** — meaningless post-migration |
| `link_status` | text (`linked`\|`no_customer`) | Linking pass output | **Keep** as historical record |
| `migration_status` | text | Cron state machine (`pending`\|`ready`\|`blocked`\|`skipped`\|`renewed_to_verified`\|`awaiting_payment_method`) | **Repurpose** as `converted_to_subscription` terminal state |
| `last_attempt_at` | timestamptz | Last cron touch | **Keep** for audit |
| `notes` | text | Cron error messages | **Keep** for audit |
| `eligible_for_legacy_price` | boolean | Honour-window flag | **Delete column** |
| `stripe_schedule_id` | text | Unused in current data | **Delete column** |
| `last_paid_at` | timestamptz | Imported charge date | **Keep** as audit trail |
| `last_paid_amount_pence` | integer | Historical charge | **Keep** |
| `next_due_at` | timestamptz | Cron's computed renewal date | **Delete column** — replaced by sub `current_period_end` |
| `is_lifetime` | boolean | Lifetime override (0 true rows) | **Delete column** — no lifetime members exist |
| `migration_kind` | text | Phase 2 migration result type | **Keep** temporarily, **delete** post-cutover |
| `converted_at` | timestamptz | When sub was created (0 non-null rows) | **Repurpose** — set on Phase 2 conversion |
| `converted_subscription_id` | text | Native Stripe sub ID post-migration (0 non-null rows) | **Critical** — must be set by Phase 2 |

**Live row breakdown:**
- `migration_status = skipped`: 242 (no Stripe customer found — 27 `unknown` kind + 215 lapsed?)  
- `migration_status = ready`: 114 (charged customer found, awaiting Phase 2 subscription creation)  
- `migration_status = blocked`: 27 (cron-flagged; no Stripe customer — matches `link_status = no_customer`)  
- `migration_status = renewed_to_verified`: 6 (cron already created a subscription — must be excluded from Phase 2 batch)  
- `migration_status = awaiting_payment_method`: 1  
- `legacy_kind`: 363 `one_time`, 27 `unknown` (0 `recurring`) — **the cron was never creating recurring subs; it intended to charge a PaymentIntent against the existing one-time customer**  
- `is_lifetime`: 0 true rows — the lifetime branch is dead code  

> ⚠️ **RISK:** The 6 `renewed_to_verified` rows already have a Stripe subscription. Phase 2 must check `converted_subscription_id IS NOT NULL` or `migration_status = 'renewed_to_verified'` and skip these rows to avoid creating a duplicate subscription.

---

### 1.2 `legacy_stripe_payments` (0 rows live)

Imported historical charge ledger (CSV import of pre-REPS BD payments).

| Column | Type | Purpose | Post-migration disposition |
|---|---|---|---|
| `charge_id` | text PK | Stripe charge ID | **Keep** as historical record |
| `stripe_customer_id` | text | Stripe customer | **Keep** |
| `email` | citext | Member email | **Keep** |
| `paid_at` / `amount_pence` / `currency` / `status` | various | Historical billing | **Keep** |
| `card_last4` / `card_brand` | text | Receipt info | **Keep** |
| `refunded_amount_pence` / `refunded_at` | various | Refund history | **Keep** |
| `user_id` | uuid | Linked auth user | **Keep** |
| `import_batch_id` / `imported_at` | uuid/ts | Import provenance | **Keep** |

**Disposition:** Entire table is pure historical record. Keep indefinitely. The `getMyLegacyPaymentHistory` server fn (`src/lib/billing/history.functions.ts:52`) surfaces these to members as billing history — **keep as-is post-migration**.

---

### 1.3 `bd_member_seed` (390 rows, all `migration_status = NULL`)

Master import table from original BD CSV. One row per BD member.

**Migration-specific columns to delete post-cutover:**

| Column | Delete? | Reason |
|---|---|---|
| `migration_canonical_stripe_customer_id` | Delete | Used only by `linkLegacyStripeCustomers` pass |
| `migration_cohort_override` | Delete | Cron cohort scheduling (`future_due` branch) |
| `migration_review_resolved` | Delete | Admin review flag |
| `migration_cohort_reason` | Delete | Informational only |
| `migration_status` | **Keep, repurpose** | Set to `converted_to_subscription` by Phase 2 |
| `migration_idempotency_key` | Keep temporarily | Phase 2 idempotency |
| `migration_stripe_customer_id` | **Keep** | Needed for subscription creation |
| `migration_stripe_subscription_id` | **Keep** | Written by Phase 2 on success |
| `migration_stripe_schedule_id` | Delete | Not used in current data |
| `migration_stripe_invoice_id` | Delete | Not used |
| `migration_charged_pence` | Delete | Not used |
| `migration_error` | Keep temporarily | Debug |
| `migration_ran_at` | Keep temporarily | Audit |
| `bd_next_due_date` | **Keep** | Phase 2 reads this as the subscription anchor date |
| `legacy_plan` / `legacy_billing_period` / `legacy_signup_at` | Keep | Historical reference |

**Columns to keep permanently:** `bd_member_id`, `email`, `first_name`, `last_name`, `claimed_user_id`, all profile/photo columns, `legacy_plan`, `legacy_signup_at`.

---

### 1.4 `bd_migration` (0 rows)

| Column | Purpose | Post-migration disposition |
|---|---|---|
| All 19 columns | Phase 1 migration planning ledger (never populated in prod) | **Drop table** — entirely superseded by `bd_member_seed.migration_*` columns |

---

### 1.5 `subscriptions` table — BD-related columns

The `subscriptions` table on the REPS platform does **not** have a `legacy_kind` or `is_lifetime` column. The only BD-specific column written at subscription upsert time is:

| Column | File:line | Disposition |
|---|---|---|
| `migrated_from_bd` | `src/routes/api/public/payments/webhook.ts:184`, `src/lib/admin/webhook-replay.functions.ts:465,704` | **Keep** — set to `true` when `sub.metadata.migrated_from === 'bd'`; used for KPI reporting |

Phase 2 must ensure every newly created subscription carries `metadata.migrated_from = 'bd'` so this flag lands correctly.

---

## 2. Cron Jobs

Direct access to `cron.job` is permission-denied in this environment. The following jobs are referenced by name in application code:

| Job name | Referenced at | Schedule (inferred) | What it does |
|---|---|---|---|
| `legacy-stripe-renewal-daily` | `src/lib/ops/renewal-engine.functions.ts:72` | Daily (name implies nightly) | Calls `POST /api/public/hooks/legacy-renewal` → `_runLegacyRenewalBatch()`. Picks `legacy_stripe_link` rows with expired `access_expires_at` and `migration_status IN ('pending','ready')`, creates a Core £99/yr Stripe Subscription. **DELETE this cron job in Phase 3.** |
| `churn-lifecycle-daily` | `src/lib/ops/renewal-engine.functions.ts:74` | Daily | Calls `POST /api/public/hooks/lifecycle-cron`. Handles BD Plan A (card-needed email), dunning progression, winback. **Keep** but strip Plan A BD branch after Phase 2. |

Both job names are surfaced in the Renewal Engine ops card via the `get_renewal_cron_runs` DB RPC (`src/lib/ops/renewal-engine.functions.ts:67`).

The route `GET /api/public/hooks/legacy-renewal` at `src/routes/api/public/hooks/legacy-renewal.ts` is the HTTP endpoint for the first cron. It accepts `{ environment, limit }` body params, authorises via `CRON_SECRET` / service-role / anon key, and delegates to `_runLegacyRenewalBatch`.

---

## 3. Server Routes & Functions

### 3.1 Webhook Handlers

**File:** `src/routes/api/public/payments/webhook.ts`

| Line | Touchpoint | Legacy-specific? |
|---|---|---|
| 62, 94 | Comments documenting Step 4 of `resolveUserId`: `legacy_stripe_link → bd_member_seed.claimed_user_id` | Yes |
| 96–113 | `resolveUserId` Step 4: queries `legacy_stripe_link` by `stripe_customer_id`, then `bd_member_seed` by `bd_member_id` to find `claimed_user_id`. Falls through to email lookup. | **Keep until all BD customers have `reps_user_id` backfilled in Stripe metadata.** Once Phase 2 runs `backfillStripeCustomerMetadata` for all 390, Step 4 becomes unreachable. |
| 184 | `migrated_from_bd: sub.metadata?.migrated_from === "bd"` written into `subscriptions` row | Keep |
| 688–737 | `invoice.payment_succeeded` / `invoice.payment_failed` branch — triggers `upsertSubscriptionFromStripe` and fires `renewal-payment-failed` email | **This is the correct post-migration webhook path.** No changes needed. |

**No `payment_intent.succeeded` case exists** in the webhook switch. The legacy rail bypasses the webhook entirely — it calls `stripe.subscriptions.create()` synchronously in `_runLegacyRenewalBatch` and relies on the resulting `customer.subscription.created` webhook event. After Phase 2, the native subscription lifecycle fires `invoice.payment_succeeded` automatically.

---

### 3.2 Cron Handlers

| File | Route | Legacy dependency |
|---|---|---|
| `src/routes/api/public/hooks/legacy-renewal.ts:14` | `POST /api/public/hooks/legacy-renewal` | Entire file is the legacy rail entrypoint. **Delete in Phase 3.** |
| `src/routes/api/public/hooks/lifecycle-cron.ts:83` | `POST /api/public/hooks/lifecycle-cron` | Plan A block (lines 75–115): queries `bd_member_seed WHERE migration_status='blocked' AND bd_next_due_date <= cutoff`. After Phase 2, all blocked rows either convert or stay blocked; the Plan A email (`renewal-card-needed`) transitions to a Stripe `customer.subscription.payment_action_required` webhook. **Strip Plan A block in Phase 3.** |

---

### 3.3 Admin Server Functions

| File | Function | What it does with legacy data |
|---|---|---|
| `src/lib/admin/stripe-linking.functions.ts:81` | `getLegacyLinkingStats` | Returns counts from `bd_member_seed` and `legacy_stripe_link` — powers Migration admin panel. **Delete in Phase 4.** |
| `src/lib/admin/stripe-linking.functions.ts:143` | `linkLegacyStripeCustomers` (exported server fn) | Pass 1: creates `legacy_stripe_link` rows. **Dead after Phase 2 completes.** |
| `src/lib/admin/stripe-linking.functions.ts:341` | `_runLegacyRenewalBatch` (internal) | Core legacy cron logic — queries `legacy_stripe_link`, creates Stripe subscriptions. **Delete in Phase 3.** |
| `src/lib/admin/stripe-linking.functions.ts:625` | `syncLegacySubscriptionStatuses` (inferred) | Refreshes `legacy_kind` / `access_expires_at` from live Stripe. **Delete in Phase 3.** |
| `src/lib/admin/bd-migration.functions.ts:1` | `getBdMigrationStats` | Reads `bd_member_seed` for photo/claim stats. Keep for Phase 2 monitoring. |
| `src/lib/admin/reconciliation.functions.ts:469,605,627` | `getReconciliation` / `getForecast` | Unions `legacy_stripe_link` and `bd_member_seed` into active-member and forecast counts. **Simplify in Phase 3** — remove legacy_link and bd_seed arms once all converted. |
| `src/lib/admin/overview.functions.ts` | `getAdminOverview` | Calls `buildActivePayingMemberCollection` with legacy and BD data. **Simplify in Phase 3.** |
| `src/lib/ops/renewal-engine.functions.ts:78,96` | `getRenewalEngineStatus` | Reads `legacy_stripe_link` for recent attempts and upcoming-due. **Delete/replace in Phase 3.** |
| `src/lib/billing/history.functions.ts:52,74` | `getMyLegacyPaymentHistory` | Reads `legacy_stripe_payments` and `legacy_stripe_link.next_due_at / is_lifetime`. Keep the payments query; **replace** the link query with a native subscription lookup. |
| `src/lib/admin/webhook-replay.functions.ts:30,223,234,466` | Webhook replay + diagnosis | Step 4 of userId resolution mirrors the live webhook. Keep until Stripe metadata is backfilled. |
| `src/lib/admin/webhook-recovery.functions.ts:137,139` | Webhook recovery | Same Step 4 pattern. Keep until backfill complete. |

---

### 3.4 KPI Server Functions

| File:line | KPI | Legacy dependency |
|---|---|---|
| `src/lib/admin/overview.functions.ts` (~line 85) | Active Members tile | Calls `buildActivePayingMemberCollection` which unions `legacy_stripe_link` and `bd_member_seed`. Post-migration, both arms return empty sets and the union is a no-op. **Safe to leave; clean up in Phase 4.** |
| `src/lib/admin/reconciliation.functions.ts:511` | `legacy_amount_pence` | Hardcoded `LEGACY_AMOUNT = 9900` for forecast revenue attribution. **Update forecast to use native sub `amount` post-migration.** |

---

## 4. Active Paying Member Logic

**Files:** `src/lib/members/active-paying-member.ts`, `src/lib/members/active-paying-member.server.ts`

### Predicates (`.ts`)

| Predicate | File:line | Legacy branch | Post-migration behaviour |
|---|---|---|---|
| `isActiveLegacyLink(l, nowIso)` | `:77` | Returns `true` if `l.access_expires_at > now`. Used for `legacy_stripe_link` rows. | Once `access_expires_at` is in the past for all rows (which is already the case for 249/390 rows), returns `false` for all. No action needed but function stays. |
| `isActiveBdSeed(seed, nowIso)` | `:86` | Returns `true` if `seed.bd_next_due_date > now`. Used for `bd_member_seed` rows without a link. | After Phase 2, `bd_next_due_date` is the anchor date used for the native sub, so it will equal the sub's `current_period_end`. The sub arm will count the member; the bd_seed arm returns `false` (date is past). Dedupe ladder prevents double-count. |
| `TIER_FOR_LEGACY` / `TIER_FOR_BD_SEED` | `:27,28` | Both hardcoded `"verified"` (internal key for the Core tier) | Fine — all BD members migrate to Core tier. |

### Dedupe ladder (`.ts:203`)

Three-key merge: `user_id → email → bd_member_id`. This is safe post-migration because:
- Once a BD member has a native subscription, they appear in the `subs` arm with a `user_id`.
- Their `legacy_stripe_link` row has `access_expires_at` in the past → `isActiveLegacyLink` = `false` → not counted.
- Their `bd_member_seed` row has `bd_next_due_date` in the past → `isActiveBdSeed` = `false` → not counted.

**No double-billing risk** in the Active Member count model itself. Risk is in the cron (§8 below).

### `active-paying-member.server.ts`

Calls `buildActivePayingMemberCollection` after fetching all three source tables. Callers:
- `src/lib/admin/overview.functions.ts` — Active Members KPI
- `src/lib/admin/reconciliation.functions.ts` — Reconciliation audit

---

## 5. Admin UI Panels

| Route / Component | File | What it shows | Post-migration |
|---|---|---|---|
| `/admin/migration` | `src/routes/admin_.migration.tsx:137,589,599,610,621,638,650` | "Legacy CSV → bd_member_seed" import; Phase 1 linking stats (total seed, linked, pending, renewed); photo review; `legacy_stripe_link` migration status counts | **Archive/hide** in Phase 4 |
| `/admin/memberships` | `src/routes/admin_.memberships.tsx:167,681` | Subtitle "Stripe renewals · legacy renewals · BD cohort"; Active Members tile labelled "Stripe + legacy + BD, deduped (M1)" | Update copy in Phase 4 |
| `/admin/reconciliation` | `src/routes/admin_.reconciliation.tsx:272,318,548,555,589,590,797,856,1089` | Full three-source APM breakdown; `legacy_stripe_link` and `bd_member_seed` drilldown tables; forecast window cites both legacy sources | Simplify in Phase 4 |
| `/admin/ops/customer` | `src/routes/admin_.ops.customer.tsx:35` | "Subs + legacy + BD, deduped" label | Update copy in Phase 4 |
| `/admin/payments` | `src/routes/admin_.payments.tsx:111` | MRR subtitle "(excl. legacy/BD)" | Update copy in Phase 4 |
| `/admin/webhook-recovery` | `src/routes/admin_.webhook-recovery.tsx:51,147` | Step 4 `legacy_stripe_link` resolution shown in diagnosis; `bd_member_id` field | Keep until Stripe metadata backfill complete |
| `RenewalEngineCard` | `src/components/ops/RenewalEngineCard.tsx` | "Renewal engine — last 7 nights" with `legacy_stripe_link` attempts and upcoming-due | **Delete** in Phase 3 |
| `SiteTimePanel` | `src/components/ops/SiteTimePanel.tsx` | References legacy renewal in some capacity | Review and update in Phase 3 |

---

## 6. Email Templates

| Template | File | Triggered by | Legacy-specific? | Post-migration |
|---|---|---|---|---|
| `renewal-card-needed` | `src/lib/email-templates/renewal-card-needed.tsx` | `lifecycle-cron.ts` Plan A (BD `migration_status='blocked'`) via `mintAndEmailRenewalToken` | **Yes** — currently only fired for BD members without a Stripe customer. Copy is generic ("add a card to continue"). | **Repurpose**: Stripe's `customer.subscription.incomplete` webhook can fire this for any member whose subscription needs payment method. No content change needed. |
| `renewal-payment-failed` | `src/lib/email-templates/renewal-payment-failed.tsx` | `lifecycle-cron.ts` Plan B first-nudge (line 130+) AND `webhook.ts:688` `invoice.payment_failed` | **Partially** — fired by both legacy cron and native webhook. Copy is generic. | **Keep as-is** — already wired to the native Stripe `invoice.payment_failed` webhook at `webhook.ts:688`. No change required. |
| `winback-lapsed` | `src/lib/email-templates/winback-lapsed.tsx` | `lifecycle-cron.ts` dunning progression (stage `lapsed`) | No — fires for any lapsed member regardless of source | **Keep as-is** |

**Summary:** No email template needs to be deleted. `renewal-card-needed` loses its Plan A trigger but gains a new Stripe-webhook trigger. `renewal-payment-failed` is already correct for native subs.

---

## 7. Webhook Handlers — PaymentIntent-without-Subscription Branches

The webhook switch at `src/routes/api/public/payments/webhook.ts:510` does **not** contain a `payment_intent.succeeded` case. The legacy rail never fires raw PaymentIntents — it creates Stripe Subscriptions (with `collection_method=send_invoice` fallback). Therefore the native subscription lifecycle (`customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`) handles everything.

**Branches that currently exist and are indirectly legacy-aware:**

| Event type | File:line | Legacy relevance |
|---|---|---|
| `customer.subscription.created/updated/deleted` | `:572–681` | Calls `upsertSubscriptionFromStripe` which calls `resolveUserId` (Step 4 = `legacy_stripe_link` lookup). This is the path the renewed-to-verified cron subscriptions land on. | 
| `invoice.payment_succeeded` | `:688` | Calls `upsertSubscriptionFromStripe`. Same Step 4 dependency. |
| `invoice.payment_failed` | `:689–737` | Same + fires `renewal-payment-failed` dunning. Already correct for native subs. |
| `checkout.session.completed` | `:511` | Not used by legacy rail. |
| `charge.refunded` | `:750` | Handles refunds against charges; `handlePlatformChargeRefunded` looks up by `stripe_payment_intent_id`. Applies to one-time BD charges if any were made directly. |

**Key finding:** `resolveUserId` Step 4 (`legacy_stripe_link` lookup, lines 96–113) is the only live legacy branch inside the webhook. It runs on every subscription and invoice event for any BD Stripe customer until `reps_user_id` is backfilled in Stripe customer metadata. Phase 2 must call `backfillStripeCustomerMetadata` for all 390 converted customers so Step 4 short-circuits at Step 3 (customer metadata) going forward.

---

## 8. Defect & Leftover List — Phase 4 Cleanup TODOs

Ordered by risk (highest first):

### 🔴 CRITICAL

1. **Double-subscription risk on 6 `renewed_to_verified` rows** (`src/lib/admin/stripe-linking.functions.ts:341`).  
   These rows already have a Stripe subscription created by the legacy cron. Phase 2 batch must filter `WHERE migration_status NOT IN ('renewed_to_verified', 'awaiting_payment_method')` and `converted_subscription_id IS NULL`. If not guarded, Phase 2 would create a second active subscription on the same Stripe customer.  
   **Fix:** Add `NOT EXISTS (SELECT 1 FROM legacy_stripe_link WHERE converted_subscription_id IS NOT NULL AND bd_member_id = ...)` guard in Phase 2 migration script.

2. **`access_expires_at` is already past for 249/390 rows, but `migration_status = 'skipped'` (242) hides them from the cron.**  
   If an operator resets `migration_status` from `'skipped'` to `'pending'` without also setting a guard for Phase 2, those 242 rows will be picked up by the old legacy cron AND potentially by Phase 2. The cron should be stopped (or the `legacy-stripe-renewal-daily` pg_cron job disabled) before Phase 2 runs.

3. **`lifecycle-cron.ts` Plan A fires `renewal-card-needed` for any BD row with `migration_status='blocked'`** (`src/routes/api/public/hooks/lifecycle-cron.ts:83`).  
   If Phase 2 converts a `blocked` row to a native subscription but leaves `bd_member_seed.migration_status='blocked'`, the next nightly cron will try to email the member again. Phase 2 must atomically update `bd_member_seed.migration_status` to `'converted_to_subscription'` on success.

### 🟠 HIGH

4. **`getMyLegacyPaymentHistory` reads `legacy_stripe_link.next_due_at` and `is_lifetime`** (`src/lib/billing/history.functions.ts:74`).  
   Post-migration, `next_due_at` will be stale. The member-facing billing history panel will show the wrong renewal date. Fix: replace `legacy_stripe_link` lookup with a `subscriptions` table lookup for `current_period_end`.

5. **`buildActivePayingMemberCollection` fetches all three source tables on every admin page load** (`src/lib/admin/overview.functions.ts`, `src/lib/admin/reconciliation.functions.ts`).  
   After Phase 2, `legacy_stripe_link` and `bd_member_seed` arms are always empty sets. This is zero-risk for correctness but wastes two DB queries on every request. Remove in Phase 4.

6. **`getRenewalEngineStatus` reads `legacy_stripe_link.last_attempt_at`** for "recent renewal attempts" (`src/lib/ops/renewal-engine.functions.ts:78`).  
   Post-Phase 2, this table is frozen. The Renewal Engine ops card will show stale data indefinitely. Replace with a `subscriptions` query for recently-created BD subs.

### 🟡 MEDIUM

7. **`webhook-replay.functions.ts` and `webhook-recovery.functions.ts`** both contain Step 4 (`legacy_stripe_link` lookup, lines 223,234 and 139 respectively).  
   These run only on manual admin re-plays/diagnosis, so risk is low. Remove after Stripe metadata backfill is confirmed complete for all 390 customers.

8. **`reconciliation.functions.ts` forecast** uses `LEGACY_AMOUNT = 9900` as a fixed per-legacy-member revenue estimate (line 511).  
   After Phase 2, revenue comes from native invoice amounts. Update to use `subscriptions.amount_pence` (or Stripe's upcoming invoice API) for accuracy.

9. **`bd_migration` table** is empty and superseded. `DROP TABLE bd_migration;` is safe immediately.

10. **`is_lifetime` column** has 0 `true` rows. The code in `history.functions.ts:74` that reads it short-circuits to `next_due_amount_pence = null` for lifetime members. Dead branch. Drop column post-migration.

---

## 9. Pre-Cutover Safety Checks

Run these queries before Phase 2 executes in live mode:

```sql
-- 1. No row should be attempted twice. Confirm 0 rows already have a native subscription
--    AND are still in a cron-eligible status.
SELECT count(*)
FROM legacy_stripe_link
WHERE converted_subscription_id IS NOT NULL
  AND migration_status NOT IN ('renewed_to_verified', 'converted_to_subscription');
-- Expected: 0

-- 2. Confirm the 6 renewed_to_verified rows are excluded from Phase 2 batch.
SELECT bd_member_id, stripe_subscription_id, migration_status, converted_subscription_id
FROM legacy_stripe_link
WHERE migration_status = 'renewed_to_verified'
ORDER BY bd_member_id;
-- Phase 2 script must NOT touch these rows.

-- 3. No ready row should have a future access_expires_at (i.e. still active on old rail).
SELECT count(*)
FROM legacy_stripe_link
WHERE migration_status = 'ready'
  AND access_expires_at > now();
-- If > 0, those members are still "active" on the legacy rail. Migrating them early
-- does not double-bill (Stripe creates sub anchored to bd_next_due_date), but
-- confirm bd_next_due_date aligns with their actual renewal anchor.

-- 4. Every 'ready' row must have a stripe_customer_id.
SELECT count(*)
FROM legacy_stripe_link
WHERE migration_status = 'ready'
  AND stripe_customer_id IS NULL;
-- Expected: 0

-- 5. Every 'ready' row must have a corresponding bd_member_seed with bd_next_due_date set.
SELECT l.bd_member_id, l.email
FROM legacy_stripe_link l
LEFT JOIN bd_member_seed s USING (bd_member_id)
WHERE l.migration_status = 'ready'
  AND s.bd_next_due_date IS NULL;
-- Expected: 0 rows. Any row here cannot be safely anchored.

-- 6. No ready row's bd_next_due_date should be in the past by more than 365 days
--    (indicates stale/wrong anchor that would back-charge).
SELECT l.bd_member_id, l.email, s.bd_next_due_date
FROM legacy_stripe_link l
JOIN bd_member_seed s USING (bd_member_id)
WHERE l.migration_status = 'ready'
  AND s.bd_next_due_date < (current_date - interval '365 days');
-- Any matches need manual review before migration.

-- 7. After Phase 2 runs, confirm the old cron is fully shut down:
--    No legacy_stripe_link row with migration_status='pending' or 'ready' should have
--    last_attempt_at updated after the Phase 2 cutover timestamp.
SELECT count(*)
FROM legacy_stripe_link
WHERE migration_status IN ('pending', 'ready')
  AND last_attempt_at > '2026-06-28T00:00:00Z'; -- replace with actual cutover ts
-- Expected: 0 (confirms cron is disabled).

-- 8. After Phase 2 runs, every converted row should have a subscription in Stripe.
SELECT l.bd_member_id, l.converted_subscription_id, s.status
FROM legacy_stripe_link l
JOIN subscriptions s ON s.stripe_subscription_id = l.converted_subscription_id
WHERE l.migration_status = 'converted_to_subscription'
  AND s.status NOT IN ('active', 'trialing', 'past_due');
-- Expected: 0 non-active subscriptions immediately post-migration.

-- 9. Check for any subscription rows with migrated_from_bd=true that are ALSO
--    counted via legacy_stripe_link (would inflate Active Member count by 1 each).
SELECT sub.user_id, sub.stripe_subscription_id, l.bd_member_id, l.migration_status,
       l.access_expires_at
FROM subscriptions sub
JOIN legacy_stripe_link l ON l.stripe_customer_id = sub.stripe_customer_id
WHERE sub.migrated_from_bd = true
  AND l.access_expires_at > now()
  AND sub.status IN ('active', 'trialing');
-- Expected: 0. If non-zero, access_expires_at is still in the future on a row
-- whose member now has a live sub → legacy arm double-counts them in APM.
-- Fix: set access_expires_at = now() on those rows before Phase 2.
```

---

## Summary of Files to Delete in Phase 3 (post-cutover)

| File | Action |
|---|---|
| `src/routes/api/public/hooks/legacy-renewal.ts` | **Delete** |
| `src/lib/admin/stripe-linking.functions.ts` | **Delete** (or gut to only `getLegacyLinkingStats` for historical read) |
| `src/lib/ops/renewal-engine.functions.ts` | **Delete** (replace with native subscription ops view) |
| `src/components/ops/RenewalEngineCard.tsx` | **Delete** |
| Plan A block in `src/routes/api/public/hooks/lifecycle-cron.ts:75–115` | **Remove block** |
| `legacy_stripe_link` → `next_due_at`, `access_expires_at`, `legacy_kind`, `current_price_id`, `is_lifetime`, `eligible_for_legacy_price`, `stripe_schedule_id` columns | **Drop columns** |
| `bd_member_seed` → all `migration_cohort_*`, `migration_canonical_stripe_customer_id` columns | **Drop columns** post-Phase 2 complete |
| `bd_migration` table | **Drop table** |

