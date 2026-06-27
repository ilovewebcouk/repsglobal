## Goal

Stop showing admin accounts (Scott et al.) in the Professionals register, and give you a dedicated place to grant or revoke the admin role.

## 1. Exclude admins from `/admin/professionals`

In `src/lib/admin/professionals.functions.ts → listProfessionals`:

- After the existing `is_demo` + email-confirmed filter, fetch the admin `user_id`s once (`user_roles where role='admin'`) and drop those IDs from the result set in every tab.
- Apply the same exclusion to `countProfessionals` / KPI helpers in the same file so the totals match the rows.
- Remove the now-dead `'admin'` branch from the `status` mapping (admins never appear here anymore) and from the `AdminProRow` status union.

Result: Scott, and any future admin, never show up under any tab on `/admin/professionals` — including Demos.

## 2. New page: `/admin/team`

Create `src/routes/admin_.team.tsx` (role-gated to `admin`, same pattern as `admin_.settings.tsx`) wired into the admin sidebar as **Team** under Settings.

UI (single panel, dark dashboard styling matching other admin pages):

- **Current admins** table: avatar, full name, email, "Admin since" date, Remove button.
- **Add admin** row: email input + "Grant admin" button. On success the new admin appears at the top of the table.
- Inline confirmation dialog on Remove. Self-removal is blocked with a tooltip ("You can't remove your own admin access — ask another admin").

## 3. Backend: `src/lib/admin/team.functions.ts`

Three admin-gated server functions, all using `supabaseAdmin` inside the handler and writing an entry to `admin_audit_log`:

- `listAdmins()` → returns `[{ user_id, email, full_name, avatar_url, granted_at }]`. Joins `user_roles` (role='admin') → `auth.users` (email, created_at) → `profiles` (name/avatar). `granted_at` uses `user_roles.created_at` if present, otherwise `auth.users.created_at`.
- `grantAdmin({ email })` → resolves the user via `supabaseAdmin.auth.admin` list/lookup, inserts `(user_id, 'admin')` into `user_roles` with `ON CONFLICT DO NOTHING`. Returns a clear error if no user exists with that email (no auto-invite in v1).
- `revokeAdmin({ userId })` → refuses if `userId === context.userId`; otherwise deletes the `user_roles` row.

All three call the existing `assertAdmin(context)` guard already used in `professionals.functions.ts`.

## 4. Sidebar / nav

Add a **Team** link in `DashboardShell` admin nav, grouped next to **Settings**. No other admin routes change.

## Out of scope

- No new roles (moderator, support, etc.) — admin-only management for now.
- No email invite flow for non-existent users — that comes later if you want it. v1 requires the person to already have a REPS account; you grant admin to their existing user.
- No changes to `/admin` KPIs beyond the Professionals total flowing through naturally from step 1.

## Technical notes

- Uses the existing `has_role` / `user_roles` model — no schema changes.
- `admin_audit_log` already exists; `grant_admin` / `revoke_admin` actions are logged via the existing `log_admin_action` RPC.
- Adds one new route file, one new functions file, and edits to `professionals.functions.ts` + `DashboardShell` nav.
