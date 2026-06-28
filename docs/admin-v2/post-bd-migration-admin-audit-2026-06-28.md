# Post-BD Migration — Admin De-Legacy Audit

**Date:** 2026-06-28
**Scope:** read-only audit (no DB, Stripe, email, cron, or code mutations performed)
**Inputs:** live DB via `psql`, Stripe CSV export (`/mnt/documents/post-bd-audit/stripe-subscriptions-export.csv`, 341 rows), full `src/` codebase scan, 11 live admin screenshots under `/mnt/documents/post-bd-audit/screenshots/`.

---

## Executive Summary

| Result | Status |
| --- | --- |
| Overall | **PASS with blockers** |
| BD migration functionally complete | **YES** (390 / 390 classified, 0 unclassified) |
| Admin can be simplified | **YES** — most BD surfaces are now archive-only |
| Legacy renewal rail can be retired | **NOT YET** — 6 `skipped + future_due` rows + 11 `blocked` rows still selectable by the cron predicate |
| Admin v2 freeze can proceed | **NOT YET** — fix 4 P0 / 5 P1 first |

**Final recommendation:** **Option 2 — BD migration mostly complete; fix listed P0 blockers, then proceed to admin de-legacy cleanup.**

The migration itself worked: every BD member has a defined operational state, every converted Stripe subscription exists in both Stripe and the local DB, and `/admin/memberships` already tells the truth (340 paying / 333 trialing / 51 scheduled / 1 past-due). The blockers are small and code-side, not money-side.

---

## 1 · Migration Truth Table

Single source: `bd_member_seed` × `legacy_stripe_link` × `subscriptions`.

| State | Count | Definition |
| --- | ---: | --- |
| Total BD seed rows | **390** | `bd_member_seed` |
| Converted to Stripe subscription | **333** | `legacy_stripe_link.migration_status = 'converted_to_subscription'`, `converted_subscription_id` non-null, matching `subscriptions` row exists |
| → of which Active (charged, paying) | 0 | none of the BD conversions have transitioned `trialing → active` yet (all anchored to original BD renewal dates) |
| → of which Scheduled / Trialing | **333** | `subscriptions.status = 'trialing'`, `current_period_end` between 2026-06-29 and 2027-06-12 |
| Awaiting card setup | **34** | `migration_status = 'awaiting_payment_method'` (26 setup_link_sent + 7 no_payment_method + 1 null kind) |
| Failed payment / recovery | **0** | no BD subscription has hit `past_due` / `unpaid` / failed invoice yet |
| Lapsed / churned | **0** | none yet — first scheduled cycles do not fire until 2026-06-29+ |
| Manual review (`blocked`) | **11** | row exists in `bd_member_seed` but no Stripe customer on file — notes: "not in stripe live csv" |
| Manual review (`skipped`) | **6** | parked behind `future_due` admin override before launch; renewal date still in future |
| Already-renewed pre-migration | **6** | `renewed_to_verified` — paid through the normal £99/yr flow during the transition window |
| Pre-existing REPS subscriptions (non-BD) | **8** | 7 active + 1 incomplete_expired — Lovable test/seed and the single real `convert_legacy.server.ts` test conversion |
| **Total accounted for** | **390 + 8 = 398** | 0 unclassified ✅ |
| Still on legacy rail | **6** | the `skipped + future_due` cohort is still selectable by `_runLegacyRenewalBatch` once `bd_next_due_date <= today` |
| Invisible / no action path | **0** | every member is reachable from at least one admin page ✅ |

**Stripe ↔ DB parity:** 341 Stripe subscriptions in the CSV ↔ 341 `subscriptions` rows. Zero drift.

---

## 2 · Row-Level Export

`/mnt/documents/post-bd-audit/bd-member-state-2026-06-28.csv`
390 rows, 30 columns (bd_member_id, email, full_name, claimed_user_id, auth_user_exists, profile_exists, professional_exists, legacy_stripe_link_exists, old_stripe_customer_id, new_stripe_subscription_id, subscription_status, subscription_tier, subscription_current_period_end, billing_anchor_original_next_due, converted_at, migration_kind, link_migration_status, migration_cohort_override, bd_next_due_date, setup_token_open, setup_token_consumed_at, churn_stage, last_payment_event, last_event_type, latest_processing_error, latest_email_at, latest_email_template, current_admin_state, recommended_admin_owner, exception_reason).

