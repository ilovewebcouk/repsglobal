## Goal
Remove the Location column from `/admin/professionals` because it is no longer needed.

## Changes

### 1. `src/routes/admin_.professionals.tsx`
- Delete the `<th>Location</th>` header cell.
- Delete the `<td>{row.location ?? "—"}</td>` body cell inside `ProRow`.
- Reduce `colSpan={10}` to `colSpan={9}` on the loading and empty-state rows.

### 2. `src/lib/admin/professionals.functions.ts`
- Remove `location: string | null` from the `AdminProRow` type.
- Remove `location: p.city ?? null` from the mapped row object.
- Remove the location term from the free-text post-join filter so searches only match name/handle.

No other UI, logic, or database changes.