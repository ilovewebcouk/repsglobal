## Goal

Let training providers remove qualifications from their profile with the right guardrails per status:

| Current status | Action | Result |
|---|---|---|
| `submitted` / `changes_requested` / `rejected` | **Hard delete** | Row + storage evidence gone. No public exposure, no audit value. |
| `approved` | **Soft withdraw** (`status='withdrawn'`) | Removed from public profile immediately. Row + evidence retained for audit. Admin can still see it under a "Withdrawn" filter. |

Applies to **regulated qualifications only** this pass. CPD courses already have their own delete path — we'll mirror the same rules for CPD in a follow-up if you want, but this plan doesn't touch it.

## Database

Add `withdrawn` to the status check, plus two audit columns. No new table.

```text
ALTER TABLE provider_regulated_permissions
  DROP CONSTRAINT provider_regulated_permissions_status_check,
  ADD  CONSTRAINT provider_regulated_permissions_status_check
       CHECK (status IN ('submitted','approved','rejected','changes_requested','withdrawn'));

ALTER TABLE provider_regulated_permissions
  ADD COLUMN withdrawn_at timestamptz,
  ADD COLUMN withdrawn_reason text;
```

RLS updates:
- **Public SELECT policy** already filters `status='approved'` — no change needed; withdrawn rows disappear from public automatically.
- **DELETE policy** widen from `status='submitted'` only to  
  `provider_id = auth.uid() AND status IN ('submitted','changes_requested','rejected')`.
- **UPDATE policy** add a second policy allowing owner to move `approved → withdrawn` only (no other transitions self-serve).
- Uniqueness index `uq_provider_ofqual_active` already excludes rejected; extend `WHERE` to also exclude `withdrawn` so the provider can re-submit the same Ofqual number later.

## Server function

Replace the existing `deleteMyRegulatedPermission` with a status-aware `removeMyRegulatedPermission` in `src/lib/qualifications/qualifications.functions.ts`:

1. Load the row; assert `provider_id = userId`.
2. Branch on status:
   - `submitted | changes_requested | rejected` → `.delete()`, then best-effort delete of `evidence_doc_paths` from storage.
   - `approved` → `.update({ status: 'withdrawn', withdrawn_at: now(), withdrawn_reason })`. Evidence kept.
   - `withdrawn` → no-op (idempotent).
3. Return `{ mode: 'deleted' | 'withdrawn' }` for toast copy.
4. Keep the old export name as a thin alias so existing imports don't break.

## UI — provider dashboard row

`src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` — `RegulatedRow`:

- Show the trash icon for **every non-withdrawn** row (currently `submitted` only).
- Click opens a shadcn `AlertDialog`:
  - **Approved** copy: "Remove *{title}* from your profile? It will disappear from your public profile immediately. REPs keeps a record for audit."
  - **Pending/rejected** copy: "Delete this submission? This cannot be undone."
  - Optional textarea "Reason (optional)" — only sent for approved (populates `withdrawn_reason`).
- On success toast: "Removed from profile" (approved) or "Deleted" (pending/rejected).
- Withdrawn rows: render dimmed with a small `Withdrawn` badge (using our locked emerald-is-status-only rule → use a neutral `bg-white/5 text-white/50` badge, not emerald), no trash button, no admin-note block.

Filtering: the tab's list currently shows everything. Approved-and-withdrawn should sort to the bottom; keep pending/rejected/approved at top ordered by `created_at desc`.

## Admin visibility

Extend `adminListRegulatedQueue` to accept `status='withdrawn'`. Add "Withdrawn" as an option in whichever admin queue selector already lists submitted/approved/rejected/changes_requested. No new admin surface, no restore button — if a provider wants an approved row back they re-submit.

## Out of scope

- CPD course removal (mirror later if desired).
- Admin-side undo / restore.
- Notifying admin when an approved row is withdrawn (can add via existing `verification_notifications` if you want — flag it and I'll include).
- Blocking removal when a qualification is referenced by a live listing (we don't yet link listings → qualifications, so there's nothing to check).

## Acceptance

1. Provider with a `submitted` row → trash → confirm → row gone, storage docs gone.
2. Provider with an `approved` row → trash → confirm with reason → row shows dimmed "Withdrawn" chip, `/t/{slug}` no longer lists it, admin queue "Withdrawn" tab shows it with the reason.
3. Provider re-submits the same Ofqual number after withdrawing → succeeds (unique index excludes withdrawn).
4. Non-owner cannot delete or withdraw another provider's row (RLS).
5. Typecheck passes.
