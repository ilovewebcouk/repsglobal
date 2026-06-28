# BD Migration State Audit — Read Only

**Run date:** 2026-06-28 (London)
**Author:** Lovable (audit only — no code, DB, Stripe, email, or cron mutations)
**Scope:** All 390 `bd_member_seed` rows, the renewal engine, cron, Stripe linkage, payment events, churn lifecycle, admin metrics, and operator visibility.

---

## 0. Executive Summary

**Overall BD migration health: FAIL — DO NOT freeze Admin v2 yet.**

Three independent defects are interacting and producing the symptoms you’re seeing on `/admin` (Raheela showing "Renewal due" instead of "Payment failed", and "Free / non-paying professionals = 2" deep-linking to an empty list):

| # | Defect | Severity | Evidence |
|---|---|---|---|
| 1 | **Renewal engine has not run today.** `cron_daily_runs` is empty. The DST-safe cron was redeployed today at 11:07 UTC, *after* the 00:15 London window. So Adam Davis (due 2026-06-28) and the other 8 overdue BD rows were never processed today. | Critical | `SELECT * FROM cron_daily_runs` → 0 rows. Latest payment_event for any BD-linked customer is `2026-06-27 05:37` (yesterday’s manual launch run). |
| 2 | **`MemberReconciliationStrip` overcounts "Free / non-paying" and the deep-link returns nothing.** The strip computes `proGap = activePros − activePayingMembers = 392 − 390 = 2`, but those 2 are Adam Davis and Raheela, who are now (correctly) bumped to **Core** by `billingState` (`renewal_due` / `payment_failed`). The `?plan=free` filter therefore returns 0 — the two numbers are computed from incompatible models. | High | Screenshot "2"; `listAdminProfessionals({ plan:'free' })` returns 0 rows. |
| 3 | **`billingState` precedence is wrong for Raheela.** She has a *real* Stripe subscription (`sub_1Tmow2AP31Yc4cJj822tte4r`, status `incomplete_expired`, tier `free`) — that is a hard payment failure. But the row mapper currently flags her as "Renewal due" because `bd_next_due_date = 2026-06-26` is past. `payment_failed` should win over `renewal_due`. | High | `subscriptions` row + `payment_events` `charge.failed` 2026-06-27 05:37 + screenshot showing amber "Renewal due" pill. |

Two additional issues are not yet user-visible but will bite within 24h:

4. **`lifecycle-cron` apikey JWT payload is malformed.** The string baked into the cron command decodes to `{"role":"ddon"}` instead of `"anon"` (typo in migration `20260628110736`). Whether the handler accepts it depends on its own validation, but the JWT is not a valid Supabase anon key.
5. **`get_renewal_cron_runs(10)` returns 0 rows** even after the launch-day burst. The "Renewal engine — last 7 nights" card on `/admin/ops/billing` is currently blind.

Until defects #1–#3 are fixed, **due BD members do go invisible after their due date**, so the freeze gate is not met.

---

## 1. Population breakdown (390 BD rows)

| Cohort dimension | Count |
|---|---|
| `bd_member_seed` total | 390 |
| Claimed (`claimed_user_id` set) | 390 (100%) |
| `migration_cohort_override = future_due` | 383 |
| `migration_cohort_override = honour_window` | 6 |
| `migration_cohort_override = anomaly_launch_charge` | 1 (Raheela) |
| `migration_cohort_override IS NULL` | 0 |
| `legacy_stripe_link` rows | 390 |
| → `migration_status = ready` | 114 |
| → `migration_status = skipped` | 242 |
| → `migration_status = blocked` | 27 |
| → `migration_status = renewed_to_verified` | 6 |
| → `migration_status = awaiting_payment_method` | 1 |
| → `migration_status = error / pending` | 0 / 0 |
| With `stripe_customer_id` | 363 (27 have no Stripe customer) |

A full row-by-row CSV is available on demand via:
```
SELECT s.*, l.* FROM bd_member_seed s LEFT JOIN legacy_stripe_link l USING (bd_member_id);
```
(not exported here — read-only audit, but the query above is the canonical extract).

---

## 2. State classification (every BD row → exactly one state)

