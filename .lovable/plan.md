## 1. Fix the missing close (X) on the Filters sheet

`src/components/ui/sheet.tsx` renders the close button as `text-foreground/60` against a dark `bg-reps-panel` panel, so the X is nearly invisible on `/admin/professionals` (and any other sheet on a dark surface).

Update only the close button styling inside `SheetContent` so it always reads on dark surfaces:
- `text-foreground/60` → `text-white/65`
- `hover:bg-foreground/5 hover:text-foreground` → `hover:bg-white/10 hover:text-white`
- Bump icon from `h-4 w-4` → `h-4 w-4` (keep) and increase hit target padding to `p-1.5` (already there)

No other sheet behaviour changes.

## 2. Delete the 3 demo Unpublished professionals

Hard-delete Bob, Scott Pro, and Scott so the register only contains real signups. One migration (delete cascades from `auth.users`) covering:

- `auth.users` rows for the 3 demo emails — `ON DELETE CASCADE` from FKs in `profiles`, `professionals`, `user_roles`, `subscriptions`, `coach_client`, `client_roster`, `verification_submissions`, `professional_locations`, `services`, `shop_fronts`, `enquiries`, `bookings`, etc. handles the rest.
- Defensive `DELETE FROM public.professionals WHERE id IN (...)` first for any rows missing the cascade.

I'll confirm the exact 3 user_ids/emails with a `SELECT` against `professionals` joined to `profiles` filtered to `is_published=false AND suspended_at IS NULL` before running the delete, and list them in the migration description for you to approve.

## 3. Retire the "Unpublished" status

After the demos are gone, "Unpublished" has no real-world meaning on this platform — every live pro is Verified / Unverified / Flagged / Suspended.

Code changes (`src/lib/admin/professionals.functions.ts` + `src/routes/admin_.professionals.tsx`):

- Drop `'unpublished'` from the `AdminProRow.status` union and from the `STATUS_LABEL` / `STATUS_TONE` maps.
- Status derivation collapses to:
  ```
  is_published=false + suspended_at set        → 'suspended'
  is_published=false + suspended_at null       → 'pending'  (Unverified)
  verification='verified' + is_published=true  → 'verified'
  verification='rejected' + is_published=true  → 'flagged'
  otherwise                                    → 'pending'
  ```
- Remove the Unpublished tab/filter from the tab list (and from `statusCounts`).
- KPI tile count for "Unverified" already covers `verification='pending'` regardless of `is_published`, so no KPI math change needed.

No schema migration on `professionals` — `is_published` stays on the row (it's still used by Suspend/Reinstate and by the public directory's visibility filter). We're just removing it as a user-facing *status* in the admin UI.

## Out of scope

- Touching the Suspend/Reinstate flow.
- Changing the public directory's `is_published=true` filter.
- Any change to KPI tiles beyond removing the Unpublished bucket.
