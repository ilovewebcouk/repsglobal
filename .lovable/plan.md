
## What's wrong

On `/admin/memberships`, two cards look broken even though the DB clearly disagrees:

### 1. "Payments in next 14 days" → **No payments due** (wrong by design)

`getMembershipMetrics` (src/lib/admin/memberships.functions.ts) builds the 14-day window from only **two** sources:

- **Stripe live subs** where `current_period_end ∈ [now, now+14d]`. DB confirms `0` such rows — every paid sub renews ~12 months out.
- **Launch cohort** (`honour_window` + `anomaly_launch_charge`) — but only **if `LAUNCH_AT_UTC ∈ [now, now+14d]`**. Launch was 2026-06-26; today is 2026-06-28, so the launch window has closed and this branch is now permanently dead post-launch.

What it ignores: the BD-migrated members whose next renewal is driven by `bd_member_seed.bd_next_due_date` / `legacy_stripe_link` — i.e. the same source that already powers the £11,187 Q2 2028 forecast row directly above it. That's why the forecast shows real cash but the 14-day card shows zero.

### 2. "Failed payments" → **No past-due memberships** (stale build, not a data bug)

Raheela's sub is in the DB exactly where we expect: `environment=live`, `status=incomplete_expired`, `user_id` present in `profiles`. The `PAST_DUE_STATUSES` set (built from `FAILED_PAYMENT_STATUSES`) already includes `incomplete_expired`. A direct count on the live DB returns `past_due_total = 1`.

Console shows `Failed to fetch dynamically imported module: virtual:tanstack-start-client-entry` — a classic stale-chunk symptom after this morning's edits. The page rendered against an older client bundle that pre-dates the `incomplete_expired` addition. A fresh load will already show Raheela. We'll prove this in-place and add a defensive log so we don't second-guess it again.

## Fix

### A. Extend the 14-day upcoming-payments source set

Edit `src/lib/admin/memberships.functions.ts` `getMembershipMetrics`:

1. Drop the `LAUNCH_AT_UTC ∈ window` gate on cohort rows; replace with **per-row due-date** logic:
   - `honour_window` / `anomaly_launch_charge`: due at `LAUNCH_AT_UTC` (only included if that instant is still in the window — i.e. effectively never post-launch, which is correct).
   - `future_due`: due at `bd_next_due_date`. Include if that date ∈ `[now, now+14d]`. Amount = `TIER_PRICE_PENCE.verified` (£99).
2. Add a third source: `legacy_stripe_link` rows where `next_invoice_at ∈ [now, now+14d]` and the user isn't already covered by a live Stripe sub in `upcomingLive`. Use the same fields the forecast already reads. Amount = the linked tier's `paymentPenceFor`.
3. Dedupe by `user_id`: prefer the live-Stripe row, then legacy-link, then BD cohort. This avoids double-counting BD members who've already claimed and have a live Stripe sub.

Sort order in `upcomingItems`: by `dueAt` ascending (drop the launch-cohort priority that no longer matters).

### B. Update card copy + subtitle

In `src/routes/admin_.memberships.tsx` (`UpcomingPaymentsPanel`):

- Drop the `(launch cohort)` subtitle branch.
- New subtitle: `"Stripe renewals · legacy renewals · BD cohort"`.
- Empty-state description: `"Renewals and scheduled charges in the next 14 days will list here."`

### C. Prove Past-due renders Raheela (no logic change)

1. After the upcoming-payments edit deploys, hard-reload `/admin/memberships`. Expect the Failed-payments card to show `1 · Raheela Khalid · Free · incomplete expired · £0`.
2. If it still shows `0`, add a one-line diagnostic in `getMembershipMetrics` (`console.log("[memberships] pastDueCount", pastDue.length, pastDue.map(s => s.status))`) and inspect server logs to confirm the server function actually returns 1.
3. Once confirmed, leave the diagnostic in place (gated behind a `process.env.DEBUG_MEMBERSHIPS` check) so future drift is one log away.

### D. Tier-label handling for `free` past-dues

`tierLabel('free')` currently has no branch. Add a `free → "Free"` fallback in `src/routes/admin_.memberships.tsx` so Raheela's row renders with `Free · incomplete expired` instead of an empty / "Unknown" label. No business-logic change.

## Out of scope (explicit)

- No changes to billing logic, webhook logic, renewal logic, churn logic, reconciliation logic, or payment-recovery logic — per the standing Wave-3 freeze.
- No changes to the forecast table itself; it already reads the legacy/BD source correctly.
- No changes to `FAILED_PAYMENT_STATUSES` (already correct after this morning's edit).

## Acceptance criteria

1. `/admin/memberships` "Payments in next 14 days" shows a non-zero value when any of: a live Stripe sub renews in 14d, a `legacy_stripe_link.next_invoice_at` falls in 14d, or a BD `future_due` row's `bd_next_due_date` falls in 14d.
2. No member is counted twice across the three sources.
3. "Failed payments" card shows Raheela on a fresh load, with tier label `Free`, status `incomplete expired`, count `1`.
4. Subtitle on the 14-day card no longer references "launch cohort" by default.

## Technical notes

- `paymentPenceFor('free', …) = 0`, so Raheela's amount column renders £0 — accurate; we don't synthesise a fake charge.
- `legacy_stripe_link` columns used by forecast (see `getRevenueForecast`, lines 422-590) are already SELECTed by the same path; reuse the same projection helper rather than re-querying.
- All edits stay inside `src/lib/admin/memberships.functions.ts` and `src/routes/admin_.memberships.tsx`. No migration. No new server function.