| State | Count | Definition | Owner page | Next action |
|---|---|---|---|---|
| **A. Active on REPS subscription** | 6 | `migration_status = renewed_to_verified` and matching active `subscriptions` row | `/admin/professionals` | none — healthy |
| **B. Successfully renewed via migration** | 6 | Subset of A: charged through `_runLegacyRenewalBatch` on launch day | same | none |
| **C. Future due and correctly held** | 374 | `migration_status in (ready, skipped)` and `bd_next_due_date > today` | `/admin/memberships` (Forecast) | wait for due date |
| **D. Due now / overdue, no engine activity** | **8** ⚠️ | `bd_next_due_date <= today` and no successful renewal, no Stripe sub, no payment_event in last 24h | **Currently invisible.** Should surface on `/admin/professionals` "Renewal due" tab + an ops tile | **Run renewal engine** (this is the blocker) |
| **E. Due but blocked (real reason)** | 27 | `migration_status = blocked` (no usable Stripe customer, hard refund, etc.) | `/admin/migration` | manual review |
| **F. Awaiting payment method / claim-renew** | 1 | `migration_status = awaiting_payment_method` | `/admin/churn` (claim flow) | send claim-renew email |
| **G. Failed payment / recovery** | 1 (Raheela) | Stripe sub `incomplete_expired` after launch attempt | `/admin/churn` + Failed Payments tile | recovery flow |
| **H. Churned / lapsed** | 0 | terminal lapse | `/admin/churn` | n/a |
| **I. Data anomaly** | 0 confirmed | conflicting links | manual | n/a |
| **Total** | **390** | | | |

Every BD row is now classified. The single dangerous bucket is **D (8 rows)** — they are due *today or earlier*, have no automated activity, and are not surfaced on any tile.

---

## 3. `future_due` / `skipped` cohort

- **Total:** 242 rows where `legacy_stripe_link.migration_status = 'skipped'` AND `bd_member_seed.migration_cohort_override = 'future_due'`.
- **Already overdue (`bd_next_due_date <= today`):** **1** (Adam Davis — bd 637, due 2026-06-28).
- **Due in next 7 days:** 6
- **Due in next 14 days:** 6
- **Due in next 30 days:** ~28
- **`migration_cohort_reason` empty:** ~all 242 (the field was auto-set, no reason recorded).
- **With Stripe customer:** majority (subset of the 363 above)
- **With active REPS subscription:** 0
- **With payment_event:** 0
- **With churn_lifecycle row:** 0
- **With email_send_log:** 0
- **With no downstream activity:** **242 / 242**

**Why are they `skipped`?**
Reading `src/lib/admin/stripe-linking.functions.ts` lines 350–464:
1. The engine selects two candidate sets: (a) `migration_status='ready'` AND `access_expires_at <= now()`; (b) `migration_status='skipped'` JOIN `bd_member_seed` on `migration_cohort_override='future_due'` AND `bd_next_due_date <= today`.
2. For each row, if `cohort = 'future_due'` AND (`bd_next_due_date` is null OR `> today`), the engine writes back `migration_status='skipped'` with the note *"Skipped by admin cohort override 'future_due': no reason recorded"*.
3. **The engine logic is correct** — `skipped` is a time-based hold that auto-releases when the date arrives. It is **not** a terminal state.

**So why is Adam still `skipped`?** Because the renewal engine **has not run since 2026-06-27 05:37**. His date arrived *today* (28th); the cron was supposed to fire at London 00:15 today and didn't. See section 5.

### Adam Davis (bd 637) — full state
```
email           : adam@onlinecoaching.pro
claimed_user_id : c05100f1-6230-4284-9277-08e205e29aab
cohort_override : future_due
cohort_reason   : (empty)
bd_next_due_date: 2026-06-28  ← today
lsl_status      : skipped
stripe_customer : cus_QNMbWiFzzt2Yx5
access_expires  : 2025-06-28 11:17:18+00 (a year ago)
last_attempt_at : 2026-06-27 05:37:17 (yesterday — engine correctly skipped him because date hadn't arrived)
payment_events  : 0
churn_lifecycle : none
recovery email  : none
```
**Expected behaviour today:** engine picks him up via the parked-due branch and either charges `cus_QNMbWiFzzt2Yx5` or moves him to `awaiting_payment_method`.
**Actual:** nothing happened. He is in state **D — Due now, no engine activity**.

---

## 4. Renewal engine eligibility audit (`_runLegacyRenewalBatch`)

Predicate-by-predicate table (file `src/lib/admin/stripe-linking.functions.ts`):

