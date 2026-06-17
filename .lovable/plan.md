## Root cause

`startImpersonation` sets a `reps_impersonate` HttpOnly cookie via `setResponseHeader('set-cookie', …)` on a server-function RPC response. That Set-Cookie isn't landing in the browser in the current TanStack Start / Worker preview path, so:

- `getImpersonationStatus()` reads no cookie → returns `{active:false}`
- `_authenticated/_professional` beforeLoad then falls through to the paid-subscription check on the *admin's own* account (admin also has `professional` + `client` roles but no paid sub) → redirects to `/pricing`
- `ImpersonationBanner` renders nothing because status is inactive

DB confirms the session rows are being created correctly — the only failure is the cookie round-trip.

## Fix: drop the cookie, key impersonation off `admin_id`

Each admin can only have one active impersonation session at a time (already enforced — `startImpersonation` ends any prior open session for the same `admin_id` before inserting). So we don't need a per-session token in a cookie to identify "which session" — the active row for the authenticated admin *is* the current session.

### `src/lib/admin/impersonation.functions.ts`

- Delete the `readCookie` / `buildCookie` helpers, the `COOKIE_NAME` constant, and all `setResponseHeader('set-cookie', …)` calls.
- `startImpersonation`: keep the "end prior sessions + insert new row + audit log" logic. Stop generating `session_token`. Stop setting any cookie. Return `{ok, endsAt, slug}` as today.
- `stopImpersonation`: find the live session by `admin_id = context.userId AND ended_at IS NULL`, mark it ended. No cookie clear.
- `getImpersonationStatus`: look up the live session by `admin_id = context.userId AND ended_at IS NULL AND ends_at > now()`. Return the same shape as today.

### `src/integrations/supabase/auth-middleware-impersonation.ts`

- Remove the cookie read.
- After verifying the bearer token and confirming the real user is an admin, look up the live session by `admin_id = realUserId AND ended_at IS NULL AND ends_at > now()`.
- If found, swap context to the target professional + service-role client (unchanged behaviour from this point). If not found, behave as `requireSupabaseAuth`.
- Non-admins: unchanged — never look at impersonation.

### `src/routes/_authenticated/_professional/route.tsx`

No code change required. `beforeLoad` already calls `getImpersonationStatus` and short-circuits when `status.active` is true. With the fix above, that branch starts firing again, so admins land on the trainer's dashboard instead of `/pricing`.

### `session_token` column

Leave the column in place for now (NOT NULL constraint? we'll insert `gen_random_uuid()::text` so existing schema constraints stay happy). I'll confirm with a quick read of the table definition during implementation. No migration in scope.

## What this fixes

- `View as → Open their dashboard` lands on `/dashboard` rendered as the target trainer.
- Orange `ImpersonationBanner` reappears with name, start time, and "ends at" countdown.
- `Exit view-as` button in the banner still works (calls `stopImpersonation`, which now keys off `admin_id` and clears the active row).
- 30-minute session expiry still enforced at the DB row level (`ends_at`).

## Out of scope

- Rewriting the session model (multi-tab admin sessions, etc.).
- Removing the `session_token` column.
- Touching the admin redirect logic for non-impersonating admins (still `/admin/professionals`).
- The "no paid subscription on the admin account" question — admin should keep using View-as rather than holding a real paid sub on their own account.