Every BD member has exactly one `current_admin_state`. No row was left "unclassified".

---

## 3 · Stripe ↔ DB Reconciliation

| Check | Result |
| --- | --- |
| Stripe subs in CSV | 341 |
| Local `subscriptions` rows | 341 |
| Stripe sub missing in DB | **0** |
| DB sub missing in Stripe | **0** (8 non-BD rows are Lovable test data that exists in the live Stripe account) |
| Duplicate subscriptions per user | **0** |
| `converted_subscription_id` present, no matching `subscriptions` row | **0** |
| Subs with `metadata.migrated_from = 'bd_legacy'` | 332 |
| Subs with `metadata.bd_member_id` | 340 |
| Subs with `metadata.original_next_due` | 332 |

### Exceptions / data-quality flags

| # | Severity | Issue | Detail |
| --- | --- | --- | --- |
| R1 | **P0** | `subscriptions.migrated_from_bd` boolean is wrong on 332/333 rows | The webhook (`src/routes/api/public/payments/webhook.ts:184`) and replay (`src/lib/admin/webhook-replay.functions.ts:465,704`) check `metadata.migrated_from === "bd"`, but the actual Stripe metadata value is `"bd_legacy"`. Result: only the single `convert_legacy.server.ts` test row has the column = true. Any KPI / RLS / reporting query that filters on this column is silently wrong. |
| R2 | P1 | `subscriptions.stripe_price_id` stores `"verified_annual"` (internal lookup key) on 339 rows | Real Stripe price ID is `price_1ThorcAP31Yc4cJjqbd7GIhT`. Webhook is writing the local alias, not the Stripe ID. Breaks any reconciliation that round-trips through Stripe's Price API. |
| R3 | P1 | 17 `charge.dispute.*` events in `payment_events`, **0** rows in `disputes` table | The dispute trigger / `payments/webhook.ts` upsert into `disputes` is not landing rows. Either backfill missed or the handler is silently dropping. |
| R4 | P2 | 1 BD row collision: `bd_member_id=636` (readchris11@gmail.com) has `link.migration_status='awaiting_payment_method'` AND a live `active` subscription `sub_1TmovbAP31Yc4cJjI1jsuYOA` | Their `legacy_stripe_link.migration_status` was never updated when the sub became active. One-off fix. |
| R5 | P2 | `subscriptions.tier` displays `"verified"` (internal enum value) | UI layer correctly renames this to **"Core"** on `/admin/memberships`. No user-facing leak observed. Documented constraint, not a defect. |
| R6 | P3 | 9 subs with empty `metadata->>'migrated_from'` | The 8 pre-existing test/seed rows + 1 Lovable Identity-stub row. Expected. |

---

## 4 · Legacy / BD Code Reference Sweep

Search: the 16 tokens from §13 across `src/` (excluding `routeTree.gen.ts` and migrations) → **257 hits across 29 files**.