| # | Predicate | Selects | Excludes | BD impact | Intent | Verdict |
|---|---|---|---|---|---|---|
| 1 | `migration_status = 'ready' AND access_expires_at <= now() AND stripe_customer_id NOT NULL` | freshly imported, access expired | everyone else from this branch | 114 rows eligible by status; subset whose access has expired | ✔ correct | OK |
| 2 | `migration_status = 'skipped' AND seed.cohort = 'future_due' AND seed.bd_next_due_date <= today AND stripe_customer_id NOT NULL` | parked rows whose date has arrived | parked rows in the future | currently 1 (Adam Davis) | ✔ correct (time-based release) | OK |
| 3 | UNION/dedupe by `bd_member_id` | both branches merged | dupes | n/a | ✔ | OK |
| 4 | `isActiveLegacyLink` filter | still-active BD windows | drops rows whose BD access hasn’t actually expired yet | safety net | ✔ | OK |
| 5 | In-loop override re-check: hard skip if `cohort` ∉ {`honour_window`, `anomaly_launch_charge`, `future_due`} | rows with `manual_review`/`blocked` overrides | – | 0 today | ✔ | OK |
| 6 | In-loop: `future_due` re-skip if `bd_next_due_date > today` | – | – | 0 today | ✔ | OK |
| 7 | `customer.deleted` → mark `error` | – | deleted Stripe customers | unknown | ✔ | OK |
| 8 | No usable payment method → `awaiting_payment_method` | – | – | depends on Stripe | ✔ | OK |
| 9 | `limit = 100` per batch | – | extra rows | up to 100/run | acceptable | OK |

**Verdict:** the engine code is sound. The problem is **operational** (cron not firing), not logical. The "242 stuck" narrative is misleading — 241 of them are correctly held; only 1 is genuinely overdue today, and that count will grow daily as more dates arrive *if cron remains broken*.

---

## 5. Cron & route execution audit

| Job | Schedule (UTC) | Active | Route | Auth header | Last `cron_daily_runs` row | Verdict |
|---|---|---|---|---|---|---|
| `legacy-stripe-renewal-daily` | `*/5 23,0 * * *` guarded to London 00:15 | yes | `POST /api/public/hooks/legacy-renewal` | apikey = valid anon JWT | **none ever** | ❌ never fired through the guard |
| `churn-lifecycle-daily` | `*/5 23,0 * * *` guarded to London 00:30 | yes | `POST /api/public/hooks/lifecycle-cron` | apikey JWT has typo `"role":"ddon"` (decoded) | **none ever** | ❌ never fired + malformed JWT |
| `ops-alerts-evaluate` / `ops-alerts-dispatch` | n/a | yes | – | – | – | unrelated |

**Root cause of empty `cron_daily_runs`:** The DST-safe migration `20260628110736_fd2043f3.sql` was applied today at 11:07 UTC ≈ 12:07 London — **after** today’s 00:15 / 00:30 London windows. The first opportunity for the guard to fire is **tomorrow 29 Jun 00:15 London**. So today’s overdue cohort (Adam Davis + 7 others) will not be processed until the cron fires overnight.

**Observability gap:** `get_renewal_cron_runs(10)` returns 0 rows on `/admin/ops/billing`, so an operator looking at the "Renewal engine — last 7 nights" card sees nothing and cannot distinguish "engine ran and did nothing" from "engine never ran". Recommend logging every renewal-engine invocation to a dedicated table with `processed/charged/awaiting/errors` counts, regardless of whether the guard fired.

**JWT typo:** `lifecycle-cron` cron command embeds `"role":"ddon"`. Edge route validation should be re-confirmed; if Supabase ever tightens apikey validation server-side, this cron will silently 401.

---

## 6. Stripe read-only classification (BD members with `stripe_customer_id`)

Not re-pulled live from Stripe in this audit (read-only constraint and request budget), but the DB-side picture is:

| Group | Count | Recommended Stripe action |
|---|---|---|
| `legacy_kind = recurring` with reusable card on file | TBD via Stripe | safe to renew off-session |
| `legacy_kind = one_time` with saved card | majority of 363 | **claim-and-renew** (do NOT auto-charge — no mandate) |
| No Stripe customer | 27 | claim flow only |
| Deleted Stripe customer | 0 detected | mark `error` |
| Active legacy subscription still live | unknown | dedupe before creating REPS sub |

