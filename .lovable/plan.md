## The brutal honest state right now

1. **Public header** already has an avatar + dropdown (`UserMenu` in `PublicHeader.tsx`), but it is role-blind: every user — client, verified, pro, admin — sees the same "Bookings / Saved / Messages / Settings" items pointing at `/portal/*`. That's wrong for pros and admins.
2. **Dashboard shells** (`DashboardShell.tsx`) have a `MemberCard` in the sidebar, but **no avatar dropdown anywhere** — no sign out, no "switch to public site", nothing clickable. Topbar has a `Bell` and nothing else.
3. **Avatars** everywhere fall back to initials over orange. `profiles.avatar_url` exists in the DB but nothing reads it; `useSessionUser` only pulls `user_metadata.avatar_url` (always null for the demo accounts). So the avatar pipeline is half-built.
4. There's no single shared `UserAvatar` / `UserMenu` component — the header has one inlined, the shell has a different one, and they'll drift.

That's why it feels inconsistent. Below is the fix.

---

## What we're building

### A. One shared avatar primitive — `<UserAvatar />`
`src/components/account/UserAvatar.tsx`
- Wraps shadcn `Avatar` + `AvatarImage` + `AvatarFallback`.
- Sizes: `sm` (28px), `md` (36px), `lg` (44px) via `size-*`.
- Source priority: `profiles.avatar_url` → `auth.user_metadata.avatar_url` → initials over `bg-reps-orange text-white`.
- Optional `ring` prop for the topbar trigger (subtle white/15 ring on hover).
- Used by every avatar on the site — header, dashboard topbar, sidebar member card, future profile cards.

### B. One shared role-aware menu — `<UserAccountMenu />`
`src/components/account/UserAccountMenu.tsx`
- Built from shadcn `DropdownMenu` (Trigger / Content / Label / Group / Item / Separator).
- Trigger = `<UserAvatar />` + `ChevronDown` in a pill, identical look on public + dashboard.
- Content header: name, email, role badge (Client / Verified / Pro / Studio / Admin).
- **Menu items resolved from role + tier**, exactly:

| Role / tier        | Menu items                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Client             | My bookings · Saved pros · Messages · Account settings · — · Sign out                                                                       |
| Verified (trainer) | My dashboard · Public profile · Edit profile · Verification · Settings · — · Upgrade to Pro (orange) · — · Sign out                         |
| Pro / Studio       | My dashboard · Public profile · Edit profile · Leads · Messages · Payments · Settings · — · Sign out                                        |
| Admin              | Admin console · Professionals · Verification · Memberships · — · View public site · — · Sign out                                            |
| Dual (e.g. Cruz)   | Same as primary role, plus a top-of-menu **"Switch view"** sub-list with all roles the user holds (admin ↔ pro), so dual users can flip.   |

- A single `useAccountMenu()` hook returns `{ user, role, tier, isAdmin, items[], signOut }` by composing `useSessionUser` (already exists) + a new `useUserProfile()` (reads `profiles.avatar_url`, `professionals.tier_label`) + the existing `has_role` RPC. One source of truth for both surfaces.

### C. Wire it everywhere
1. **PublicHeader** — replace the inlined `UserMenu` with `<UserAccountMenu surface="public" />`. Mobile drawer's account block uses the same hook so items match.
2. **DashboardShell TopBar** — add `<UserAccountMenu surface="dashboard" />` to the right of the `Bell`. This is the only place sign-out lives inside the dashboard, fixing the "no way out" UX hole.
3. **Sidebar `MemberCard`** — keep the visual card but make the whole card a `DropdownMenuTrigger` opening the same menu (so clicking the avatar in either spot does the same thing).
4. **Avatar source** — `useUserProfile()` selects `id, full_name, avatar_url` from `public.profiles`. Existing RLS already lets a user read their own profile. No migration needed for read.

### D. Avatar upload (the "wire in later" bit you mentioned)
- Add a small **Change avatar** action inside `Settings` (`/dashboard/settings` and `/admin/settings`) only — out of scope for this turn's UI everywhere else, but the read pipeline is in place so the moment a row gets `avatar_url`, every surface lights up automatically.
- Storage bucket `avatars` (public read, authenticated write to `userId/*`) added via migration, plus `profiles.avatar_url` update on upload. Flag this as a follow-up if you want it in this same pass.

---

## Verification (non-negotiable, I run it before saying done)

For each of the 4 demo accounts (`DemoPass123!`):

| Account                       | Expected after login                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `demo-client@repsuk.org`      | Public header avatar → Client menu. `/portal/today` works. Sign out → `/auth`.                        |
| `demo-verified@repsuk.org`    | Public header avatar → Verified menu (with Upgrade to Pro). Dashboard topbar avatar → same menu.       |
| `demo-pro@repsuk.org`         | Public header avatar → Pro menu (no Upgrade). Dashboard topbar avatar → same menu.                    |
| `demo-admin@repsuk.org`       | Public header avatar → Admin menu. `/admin` topbar avatar → same menu. "View public site" works.      |

For each I will, via the browser tool:
1. Sign in at `/auth`.
2. Open the avatar on the public homepage — confirm the right menu.
3. Navigate to the right dashboard — confirm the topbar avatar opens the same menu.
4. Click Sign out — confirm redirect to `/auth` and that hitting Back doesn't restore the protected page.
5. Hard-refresh and confirm the avatar still shows the right user (no flash of logged-out state).

Only after all 4 pass will I report done.

---

## Files touched

- **New:** `src/components/account/UserAvatar.tsx`, `src/components/account/UserAccountMenu.tsx`, `src/hooks/use-user-profile.ts`, `src/hooks/use-account-menu.ts`.
- **Edit:** `src/components/public/PublicHeader.tsx` (swap inline UserMenu + mobile drawer block), `src/components/dashboard/DashboardShell.tsx` (TopBar gains the menu, MemberCard becomes a trigger).
- **No DB schema changes** for the read path. Optional follow-up migration for the `avatars` storage bucket if you want upload in this same pass.

## Open question before I build

Do you want the **avatar upload UI in Settings included in this same pass** (adds the `avatars` storage bucket + an "Upload photo" control on `/dashboard/settings` and `/admin/settings`), or ship the role-aware menu + avatar plumbing now and do upload as the very next step?