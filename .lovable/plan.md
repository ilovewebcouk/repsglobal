## Goal

Stop the qualification-review button from sounding like it grants the full REPS Verified credential. The credential is the 3-of-3 gate (ID + qualification + in-date insurance) and should only flip on when all three pass.

## Changes

### 1. Admin button copy — `src/routes/admin_.verification.tsx`
- Replace `"Approve & verify"` (button label + tooltip, ~line 970–972) with `"Approve qualification"`.
- Change the right-hand "Will mark as: Verified" hint above the textarea (line 906–908) to say `Will approve: this qualification` to match.

### 2. Server: don't write the legacy `verification` column from this action — `src/lib/verification/verification.functions.ts`
- In `reviewVerification`, remove the `professionals.verification = 'verified' / verification_status = 'verified'` write inside the `decision === 'approved'` branch. The qualification `pro_titles` grant + title assignment stays exactly as-is.
- Keep the `decision === 'rejected'` write that flips `verification = 'rejected'` only if it's currently `verified` (so a single rejection of one cert doesn't unverify someone who has other valid quals). I'll guard it with a check on the current value before writing — if you'd rather just remove that branch entirely too, say the word and I'll drop it.
- Leave the new notification fire-and-forget for `qualification.approved` / `rejected` / `changes_requested` in place.

### 3. Recompute the public "REPS Verified" flag automatically
Today `professionals.verification` is a denormalised column that the legacy badge code still reads in places. The single source of truth going forward is `is_pro_fully_verified(uuid)` (ID approved + approved qualification + active+in-date insurance).

I'll add a tiny trigger so the column self-heals whenever any of the three inputs change, instead of relying on whoever clicks a button to set it:
- New trigger function `public.recompute_pro_verification(uuid)` that sets `professionals.verification` to `'verified'` when `is_pro_fully_verified` returns true and `'unverified'` otherwise (preserving manual `rejected` only if you've explicitly rejected within the last 30 days — happy to drop this nuance if you prefer the simple two-state version).
- Triggers on `verification_submissions` (after insert/update of status), `insurance_policies` (after insert/update of status/expiry_date), and `professionals` (after update of identity_status) that call it.

This means: the moment Jordon uploads a current insurance certificate that passes, his badge flips on with no admin action. The moment any of the three lapses, it flips off.

### 4. Trainer dashboard hero copy — `src/routes/_authenticated/_professional/dashboard_.verification.tsx`
No code change needed — the hero already shows "2 of 3 — keep going" off `trust.completedCount`, which already keys off the three independent ticks.

## Out of scope (flag for later if you want)

- Renaming the underlying `professionals.verification` column to something less ambiguous (e.g. `credential_state`). Big refactor; not worth doing in this pass.
- Bringing the legacy `verification_status` column into line — it's mostly unused by the new badge logic but a handful of admin lists still read it. I'll leave it alone unless you want me to do a sweep.

## Sequence

1. Migration: add the trigger + helper.
2. Code edits: button copy, remove the legacy write, keep notifications.
3. Verify on `/admin/verification` for Jordon: clicking the new "Approve qualification" button approves the cert, fires the bell, **does not** flip the public badge (because insurance is still expired). Then upload a fresh in-date insurance cert (or admin-edit the row) and confirm the trigger flips `verification` to `'verified'`.