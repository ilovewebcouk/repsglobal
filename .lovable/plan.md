# Where admin goes today

There's no UI to set a new password. Admin can currently only *see* whether a reset was requested (Member 360 → "Password reset" pane at `/admin/members/<userId>`), not set one directly.

# What I'll add

A **"Set new password"** action in that same pane on `/admin/members/<userId>`.

## UI
- Button "Set new password" inside the existing PasswordResetPane
- Opens a confirmation dialog with:
  - Password input (with show/hide eye — reuses the pattern we just added)
  - "Generate strong password" helper button
  - Warning: "This immediately replaces the member's password. They will not be notified. Use only when the member has requested this."
  - Confirm / Cancel
- On success: toast with the new password + a copy button (shown once, not stored)

## Server
- New `adminSetMemberPassword` in `src/lib/admin/password-reset.functions.ts`
  - `requireSupabaseAuth` + `has_role(admin)` check (mirrors existing pattern)
  - Uses `supabaseAdmin.auth.admin.updateUserById(user_id, { password })`
  - Writes an `admin_audit_log` entry (`action: 'password_set'`, target user id, no password value logged)
- Zod validation: password min 8 chars

## Scope
- Only the sole admin (`cruz.pt@icloud.com`) — enforced by existing `has_role('admin')` check
- No email sent to the member (matches "set a known password so you can log in as them")

## Answer to your immediate question
Once shipped: go to **Admin → Members → click the member → "Password reset" card → "Set new password"**.

Approve and I'll build it.