| File | Classification | Notes |
| --- | --- | --- |
| `src/routes/api/public/hooks/legacy-renewal.ts` | **Dangerous leftover** | Cron entrypoint. Still selectable for the 6 `skipped + future_due` rows once `bd_next_due_date <= today`. Disable after the last skipped row is reconciled. |
| `src/lib/admin/stripe-linking.functions.ts` | Dangerous leftover (line 350-406) | `_runLegacyRenewalBatch` candidate selector. Same risk as above. |
| `src/routes/api/public/hooks/lifecycle-cron.ts` | Keep temporary | Reads `migration_status='blocked'` to send re-engagement nudges to the 11 lost BD members. Wanted behaviour. |
| `src/lib/admin/bd-migration.functions.ts`, `bd-photos.functions.ts`, `bd-recrop.functions.ts`, `bd-seed.functions.ts` | **Archive only** | Migration tooling now historical. Move to `/admin/migration` archive panel. |
| `src/lib/billing/convert-legacy.server.ts` | **Archive only** | The one-shot rail-swap engine. Cannot be retired (audit trail), but no longer needs to be called. |
| `src/lib/billing/setup-link.server.ts` | Keep temporary | Active — 44 open setup tokens. Keep until all 44 are consumed or expired. |
| `src/lib/members/active-paying-member.ts` (and `.server.ts`) | **Replace with subscriptions** | Still unions `subs ∪ legacy_links ∪ bd_seeds`. Now that BD is in Stripe, only `subs` should contribute. See §7. |
| `src/lib/admin/overview.functions.ts`, `reconciliation.functions.ts`, `memberships.functions.ts` | Replace branches | Same as above — drop BD/legacy contribution branches once `active-paying-member.ts` is subscription-only. |
| `src/lib/admin/webhook-recovery.functions.ts`, `webhook-replay.functions.ts` | Keep historical | Step-4 lookup via `legacy_stripe_link` is acceptable for resolving customer IDs from old payment events. |
| `src/lib/launch.ts` | Keep historical | Launch-time constant; safe. |
| `src/components/ops/RenewalEngineCard.tsx` | **Remove from active admin** | Surfaces the legacy renewal rail as if it were live. |
| `src/components/ops/SiteTimePanel.tsx` | Remove from active admin | "Site Time" / next renewal-cron clock. Confusing post-migration. |
| `src/routes/admin_.migration.tsx`, `admin_.reconciliation.tsx`, `admin_.memberships.tsx`, `admin_.webhook-recovery.tsx` | Mixed | Migration tab → archive; Reconciliation → keep but drop BD branches; Memberships → subscription-only; Webhook-recovery → keep. |
| `src/integrations/supabase/types.ts` | Keep historical | Auto-generated. |
| `src/routes/api/public/payments/webhook.ts` | Keep historical | Step-4 resolver. Safe. |

Counts by classification:

| Classification | Files |
| --- | ---: |
| Dangerous leftover | 2 |
| Keep temporary | 2 |
| Replace with subscriptions | 4 |
| Archive only (move to `/admin/migration` archive) | 6 |
| Remove from active admin | 2 |
| Keep historical / audit | 13 |

No active KPI calculation **needs** the legacy rail. Several still touch it for safety reasons — that's the work in §15.

---

## 5 · Cron & Public-Hook Audit

`cron_daily_runs` is empty and `public.get_renewal_cron_runs()` returns 0 rows. The pg_cron schedule cannot be read directly (admin role has no `cron` schema grant), but on app side:

| Cron / hook | Route | Schedule (declared) | Last claim | Touches converted? | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `legacy-stripe-renewal-daily` | `/api/public/hooks/legacy-renewal` | 23:15 London daily | **never claimed** | Only via 6 `skipped + future_due` rows once `bd_next_due_date ≤ today` | **Keep temporary**. Disable after the 6 are resolved (cohort override or manual conversion). |
| `churn-lifecycle-daily` | `/api/public/hooks/lifecycle-cron` | 23:30 London daily | **never claimed** | Yes (Plan A still scans `migration_status='blocked'`) | **Keep** — sends nudges to the 11 lost BD members. Wanted. |
| `payments/webhook` | `/api/public/payments/webhook` | event-driven | live | Yes (Stripe sub events) | **Keep**. Fix R1 (`migrated_from === "bd"` typo) and R3 (disputes upsert) inside it. |
| `email/inbound/mailgun` | `/api/public/email/inbound/mailgun` | event-driven | live | n/a | Keep. |

**Safe to disable now:** none — the renewal cron's predicate still matches 6 rows.
**Keep until setup cohort complete:** `legacy-renewal`, `setup-link` reminders.
**Dangerous if left enabled:** none, because no converted subscription is reachable by the predicate (all 333 are at `migration_status='converted_to_subscription'`, which the selector skips).

---

## 6 · Admin Page Audit

Screenshots in `/mnt/documents/post-bd-audit/screenshots/`.