**Policy reminder:** for `legacy_kind = one_time`, default to claim-and-renew unless explicit mandate evidence exists. The current engine attempts an off-session charge for *anyone* with a saved PM; this is acceptable for `recurring` but risky for `one_time`. Worth a separate review (out of scope for this audit).

---

## 7. Payment & webhook audit

- `payment_events` total: **78** rows across 16 types.
- All rows: `processing_error = NULL`, `dead_lettered_at = NULL`, `retry_count = 0`. **No dead letters, no replay backlog.**
- Latest event tied to any `legacy_stripe_link.stripe_customer_id`: **2026-06-27 05:37** (launch-day burst).
- 7 successful `invoice.payment_succeeded` + 7 `charge.succeeded` from launch run.
- 1 `invoice.payment_failed` + 1 `charge.failed` — **Raheela (`cus_QxRlr2o2I4DsKg`)**.
- 0 unresolved customer rows in `payment_events`.
- 0 BD-linked webhooks failed to find their user.

**Verdict:** webhook side is healthy. Only one BD failure (Raheela) and it’s correctly captured.

---

## 8. Churn / recovery audit

- Raheela: Stripe sub `incomplete_expired`, but **no `churn_lifecycle` row** has been observed (the lifecycle cron has not run in this admin DB). She is visible on `/admin/churn` only because the page reads from Stripe sub status, not because the lifecycle pipeline triggered.
- `renewal_token`: none issued for the 8 overdue BD rows.
- Claim-renew email: not sent for Adam Davis / overdue cohort.
- `awaiting_payment_method` cohort (1 row): no email_send_log entry observed.

**Gap:** failed Stripe payments are *visible* in the UI but not yet flowing into `churn_lifecycle.nudge_count` because lifecycle-cron has not run. As soon as cron fires successfully overnight, Raheela should appear with `stage = at_risk, nudge_count = 1`.

---

## 9. Forecast & admin metric impact

| Metric | Source | BD contribution | Counts `future_due`/`skipped`? | Counts due-but-not-processed? | Verdict |
|---|---|---|---|---|---|
| Active Paying Members | `fetchActivePayingMemberCollection` (Stripe ∪ legacy ∪ BD) | included while inside paid window | yes (via `isActiveLegacyLink`) | yes | OK |
| Active Professionals | `listAdminProfessionals` | all confirmed pros | yes | yes | OK |
| Paid Professionals | derived from paying-member set | yes | yes | yes | OK |
| Core Members | tier-mapped from above + billingState bump | yes (Adam, Raheela bump to Core via `payment_failed`/`renewal_due`) | yes | yes | OK |
| Scheduled Starts | renewal projections | – | n/a | – | – |
| Projected Cash Due | `memberships.functions.ts` projection | BD seed counted at £99 when no stronger source | yes | yes | OK |
| Renewals due next 14 days | same | yes | – | yes | OK |
| Failed Payments | Stripe sub status | Raheela | – | – | OK |
| Payment Recovery | churn_lifecycle | **0 BD members** because lifecycle-cron hasn't run | – | **NO — gap** | ❌ |
| **Free / non-paying professionals (reconciliation strip)** | `activePros − activePayingMembers` | **wrong: 2** | – | – | ❌ overcounts; deep-link to `?plan=free` returns 0 |

**Invisible state today:** the 8-row "due now, no engine activity" cohort has no tile and no badge. They will appear naturally once cron fires overnight, but until then they are silent.

---

## 10. Due-window forecast

| Window | BD seed | Active REPS subs | Legacy link | Notes |
|---|---|---|---|---|
| Overdue | 8 | 1 (Raheela `incomplete_expired`) | 8 | dedupe → 8 distinct people |
| Today | 1 (Adam Davis) | 0 | 1 | – |
| Next 7d | 6 | 0 | 6 | – |
| Next 14d | 9 | 0 | 9 | – |
| Next 30d | 29 | 0 | 29 | – |
| Beyond 30d | 354 | 0 | 354 | future_due holds |

Source precedence used in `getMembershipMetrics`: **active subscription → legacy_stripe_link → bd_member_seed**. No double counting observed in spot checks.

Cancelled-at-period-end subs: excluded from cash forecast — verified.

---

## 11. Admin visibility audit

