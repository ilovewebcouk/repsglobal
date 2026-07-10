## Goal

Make approved REPS-endorsed course rows on `/dashboard/qualifications` visually match the awarding-body (Active IQ) rows: no green `REPS-QUAL-…` pill, no description paragraph — just a meta line under the title.

## Changes

**File:** `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` (REPS course row, ~lines 515–560)

1. **Remove** the green `REPS-QUAL-000001` `Badge` from the title chip row (lines 530–534).
2. **Remove** the `spec_who_for` description paragraph (lines 545–547) for the approved state.
3. **Add** a meta line directly under the title chips, matching Active IQ's format:
   ```
   REPS · REPS-QUAL-000001
   ```
   - "REPS" in `text-white/60`, monospace number in `text-emerald-300` (same tone Active IQ uses for its REPS number).
   - Only shown once `row.reps_qual_number` exists (i.e. approved rows). Non-approved states keep their current drafting / awaiting-review / reviewer-note messaging.
4. Keep unchanged: the REPS logo tile, `Level N` badge, `Approved` `StatusBadge`, delete button, and all non-approved status paragraphs / reviewer notes / admin notes.

## Out of scope

- Admin review view (still shows the full description — that's where reviewers need it).
- Awarding-body row (already correct).
- The submit modal copy referencing "REPS-QUAL-number".