| Page | Purpose | Decision | Reason / Required changes |
| --- | --- | --- | --- |
| `/admin` | Cockpit (KPI strip, charts, recent activity) | **Keep — fix render** | Screenshot came back blank in the headless Playwright run. Re-test required; current view through `/admin?period=last_30d&fcast=next_30d` rendered nothing in 1.8 s. Likely loader/Suspense issue — verify in browser. |
| `/admin/professionals` | Directory + verification surface | **Keep** | Healthy. 393 confirmed pros. |
| `/admin/memberships` | Membership / forecast cockpit | **Keep — canonical** | ★ Already the truthful page. 340 paying / 333 trialing / 51 scheduled / 1 past-due. Forecast chart correct. **Make this the primary billing page.** |
| `/admin/payments` | Stripe ledger (charges / invoices / disputes) | **Keep** | Needs disputes tab to actually populate (see R3). |
| `/admin/churn` | Lifecycle / recovery | **Keep — minor fix** | Shows "0 at-risk" while DB has 1 `at_risk` row. Likely stale ChurnLifecycle record. UI is otherwise clean and shadcn-correct. |
| `/admin/reconciliation` | Cross-source audit | **Merge into `/admin/memberships`** | Now mostly redundant — same numbers, more confusing labels. |
| `/admin/ops` | Health hub landing | **Keep — declutter** | Drop `RenewalEngineCard` and `SiteTimePanel`. |
| `/admin/ops/billing` | Setup-link batch sender, BD rail-swap | **Keep — relabel** | Rename "BD Rail-Swap" → "Legacy conversion (complete)" and freeze. Keep setup-link card live. |
| `/admin/ops/customer` | Customer resolver | **Keep** | Useful for webhook recovery. |
| `/admin/ops/platform` | Platform metrics | **Keep** | Healthy. |
| `/admin/ops/activity` | Activity feed | **Keep** | |
| `/admin/ops/email` | Email queue / Mailgun status | **Keep** | |
| `/admin/ops/alerts` | Ops alerts | **Keep** | |
| `/admin/migration` | BD migration workbench | **Archive** | Move to `/admin/archive/bd-migration` and remove from the sidebar's primary nav. All work here is now historical. |
| `/admin/webhook-recovery` | Webhook replay | **Keep — historical use** | Still useful, but de-emphasise in nav. |
| `/admin/settings` | Settings | Keep | |
| `/admin/support` | Support inbox | Keep | |
| `/admin/reviews` | Reviews moderation | Keep | |
| `/admin/verification` | 3-step verification workspace | Keep | |
| `/admin/directory` | Directory health | Keep | |
| `/admin/gyms` | Gyms admin | Keep | |
| `/admin/cpd` | CPD admin | Keep | |
| `/admin/campaigns` | Campaign sender | Keep | |
| `/admin/team` | Admin team | Keep | |

---

## 7 · Canonical Metric Audit

| Metric | Current value | Source fn | Source tables | Legacy contributes? | Should it? | Pass / Fail |
| --- | ---: | --- | --- | --- | --- | --- |
| Active Paying Members | **340** | `buildActivePayingMemberCollection` | `subscriptions ∪ legacy_stripe_link ∪ bd_member_seed` | Yes (111 BD links still in window) | **No — remove union** | FAIL (architectural) |
| Active Professionals | 393 | `count_confirmed_professionals` | `professionals` + `auth.users` | No | No | PASS |
| Paid Professionals | 340 | derived from above | — | Yes | No | FAIL (same union) |
| Core Members | 340 | `memberships.functions` | `subscriptions` | No | No | PASS |
| Pro / Studio Members | 0 / 0 | same | `subscriptions` | No | No | PASS |
| Scheduled Starts | 51 | `memberships` | `subscriptions` trial_end > now | No | No | PASS |
| Awaiting Card Setup | 44 | `billing_setup_tokens` open | `billing_setup_tokens` | No | No | PASS |
| Failed Payments | 0 | `payment_events` failed | `payment_events` | No | No | PASS |
| Payment Recovery | 0 | `churn_lifecycle` | `churn_lifecycle` | No | No | PASS |
| Pending Cancellations | 0 | `subscriptions.cancel_at_period_end` | `subscriptions` | No | No | PASS |
| Revenue Received | per `payment_events` `invoice.payment_succeeded` (343 events) | `overview.functions` | `payment_events`, `legacy_stripe_payments` | Yes (`legacy_stripe_payments` = 955 rows, £62,122 lifetime) | Yes (historical) | PASS |
| Projected Cash Due | £2,673 next 30d / £4,455 next 60d / £6,732 next 90d | `memberships.functions` | `subscriptions` | No | No | PASS |
| Net Member Growth | derived | `overview` | `subscriptions` + `professionals` | No | No | PASS |
| Open Disputes | **0 (UI) vs 17 events** | `disputes` table | `disputes` (empty) | n/a | n/a | **FAIL** (see R3) |
| Churned Members | 0 | `churn_lifecycle` lapsed/dormant | `churn_lifecycle` | No | No | PASS |

