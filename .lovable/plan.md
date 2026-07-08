## Problem

On `/dashboard/profile` the header button is always labelled **"Submit for review"** with the same orange styling — regardless of whether:

- the form is untouched (nothing to submit),
- the user has edited fields (there's something to submit),
- a submit is in flight,
- a submit just succeeded,
- everything is already pending admin review.

So a user can edit a field, click Submit, and the button looks identical afterwards — no confirmation the click did anything, and no way to tell at a glance whether their current edits are saved.

## Fix (UI-only, no backend changes)

Compute a `dirty` boolean by comparing the current `form` state against the loaded `data` (using the same fields that feed into `saveMut`, and respecting `websiteLocked` / `emailLocked` / `namePending` so locked/pending fields don't count as dirty). Also treat the requested name differing from `approvedName` as dirty.

Then drive the button by a small state machine derived from `dirty`, `saveMut.isPending`, `saveMut.isSuccess`, `pendingKeys.length`, `namePending`, and `phoneValid`:

| State | Condition | Label | Style | Disabled |
|---|---|---|---|---|
| Loading | `isLoading` | "Submit for review" | orange, muted | yes |
| Invalid | dirty && !phoneValid | "Fix phone number" | amber outline | yes |
| Saving | `saveMut.isPending` | "Submitting…" + spinner | orange | yes |
| Just submitted | `saveMut.isSuccess` && !dirty (for ~4s after success) | "Submitted ✓" | emerald (`border-emerald-400/30 bg-emerald-500/15 text-emerald-300`) | yes |
| Dirty | dirty | "Submit N change(s) for review" | orange (primary) | no |
| Clean, pending admin | !dirty && (pendingKeys.length \|\| namePending) | "Awaiting admin review" | neutral panel-soft | yes |
| Clean, nothing pending | !dirty | "No changes to submit" | neutral panel-soft | yes |

Notes:

- The count in "Submit N change(s)…" is the number of form fields whose current value differs from the loaded/approved value (cheap client-side diff — this is the same set the server already counts, just for display; the toast after save still uses the authoritative server count).
- The "Submitted ✓" state uses a 4-second timer after `saveMut.isSuccess` flips, then falls back to the clean state. This gives visual confirmation without permanently masking real state.
- Emerald is only used for the success confirmation, which fits the status-color rule (`mem://design/status-colors`).
- The existing amber pending-changes banner below the header stays as the detailed source of truth; the button just mirrors it at a glance.
- No changes to `saveMut`, server functions, or DB.

## Files touched

- `src/components/dashboard/organisation/ProviderProfilePage.tsx` — add `dirty` + `changedCount` computation, a `justSubmitted` timer via `useEffect` on `saveMut.isSuccess`, and replace the single button JSX in the `actions` slot with the state-driven variant above.

## QA checklist (I will run through this before saying done)

1. Fresh load, no edits → button reads **"No changes to submit"**, disabled, neutral.
2. Edit tagline → button flips to **"Submit 1 change for review"**, orange, enabled.
3. Edit tagline + about → **"Submit 2 changes for review"**.
4. Click submit → **"Submitting…"** with spinner, disabled.
5. After success → **"Submitted ✓"** emerald for ~4s, then **"Awaiting admin review"** (since fields are now pending) or **"No changes to submit"** if nothing was actually different.
6. Reload with pending changes already on record → **"Awaiting admin review"**, disabled.
7. Type an invalid phone number → **"Fix phone number"**, amber, disabled.
8. Locked website/email fields don't cause false-dirty.
9. Name field: typing a new name (when not already pending) counts toward the change count; while `namePending`, editing is blocked so it can't contribute to dirty.