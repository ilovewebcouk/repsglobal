## Root cause

The Upcoming Payments card is sourcing from the wrong place. It reads `legacy_stripe_link.next_due_at` (BD's historical anniversary dates) and shows anyone due in the next 14 days. That ignores the locked V7 cohort decisions in `docs/10_phase2_migration_dry_run_v7_approved.md`.

Per V7, on launch day (26 Jun 2026, 00:00 BST) exactly **7 charges** total **£303**:

| Cohort | Members | Per | Subtotal |
|---|---:|---:|---:|
| honour_window | 6 (Rich Mcwatt, Callum Wolvey, Jane Walker, Rebecca White, Chris Read, Parnita Senjit) | £34 | £204 |
| anomaly_launch_charge | 1 (Raheela Khalid) | £99 | £99 |
| future_due | 383 | £0 | £0 |

`future_due` members are **not** charged at launch. Their renewals happen post-launch on their Stripe anniversaries.

Two distinct problems:

- **(A) Data.** `bd_member_seed.migration_cohort_override` only has 4 rows set. V7 specifies 390. The approved dry-run was never written back.
- **(B) UI.** The Upcoming card is using BD historical dates instead of the V7 cohort + launch-day model.

Both must be fixed for the card to match reality.

## Fix

### Step 1 — Backfill cohort decisions from V7 CSV (migration)

Single migration `update_bd_cohorts_from_v7.sql` that:

1. Reads the 390-row V7 list and applies, per `bd_member_id`:
   - `UPDATE public.bd_member_seed SET migration_cohort_override = <final_cohort>, migration_cohort_reason = <reason>` where currently null/stale.
2. Preserves the 4 existing overrides (they already match V7).
3. No deletes, no other column changes, no Stripe calls.

The full list is embedded in the migration as a `VALUES (...)` CTE generated from `/mnt/documents/bd_migration_dry_run_v7.csv` so the migration is self-contained and reproducible.

### Step 2 — Rewrite Upcoming Payments as a launch-day card

Confined to `src/lib/admin/memberships.functions.ts` + small relabel in `src/routes/admin_.memberships.tsx`. No Stripe calls. No public-route changes. No schema changes.

**Pre-launch (now → 26 Jun 2026):**

The card retitles to **"Launch-day charges (26 Jun)"** and sources from `bd_member_seed.migration_cohort_override`:

- `honour_window` rows → £34
- `anomaly_launch_charge` rows → £99
- everything else → excluded
- Headline = `count × price` summed: **£303 across 7 members**
- Scrollable list = the 7 names + £34/£99 + cohort badge

**Post-launch (≥ 26 Jun 2026):**

Card retitles back to **"Upcoming payments (next 14 days)"** and uses Stripe-tracked subscription `current_period_end` (via `subscriptions` table once migration has populated it). Until then it shows an empty state — no fabricated rows from BD historical dates.

### Step 3 — Forecast chart

`projectVerifiedRenewals` is updated to mirror the same cohort-driven model:

- Year 1 cash on honour-window members = £34 on launch day, then £99 on subsequent anniversaries.
- Anomaly-launch-charge = £99 on launch + £99 annually.
- future_due = £99 on their BD-anniversary date if that date is post-launch, then £99 annually.
- ARR KPI stays at steady-state £99/member (run-rate).

### Step 4 — Past Due card

Same fix: only show rows that were genuinely past due based on Stripe `subscriptions.status = 'past_due'`. Pre-launch this is an empty state. Stop deriving "past due" from BD historical dates.

## Removed wrong logic

- Drop the `last_paid_amount_pence`-based pricing I added in the last pass. Honour price is the constant £34 (`verified_legacy_annual` in Stripe), not whatever pence is stamped on the row.
- Drop the `eligible_for_legacy_price + access_expires_at >= LEGACY_HONOUR_CUTOFF` check from the dashboard. That's the right rule for the Stripe linking flow but **not** for "what gets charged on launch day". V7 cohort overrides ARE the dashboard's source of truth.

## After the fix

Pre-launch the card shows:

> **Launch-day charges — 26 Jun**
> **£303 across 7 members**
> · Rich Mcwatt — £34 — honour
> · Callum Wolvey — £34 — honour
> · Jane Walker — £34 — honour
> · Rebecca White — £34 — honour
> · Chris Read — £34 — honour
> · Parnita Senjit — £34 — honour
> · Raheela Khalid — £99 — anomaly

Forecast chart shows £303 cash on 26 Jun, then real anniversary renewals from there. Past Due card is an empty state until launch + 1 day.

Post-launch the card auto-switches to the "next 14 days" view driven by real Stripe subscription period ends.

## Out of scope

- No Stripe API calls. The launch-day linking flow (`stripe-linking.functions.ts`) is unchanged.
- No edits to `/admin/payments`, `/admin/stripe`, checkout, public routes, or the Live/Sandbox env badge.
- No edits to `legacy_stripe_link` (it stays as historical evidence).
- No content/copy work outside the two card titles and labels noted above.

## Files touched

- **New migration** — `update_bd_cohorts_from_v7.sql` (backfill 390 cohort overrides).
- `src/lib/admin/memberships.functions.ts` — switch Upcoming + Past Due + Forecast to cohort-driven model; remove `last_paid_amount_pence` logic; add launch-day vs post-launch branching.
- `src/routes/admin_.memberships.tsx` — relabel card titles pre/post launch; show cohort badge per row.