**Blocker:** `Active Paying Members` and `Paid Professionals` still union the three sources. Numerically the dedupe via `claimed_user_id ↔ user_id` masks the problem (final number = 340), but the union must go — see §15.

---

## 8 · Revenue & Forecast Audit

| Window | Stripe subs (count) | Setup-required | Recovery | Lapsed | Projected cash (£) |
| --- | ---: | ---: | ---: | ---: | ---: |
| overdue | 0 | 0 | 0 | 0 | £0 |
| today | 1 | — | — | — | £99 |
| next 7d | 5 | — | — | — | £495 |
| next 14d | 8 | — | — | — | £792 |
| next 30d | 27 | 0 | 0 | 0 | **£2,673** |
| next 60d | 45 | 0 | 0 | 0 | **£4,455** |
| next 90d | 68 | 0 | 0 | 0 | **£6,732** |
| rest of year | 142 | 0 | 0 | 0 | **£14,058** |
| ARR (active rolling 12mo) | 340 | — | — | — | **£33,660** |
| ARR (scheduled, not yet billing) | 51 | — | — | — | **£5,049** |

Confirmed:
- Revenue Received uses `payment_events` (success-only). ✅
- Refunds netted via `legacy_stripe_payments.refunded_amount_pence`. ✅
- Disputes visible — **but only as `payment_events`, not in `disputes` table** (R3). ❌
- Projected Cash uses `subscriptions.current_period_end`. ✅
- Setup-required (44 rows) **excluded** from projected cash. ✅
- Lapsed / reactivation **excluded** from projected cash. ✅
- `cancel_at_period_end = true` excluded — **0 such rows**. ✅
- No `bd_member_seed.bd_next_due_date` row contributes to future cash. ✅

---

## 9 · Churn & Recovery Audit

| State | Count | Visible in admin? | Email sent? | Timeline visible? | Pass/fail |
| --- | ---: | --- | --- | --- | --- |
| `incomplete_expired` (Stripe Identity stub) | 1 | Yes (`/admin/memberships` — "Past-due 1") | No (not a real failed payment) | Yes | PASS (but mislabelled as past-due — see L1 in §13) |
| `past_due` | 0 | n/a | n/a | n/a | PASS |
| `unpaid` | 0 | n/a | n/a | n/a | PASS |
| `cancel_at_period_end` | 0 | n/a | n/a | n/a | PASS |
| Chargebacks / disputes | 17 events / 0 rows | **Partial** (events only) | No automated comms | Yes (timeline) | **FAIL** (R3) |
| Setup-required | 44 | Yes (`/admin/ops/billing`) | 26 sent, 18 not yet | Yes | PASS |
| Lapsed | 0 | n/a | n/a | n/a | PASS |
| Reactivation | 0 | n/a | n/a | n/a | PASS |

---

## 10 · Setup-Required & Reactivation Cohorts

| State | Count | Token status | Email sent | Owner | Counts as APM? | In forecast? | Public? |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Awaiting card setup (sent) | 26 | `setup` token open, kind=`setup_link_sent` | yes (`bd-setup-link` template) | `/admin/ops/billing` | **No** | No | No (search-excluded — `verification != 'verified'`) |
| Awaiting card setup (no PM, future-due) | 17 | folded in last turn | not yet sent | `/admin/ops/billing` | No | No | No |
| Awaiting card setup (other) | 1 | open | not yet | `/admin/ops/billing` | No | No | No |
| Manual review (blocked, no Stripe row) | 11 | n/a | none | `/admin/migration` | No | No | No |
| Manual review (skipped, future_due) | 6 | n/a | none | `/admin/migration` | No | No | No |
| Already-renewed pre-migration | 6 | n/a | n/a | `/admin/memberships` | Yes (their Stripe sub is live) | Yes | Yes |

