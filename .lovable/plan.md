# Show signed-in avatar menu in the public navbar (real auth)

## Goal
When any user is signed in (admin, professional, or client), the public navbar shows the avatar + dropdown instead of "Log in / Join REPS". Admins get one extra item in that dropdown: **Admin console**. No role-based branching of the chrome itself.

## Why this shape

- One signed-in UI for all roles = one code path, fewer regressions on a locked header.
- Admin gets a contextual entry point (Admin console) without a parallel navbar.
- Replaces the `reps.mockUser` localStorage shim, which never reflected real auth and is the root reason an admin sees buttons today.

## Changes

### 1. New shared hook: `src/hooks/use-session-user.ts`
- `useSessionUser()` returns `{ user, isAdmin, isLoading, signOut }`.
- Reads `supabase.auth.getUser()` via TanStack Query (key: `["session-user"]`, `staleTime: 60_000`).
- If `user` present, second query calls the existing `has_role(_user_id, 'admin')` RPC (key: `["has-role", userId, "admin"]`).
- Invalidated automatically by the existing `supabase.auth.onAuthStateChange` listener in `__root.tsx` (already calls `queryClient.invalidateQueries()` — no new listener needed).
- `signOut()`: `cancelQueries → clear → supabase.auth.signOut → navigate('/auth', {replace})` per the sign-out hygiene rule.
- Derives display fields from `user.user_metadata.full_name || email` and `user_metadata.avatar_url`.

### 2. `src/components/public/PublicHeader.tsx`
- Delete `useMockUser` and the `MOCK_USER_KEY` constant.
- Call `useSessionUser()` once at the top of `PublicHeader`.
- Right cluster (desktop, ~line 305): `user ? <UserMenu/> : <Log in / Join REPS>` — unchanged condition, real data.
- `UserMenu` (line 790): accept `{ user, isAdmin, onSignOut }`.
  - Add `<AvatarImage>` when `user.avatarUrl` exists, fall back to initials (current behaviour).
  - Append an admin-only `DropdownMenuItem` linking to `/admin` above the sign-out separator, with the existing `ShieldCheck` icon.
- `MobileDrawer` (line 889+): pass the same real user/isAdmin through; add "Admin console" link in the signed-in section.

### 3. Cleanup
- Remove the saved-pros heart button's `user &&` gating? — leave as-is (still useful for signed-in users).
- No visual changes to the navbar at rest; this is a data-source swap.

## Out of scope
- No changes to `/admin` itself, `AdminShell`, or any other route.
- No new design tokens; existing `UserMenu` styling is reused verbatim.
- Professional/client dropdowns stay the same items; only admins get the extra "Admin console" row.

## Risks / honest call-outs
- The current `UserMenu` links to `/portal/today`, `/portal/messages`, `/portal/profile` — those are **client-portal** routes. For a logged-in professional or admin they're the wrong destinations. **Recommendation:** add role-aware destinations in a follow-up (Pro → `/dashboard`, Client → `/portal/today`, Admin → `/admin`). I'll leave the current items intact in this PR so we don't expand scope, but flag this clearly afterwards.
- `supabase.auth.getUser()` runs client-side, so on first paint of a marketing page the signed-out buttons may flash for ~100ms before swapping to the avatar. Acceptable for a marketing header; if you want it gone we'd need SSR session reading, which is a bigger change.

## Verification
- Signed out → buttons (unchanged).
- Signed in as `pros@repsuk.org` (admin) → avatar menu with "Admin console" row.
- Signed in as non-admin → avatar menu without that row.
- Sign out from the dropdown → returns to `/auth`, no console 401 spam, cache cleared.
