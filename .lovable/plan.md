# Deep QA: Why `professionals.verification_status` drifted from `professionals.verification`

This is a separate pass from the demo-pros cleanup. Goal: find every way the two columns can disagree and close each gap, so the "Needs your attention" patch isn't just a band-aid.

## What's there today

Two columns on `professionals`, two different enums:
- `verification` — enum `verification_status` (`pending | verified | rejected | suspended`) — treated as canonical, drives the public REPS Verified badge via `is_pro_fully_verified()`.
- `verification_status` — enum `verification_state` (`unverified | pending | verified | ...`) — a denormalised cache the dashboard / Needs-Attention / dashboard-profile read.

Sync mechanism:
- `recompute_pro_verification(pro_id)` recomputes from the 3 pillars and writes both columns.
- Fired by triggers on `verification_submissions` (status change), `insurance_policies` (status / expiry_date change), and `professionals` (identity_status change).
- Current drift count in prod: 0 (after the last backfill) — but the conditions that caused it are still live.

## Root causes of drift (ranked by blast radius)

1. **Insurance expiry is time-based, not event-based.** A policy with `status='active'` and `expiry_date = yesterday` makes `is_pro_fully_verified` return false the moment the clock ticks past midnight — but no row changes, so no trigger fires. Both columns silently lie until the next manual write. This is the systemic leak.
2. **Two enums for one concept.** `verification_status` (enum) and `verification_state` (enum) have overlapping but non-identical values (`unverified` exists on one, not the other). Any code that maps between them is a drift opportunity. `recompute_pro_verification` has to literal-cast both — easy to update one branch and forget the other.
3. **The "not fully verified" branch in `recompute_pro_verification` is asymmetric.** It only collapses to `pending` when `verification` is currently `verified` or NULL. If `verification = 'rejected'` and `verification_status = 'pending'` (or vice versa), the function leaves them mismatched on purpose to "preserve" rejected/suspended — but it never re-aligns the cache to match.
4. **Direct writes bypass recompute.** `revokeQualification` writes both columns to `'unverified'` directly (verification.functions.ts ~L682). Any future admin path that updates only one column (e.g. a manual "suspend") will drift instantly because the recompute trigger only fires on `identity_status` updates, not on `verification` updates.
5. **No trigger on `identity_documents`.** The self-trigger fires on `professionals.identity_status`, which is set by app code after an identity decision. If a script or admin SQL touches `identity_documents.status` directly and forgets to mirror it to `professionals.identity_status`, the cache is stale until the next pillar change.
6. **UI read the cache, badge read live ticks.** Hub's "Complete your verification" task read `verification_status` while the public badge derived from `is_pro_fully_verified`. Drift was invisible to admins until a pro complained — already patched, kept here for completeness.
7. **No backfill discipline.** When `verification_status` was first added, there was no migration that ran `recompute_pro_verification` for every pro. Same risk every time we change `is_pro_fully_verified` logic — last week's change to the 3-pillar gate is exactly that scenario.

## Fix plan

### Pass A — eliminate the two-column problem at the source

- Make `verification_status` a generated / derived value, not a separately-written cache:
  - Option 1 (preferred): keep both columns but **remove every direct write to `verification_status` from app code**. Only `recompute_pro_verification` may write it. Update `revokeQualification` and any future admin code to call the recompute RPC instead of updating columns inline.
  - Option 2 (later, bigger): drop `verification_status` entirely; replace reads with a `v_professional_verification` view that returns the live 3-pillar status. Out of scope for this pass — flagged as follow-up.

### Pass B — close the insurance-expiry leak

- Add a daily `pg_cron` job that runs `recompute_pro_verification` for every pro with an `insurance_policies` row whose `expiry_date` crossed `CURRENT_DATE` in the last 24h, plus any pro currently marked `verification='verified'` whose insurance is now stale. Cheap (<400 pros) and idempotent.
- Add a guard inside `is_pro_fully_verified` already covers the read side; this fixes the write side so badges/UI/SEO don't lag.

### Pass C — make `recompute_pro_verification` symmetric and idempotent

- Rewrite the "not fully verified" branch so both columns always agree afterwards (no "preserve rejected on one column only" logic). The canonical mapping becomes:
  - `verification='verified'`  ↔ `verification_status='verified'`
  - `verification='rejected'`  ↔ `verification_status='unverified'` (cache enum has no 'rejected')
  - `verification='suspended'` ↔ `verification_status='unverified'`
  - everything else            ↔ both = `pending`
- Add a check at the bottom of the function: if the two columns still disagree after the update, log to `admin_audit_log` so we see future drift instead of swallowing it.

### Pass D — trigger coverage

- Add an `AFTER UPDATE OF verification` trigger on `professionals` that calls recompute. Stops manual SQL / future admin paths from desyncing by writing only one column.
- Add `AFTER INSERT OR UPDATE OF status ON identity_documents` → recompute, as belt-and-braces for the `identity_documents`-but-not-`professionals.identity_status` scenario.

### Pass E — one-shot backfill + drift monitor

- Migration runs `SELECT recompute_pro_verification(id) FROM professionals` once to align every row against the current `is_pro_fully_verified` logic.
- Add a SECURITY DEFINER RPC `audit_verification_drift()` that returns rows where the two columns disagree OR where `verification='verified'` but `is_pro_fully_verified(id)=false`. Surface the count on `/admin/verification` as a small chip ("0 drift" / "N drift — review"); clicking opens the affected list.

## Out of scope (flag for later)

- Collapsing the two enums into one — requires touching every read site and a careful enum migration; worth doing once Pass A has run for a couple of weeks with zero drift events logged.
- Replacing `verification_status` with a view — same reason, follow-up.

## Technical notes

- All SQL changes ship as a single migration (functions + triggers + cron job + backfill).
- Cron job uses the existing `pg_cron` extension; schedule `0 1 * * *` (01:00 UTC daily). Idempotent recompute means missed runs self-heal next night.
- `audit_verification_drift()` is admin-only (gated via `has_role(auth.uid(),'admin')`).
- No changes to public-facing UI, tokens, or radii — backend + admin chip only.