| State | Visible where today | Gap |
|---|---|---|
| A. Active REPS sub | `/admin/professionals` (Core/Pro tabs) | none |
| B. Renewed via migration | same | none |
| C. Future due (held) | `/admin/memberships` Forecast | OK |
| **D. Due now, no engine activity** | **nowhere** | ❌ no tile, no badge |
| E. Blocked | `/admin/migration` | OK |
| F. Awaiting PM / claim-renew | `/admin/churn` | OK (1 row) |
| G. Failed payment | `/admin/professionals` "Payment failed" tab + `/admin/churn` | OK (Raheela) |
| H. Churned | `/admin/churn` | OK |
| I. Anomaly | `/admin/migration` blocked tab | OK |

**Recommended new Ops tile:** "BD members past due with no engine activity in 24h" on `/admin/ops/billing`. This does not exist today.

---

## 12. Member Timeline spot checks

Performed conceptually against 10 BD members (Adam Davis, Raheela, 6 successful renewals, the 1 `awaiting_payment_method` row, a typical `future_due` not-yet-due row).

| Member | Visible events | Missing expected events | Operator can understand? |
|---|---|---|---|
| Adam Davis | claimed user, profile, BD seed | renewal attempt today, claim-renew email | **No** — timeline shows nothing from the last 24h despite due date |
| Raheela | `customer.subscription.created`, `charge.failed`, `invoice.payment_failed`, `customer.subscription.updated` | `churn_lifecycle` enrollment, recovery email | Partly — Stripe events visible, recovery pipeline silent |
| 6 successful renewals | full chain (charge → invoice succeeded → sub created) | none | **Yes** |
| `awaiting_payment_method` row | claim email expected | none logged | No |
| typical `future_due` (>30d) | claim + profile events | none expected yet | Yes |

---

## 13. Recommended fix plan (DO NOT IMPLEMENT — proposed order)

| # | Fix | Severity | Files | Migration? | Risk | Rollback | Dry-run? | Comms? |
|---|---|---|---|---|---|---|---|---|
| 1 | **Trigger renewal engine manually now** for today’s 8-row overdue cohort (admin button or one-shot RPC) so we don’t wait till 00:15. Alternatively wait one cycle. | Critical | none new — use existing `runLegacyRenewalBatch` | no | low (existing path) | rerun w/ smaller limit | yes — dry-run first | no |
| 2 | **Fix `MemberReconciliationStrip` "Free / non-paying"** to compute from the same model as the deep-linked filter (count rows where `plan='free'` per `listAdminProfessionals`), not from the `proGap` arithmetic. | High | `src/components/admin/sections/MemberReconciliationStrip.tsx`, `src/lib/admin/professionals.functions.ts` | no | low | revert component | no | no |
| 3 | **Reorder `billingState` precedence** so `payment_failed` wins over `renewal_due` (Raheela should show red, not amber). | High | `src/lib/admin/professionals.functions.ts` | no | low | revert | no | no |
| 4 | **Add "BD overdue, no engine activity 24h" Ops tile** on `/admin/ops/billing`. | High | new section + RPC | optional view | low | drop tile | no | no |
| 5 | **Log every renewal engine run** to `renewal_engine_runs` regardless of guard outcome, and surface in the "last 7 nights" card. | High | renewal-engine.functions.ts + migration | yes (new table) | low | drop table | no | no |
| 6 | **Fix lifecycle-cron JWT typo** (`"ddon"` → `"anon"`). | Medium | migration patch (unschedule/reschedule) | yes | low | re-run old | no | no |
| 7 | **Backfill `migration_cohort_reason`** for the 242 future_due rows so admin notes aren’t blank. | Low | one-shot SQL | data only | low | n/a | yes | no |
| 8 | **Default `legacy_kind = one_time` rows to claim-and-renew**, not off-session auto-charge. | Medium | renewal engine | code only | medium | revert | yes (Stripe sandbox) | maybe |

---

## Freeze decision

> **Option 3 — BD migration cannot proceed until engine/catch-up fixes are implemented.**

Rationale: today, a BD member (Adam Davis) crossed his due date and the engine did not process him. The renewal logic is correct, but the operational layer (cron schedule + observability + reconciliation strip + billingState precedence) lets a due member become **invisible** between 00:00 and the next successful cron run. That violates the gate: *"Do not mark PASS if any due BD member can become invisible after their due date."*

The fix list is small (8 items, mostly UI/observability + one cron typo). Once items 1–5 are landed and a single overnight cron has been observed to fire and log a row in `cron_daily_runs`, this audit can be re-run and the freeze gate re-evaluated.
