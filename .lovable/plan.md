## Add temporary "Live" toggle to Training Providers admin list

Add a manual on/off switch on `/admin/members` → Training Providers tab so you can publish/unpublish a training provider profile to the public site without waiting for verification. Marked as temporary — easy to remove later.

### Where

- `src/routes/admin_.members.tsx` — Training Providers table only.

### What changes

1. **New "Live" column** inserted between **Status** and **Renewal date** in the providers table header (line ~482) and row body (line ~944).
2. **Row cell** renders a shadcn `Switch` bound to `row.isPublished` (already on `AdminProRow`).
   - ON = profile visible on the public front end.
   - OFF = hidden.
   - Small helper label under the switch: `Live` / `Hidden` in white/55.
3. **Mutation** uses the existing server function `setProfessionalPublished` from `src/lib/admin/professionals.functions.ts` — no new server code, no migration.
   - On success: toast (`{name} is now live` / `{name} hidden from public site`) and invalidate `["admin-pros-list", ...]` + KPIs.
   - On error: toast the message, revert switch state.
4. **Optimistic UI**: flip the switch immediately, roll back on failure.
5. **Temporary marker**: wrap the new `<th>` and `<td>` with a single `{/* TEMP: manual publish toggle — remove when verification flow ships */}` comment above each, so it's trivial to grep and delete later.

### Not changing

- Professionals tab layout untouched.
- No schema changes. `professionals.is_published` and `setProfessionalPublished` already exist.
- No changes to the public site rendering — it already filters on `is_published = true`.
- Suspend/republish flow untouched (this toggle is a lightweight override for verification-gated visibility only).

### Technical notes

- `AdminProRow` already exposes `isPublished: boolean` (`src/lib/admin/professionals.functions.ts:511`), so no fetcher change needed.
- `setProfessionalPublished` accepts `{ professional_id, is_published }` and audits via `log_admin_action`.
- Use `useMutation` + `queryClient.setQueryData` for optimistic update on the current `["admin-pros-list", ...]` key.