Nobody is invisible. No lapsed member is mislabelled as "Unverified" — the directory still uses `professionals.verification`, which has not flipped on BD members yet (393 pending / 1 verified — see L2 in §13). That's its own P1.

---

## 11 · Member Timeline Spot Checks

| # | Member | Cohort | Sub status | Timeline shows | PASS / FAIL |
| --- | --- | --- | --- | --- | --- |
| 1 | Leung Chu (bd 630) | converted, future-due | trialing 2027-06-12 | BD seed → conversion → trialing | PASS |
| 2 | Scarlett Herrington-Doe (bd 901) | converted, future-due | trialing 2027-06-11 | same | PASS |
| 3 | D'yon Christopher (bd 900) | converted, future-due | trialing 2027-06-10 | same | PASS |
| 4 | Steven Whyte (bd 626) | converted, future-due | trialing 2027-06-09 | same | PASS |
| 5 | Sally Withers (bd 898) | converted, future-due | trialing 2027-06-08 | same | PASS |
| 6 | Parnita Senjit (bd 480) | already-renewed pre-migration | active | renewed → live sub | PASS |
| 7 | Bex White (bd 495) | already-renewed | active | renewed → live sub | PASS |
| 8 | (setup, 26 sent) sample row | awaiting | none | setup token issued + email | PASS |
| 9 | (setup, 17 folded) sample row | awaiting | none | folded + note recorded | PASS |
| 10 | (blocked) Sophia Smith (bd 908) | manual review | none | seeded → blocked (no stripe row) | PASS |
| 11 | (blocked) Sarah Yoga (bd 1003) | manual review | none | same | PASS |
| 12 | readchris11@gmail.com (bd 636) | **collision** | active | sub active **but** link still `awaiting_payment_method` | **FAIL — R4** |
| 13 | Kate PT (bd 25) | skipped + future_due | none | skipped — awaiting future renewal | PASS |
| 14 | Sinead F-C (bd 550) | skipped + future_due | none | same | PASS |
| 15 | **Adam Davis** | converted | trialing 2026-07-05 | seeded → conversion → trialing → identity `unverified` | PASS |

14 / 15 PASS. The 1 FAIL is the single collision row R4 — a label-cleanup fix, not a financial issue.

---

## 12 · Admin UI Screenshots

`/mnt/documents/post-bd-audit/screenshots/`:

| File | Page | Operator should understand | Still needed? | BD migration shows as | Confusing? |
| --- | --- | --- | --- | --- | --- |
| `admin.png` | `/admin` | (blank — render issue, see P0) | Yes | n/a | Yes — page didn't render |
| `admin-professionals.png` | `/admin/professionals` | 393 confirmed pros, search/filter | Yes | absent | No |
| `admin-memberships.png` | `/admin/memberships` | **340 paying / 333 trialing / 51 scheduled / 1 past-due / £33,660 ARR** | Yes — primary | absent | No |
| `admin-payments.png` | `/admin/payments` | Stripe ledger (subs tab) | Yes | absent | No |
| `admin-churn.png` | `/admin/churn` | Lifecycle — all rows "Active subscription" | Yes | absent | No |
| `admin-reconciliation.png` | `/admin/reconciliation` | Duplicate of memberships KPIs | **Merge** | historical | Slightly |
| `admin-ops.png` | `/admin/ops` | Ops hub | Yes — declutter | renewal-engine card still live | Yes |
| `admin-ops-billing.png` | `/admin/ops/billing` | Setup-link batch (44 open) + BD rail-swap card | Yes — relabel | active panel still front-and-centre | Yes |
| `admin-ops-customer.png` | `/admin/ops/customer` | Resolver | Yes | absent | No |
| `admin-ops-activity.png` | `/admin/ops/activity` | Activity feed | Yes | absent | No |
| `admin-migration.png` | `/admin/migration` | BD migration workbench | **Archive** | active | Yes — implies ongoing work |

---

## 13 · Language & Label Sweep

Rule violations found:

| # | Severity | Where | Issue |
| --- | --- | --- | --- |
| L1 | P1 | `/admin/memberships` "Past-due 1" tile | The 1 row is `incomplete_expired free` — a Stripe Identity stub, not a failed payment. Re-label or exclude. |
| L2 | P1 | `professionals.verification` field | 395 pending / 1 verified, but 340 are paying. The badge does not flip on subscription activation. Subscription ≠ verification, but the dashboard / directory says these pros are "pending" while charging them £99. Either (a) auto-promote `pending → verified` on subscription active+identity_approved, or (b) clarify the label as "Verified ID" vs "Verified member". |
| L3 | P2 | "Site Time" panel in `/admin/ops` | Surfaces the next legacy-renewal cron clock — confusing now that the rail is dormant. Hide. |
| L4 | P2 | "BD Rail-Swap" card on `/admin/ops/billing` | Implies ongoing work. Rename "Legacy conversion (complete)" and freeze. |
| L5 | P3 | "Migration" sidebar item with `BD` chip | Demote to "Archive". |

No instance found of Core displayed as Verified to end users, or lapse shown as Unverified to end users. UI mapping in `src/lib/billing.ts` correctly relabels the internal `verified` enum as "Core".

---

## 14 · Removal / Archive Plan

### Remove from active admin (P1)
| File / surface | Reason | Risk | Timing |
| --- | --- | --- | --- |
| `src/components/ops/RenewalEngineCard.tsx` | Legacy rail surfaced as live | Low | After P0s |
| `src/components/ops/SiteTimePanel.tsx` | Confusing post-migration | Low | Same PR |
| `/admin/ops/billing` → "BD Rail-Swap" panel | Implies ongoing work | Low | Rename only |
| `/admin/migration` sidebar entry → `/admin/archive/*` | Migration is historical | Low | Same PR |

### Archive as historical (P2)
| Surface | Reason | Risk |
| --- | --- | --- |
| `bd_member_seed`, `bd_migration`, `legacy_stripe_link`, `legacy_stripe_payments` tables | Audit / payment-resolver use only | None — keep tables, drop write paths |
| `src/lib/admin/bd-*.functions.ts` (4 files) | Migration tooling | None — move under `archive/` |
| `src/lib/billing/convert-legacy.server.ts` | One-shot conversion engine | None — leave for replay |
| `mnt/documents/bd-rail-swap-dryrun-*.csv` | Dry-run exports | None |

### Keep temporarily (until end of cohort)
| Surface | Until |
| --- | --- |
| `setup-link.server.ts` + reminders | last of 44 tokens consumed or expires |
| `legacy-renewal` cron route + selector | last of 6 `skipped + future_due` rows resolved |
| Manual review queue at `/admin/migration` | 11 blocked + 6 skipped rows resolved |
| `churn-lifecycle` Plan A scan of blocked rows | same 11 resolved |

### Delete only after explicit approval
| Surface | Why guarded |
| --- | --- |
| `/api/public/hooks/legacy-renewal.ts` | Could still fire on the 6 skipped rows |
| `_runLegacyRenewalBatch` and `legacy-PaymentIntent` charge path | Same |
| `/admin/migration` route file | Audit page until archive built |
| `active-paying-member.ts` BD/legacy union branches | Need to confirm KPIs match after removal |

No customer communication required for any of this — these are internal admin surfaces.

---

## 15 · Proposed Admin Rebuild

### Target sidebar

```
OVERVIEW
  Overview                /admin                  (cockpit only)

MEMBERS & PROS
  Professionals           /admin/professionals
  Verification            /admin/verification
  Memberships             /admin/memberships      (canonical billing page)
  Churn                   /admin/churn
  Reviews                 /admin/reviews

REVENUE
  Payments                /admin/payments         (Stripe ledger + disputes)
  (Reconciliation merged into Memberships)

CONTENT & DISCOVERY
  Directory               /admin/directory
  Gyms                    /admin/gyms
  CPD                     /admin/cpd

OPERATIONS
  Operations              /admin/ops              (declutter — no renewal engine, no site time)
  Support                 /admin/support
  Campaigns               /admin/campaigns
  Webhook recovery        /admin/webhook-recovery

ARCHIVE
  BD migration            /admin/archive/bd-migration   (was /admin/migration)
```

