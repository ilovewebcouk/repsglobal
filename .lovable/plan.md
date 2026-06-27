
## What's wrong

1. **Remove button is invisible.** The "Actions" cell uses `<Button variant="outline" size="sm">` on the dark panel — it renders as a near-blank pill. You can't see the icon or label.
2. **Grant admin wrongly requires an existing REPS account.** The handler does `auth.admin.listUsers` and throws `No REPS account found…` if the email isn't already registered. Admins are platform staff, not customers — they shouldn't have to sign up as a pro first.

## Fix

### 1. Remove button visibility (`src/routes/admin_.team.tsx`)
- Swap the row action from `variant="outline"` to a clearly destructive style: red text + subtle red border/hover (`border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200`).
- Keep the same disabled-with-tooltip treatment for the self row, but use the same red token at reduced opacity so the column visually reads as an action.

### 2. Grant admin to any email (`src/lib/admin/team.functions.ts`)
Rewrite `grantAdmin` so it works whether or not the email already exists:

- Look the email up via `auth.admin.listUsers` (same pagination as today).
- **If found** → insert `user_roles` row as today (idempotent on the unique key).
- **If not found** → call `supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: '<origin>/auth/callback' })`. Use the returned `user.id`, then insert `user_roles` row for that id. Result: the moment they accept the invite and set a password, they're already an admin.
- Audit log entry records `admin.grant` with `{ invited: true|false, email }` so we can tell new invites apart from promotions.
- Update the error message: only throw when the invite itself fails (e.g. invalid email, suppressed address).

### 3. UI copy + state (`src/routes/admin_.team.tsx`)
- Helper text under "Grant admin": replace "The person must already have a REPS account…" with "Enter their email. If they don't have a REPS account yet, we'll send them an invite to set a password."
- Toast on success: if the server returns `{ invited: true }`, show "Invite sent to {email}. They'll become an admin as soon as they accept."; otherwise keep the existing "{email} is now an admin."
- Invited-but-not-yet-accepted admins will appear in the Current admins table with `email` set and `fullName: null` — that already renders correctly via the monogram + "—" fallback. No extra UI needed for v1; we can add a "Pending invite" badge later if you want.

## Technical notes

- `inviteUserByEmail` creates an `auth.users` row immediately with `email_confirmed_at = null` until they accept. The `user_roles` insert keys off that id, so the role is live the instant they confirm.
- `redirectTo` must be a same-origin public URL; using `${request origin}/auth/callback` matches the existing OAuth pattern. We'll read origin from `getRequestHeader('origin')` inside the handler with a sensible fallback to `process.env.SITE_URL` if set.
- No DB migration required — `user_roles` already accepts any `auth.users.id`.
- No change to `revokeAdmin`, the list query, or the existing `/admin/professionals` admin-exclusion logic.

## Files changed
- `src/routes/admin_.team.tsx` — destructive Remove button styling, updated helper copy + toast.
- `src/lib/admin/team.functions.ts` — `grantAdmin` now invites unknown emails and returns `{ invited }`.
