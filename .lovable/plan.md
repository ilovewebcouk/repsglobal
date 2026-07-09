# Simplify qualification lifecycle + mirror to CPD

## Goal

Replace the current 5-tab admin queue (Pending / Changes / Approved / Rejected / Withdrawn) with **4 tabs: Pending, Approved, Rejected, Withdrawn** — for both Regulated qualifications and CPD accreditations.

Semantics:
- **Withdrawn** = the provider deleted / retracted the entry (audit trail).
- No "Changes" flow — if a provider wants to amend an entry, they delete it and resubmit.

Mirror the member-side delete UX so CPD works the same way as Regulated.

## Admin UI (`AdminProviderQualificationsTab.tsx`)

- Drop `"changes_requested"` from `STATUS_TABS` and `REGULATED_STATUS_TABS`.
- Both Regulated and CPD now share tabs: `["submitted", "approved", "rejected", "withdrawn"]`.
- Remove the `if (t === "cpd" && status === "withdrawn")` special-case — no longer needed.
- Remove the "Changes" label from `STATUS_LABEL`.
- No visual redesign; just fewer chips.

## Member-side CPD delete (mirror Regulated)

Regulated already has `removeMyRegulatedPermission` (approved → soft-withdraw, others → hard delete). CPD currently only has `deleteMyCpdCourse`, and it hard-deletes only `submitted` rows.

Change:
- Rename/replace with `removeMyCpdCourse` that mirrors Regulated behaviour:
  - `approved` → soft-withdraw (set `status = 'withdrawn'`, stamp `withdrawn_at`, optional `withdrawn_reason`).
  - `submitted` / `rejected` → hard delete row + storage cleanup of any attached certificate.
  - `withdrawn` → no-op.
- Keep `deleteMyCpdCourse` as an alias export for backwards compatibility with existing call sites, forwarding to the new handler.
- Add a "Delete" button to the member's CPD list row (matching the Regulated delete button placement), with a small confirmation dialog. Approved rows say "Withdraw"; others say "Delete".

## Database migration

`cpd_courses` currently has no withdrawn tracking columns.

Migration:
- Add `withdrawn_at timestamptz NULL`.
- Add `withdrawn_reason text NULL`.
- No CHECK constraint change needed (status is `text`); "withdrawn" is already valid data.
- Backfill: none — new state only.

## Files to change

- `src/components/admin/verification/AdminProviderQualificationsTab.tsx` — remove Changes tab, unify tab arrays for both sub-tabs.
- `src/lib/qualifications/qualifications.functions.ts` — add `removeMyCpdCourse` handler (soft-withdraw when approved, else hard delete), export alias `deleteMyCpdCourse`.
- Member CPD list component (dashboard route that lists a provider's CPD courses) — add Delete/Withdraw button + confirm dialog. I'll locate the exact file (`src/routes/dashboard/**` or similar) during build.
- Migration adding `withdrawn_at` + `withdrawn_reason` to `cpd_courses`.

## Out of scope

- No changes to `provider_change_requests` table (that's the profile-fields change queue, separate from qualifications).
- No copy changes to public-facing profile qualification rendering.
- No new admin actions on the Withdrawn tab beyond read-only listing (already how it renders).

## Open question

None blocking — proceeding with the above unless you'd like the member-side button labelled differently (e.g. always "Delete" regardless of approved state).