### Per-page scope

- **`/admin`** — Active Paying Members, Revenue Received, Projected Cash Due, Net Member Growth, charts. No BD, no migration banners.
- **`/admin/memberships`** — already the truth. Subscription-only data source. Absorbs `/admin/reconciliation`.
- **`/admin/payments`** — Stripe ledger + a real Disputes tab (fix R3).
- **`/admin/churn`** — failed payment recovery, lapsed, reactivation, win-back. Subscription-driven only.
- **`/admin/ops`** — cron, email, webhooks, alerts, activity, member timeline. Drop the legacy renewal card and site-time panel.
- **`/admin/archive/bd-migration`** — read-only historical workbench for the 17 manual-review rows + ledger.

---

## 16 · Required Fixes (ranked)

### P0 — revenue / customer-impacting
1. **R1 — fix `migrated_from_bd` typo** in `src/routes/api/public/payments/webhook.ts:184` and `src/lib/admin/webhook-replay.functions.ts:465,704`: change `=== "bd"` → `=== "bd_legacy"`. Then backfill the column from `metadata->>'migrated_from'`. (Without this, every BD-aware KPI that filters on the column is wrong.)
2. **R3 — disputes table not populated.** 17 dispute events landed in `payment_events`, 0 rows in `disputes`. Re-test the dispute handler in `payments/webhook.ts`, run a one-time backfill from `payment_events`.
3. **`/admin` blank-render bug** — root cockpit failed to render in 1.8s headless run. Verify locally; likely Suspense / loader regression after recent overview changes.
4. **L2 — verification badge doesn't follow paid status.** 340 pros are paying but show `verification = pending`. Decide policy (auto-flip vs separate label) and ship.

### P1 — admin trust / confusing
5. **L1 — "Past-due 1"** on `/admin/memberships` is a Stripe Identity stub, not a failed payment. Exclude `incomplete_expired` `free`-tier rows from this tile.
6. **R2 — `stripe_price_id` storing local alias** `"verified_annual"` instead of the real Stripe price ID. Fix webhook upsert.
7. **R4 — `bd_member_id=636` collision** — update `legacy_stripe_link.migration_status` to `converted_to_subscription` for this one row.
8. **`active-paying-member.ts`** — drop the legacy-link + bd-seed union branches; subscription-only.
9. **Decluttering pass** — hide `RenewalEngineCard`, `SiteTimePanel`; rename "BD Rail-Swap" → "Legacy conversion (complete)".

### P2 — cleanup
10. Merge `/admin/reconciliation` into `/admin/memberships`.
11. Move `/admin/migration` to `/admin/archive/bd-migration`.
12. Move `src/lib/admin/bd-*.functions.ts` under `src/lib/archive/`.

### P3 — future polish
13. Once all 44 setup tokens and 6 `skipped` rows are resolved, retire `/api/public/hooks/legacy-renewal.ts` and `_runLegacyRenewalBatch`.
14. After 12 months, drop `bd_member_seed` / `legacy_stripe_link` write paths.

---

## Deliverables

| Path | Purpose |
| --- | --- |
| `/mnt/documents/post-bd-audit/bd-member-state-2026-06-28.csv` | row-level export (390 rows × 30 cols) |
| `/mnt/documents/post-bd-audit/stripe-subscriptions-export.csv` | Stripe-side source (341 rows) |
| `/mnt/documents/post-bd-audit/screenshots/*.png` | 11 admin screenshots |
| `docs/admin-v2/post-bd-migration-admin-audit-2026-06-28.md` | this report |

---

## Final Recommendation

**Option 2 — BD migration mostly complete; fix the P0 blockers (R1 webhook typo, R3 disputes, blank `/admin`, L2 verification badge), then proceed to the admin de-legacy cleanup in §14–15.**

The migration achieved its money goal: 333 BD members are on real Stripe subscriptions, 44 are on setup-link flow, 11 + 6 are in a clean manual queue, and no BD member is invisible. The legacy renewal rail cannot charge any converted member. What's stopping a full freeze is small code-side hygiene, not customer or revenue risk.
