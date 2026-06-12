# Actually square the dashboard avatars (round 2)

The previous pass missed the topbar avatar entirely. It's not rendered by `DashboardShell` directly — the topbar uses `<UserAccountMenu surface="dashboard" />`, which renders `UserAvatar` from `src/components/account/UserAvatar.tsx`. That component wraps the shadcn `Avatar` primitive and never overrides `rounded-full`, so every topbar avatar (dashboard + public header) renders as a circle.

The sidebar member-card avatar was already edited last turn but is still showing as a circle in the live preview. The source is correct (`size-10 rounded-[14px]` on the root), so either dev-server HMR is stale or `tailwind-merge` isn't resolving the override for some reason. Re-touching the file in this turn will force a fresh compile and I'll verify in the browser.

## Changes

**1. `src/components/account/UserAvatar.tsx`** — single source of truth for the topbar + public-header avatar.
- Add `rounded-[14px]` to the `Avatar` root's `cn(...)`.
- Add `className="rounded-[14px]"` to the nested `AvatarImage`.
- Add `rounded-[14px]` to the `AvatarFallback` className.
- Keep the size/ring/text props exactly as-is. This is the only structural change.
- Scope: applies to dashboard topbar AND public header. The user has said "all avatars are square"; making this shared primitive square is consistent with the directory cards and with the rule on `/find-a-professional`. Note this is a small visible change to the public navbar too — I'm calling it out as intentional and consistent, not a regression.

**2. `src/components/dashboard/DashboardShell.tsx`** — re-touch the MemberCard avatar so HMR rebuilds it; same intent as last turn, no behaviour change.
- Confirm lines 259–262 still read square (they do).
- If after HMR the sidebar avatar is still circular, the fallback is to use an explicit `!rounded-[14px]` (with `!` important prefix) so we bypass any tailwind-merge edge case. Apply only if needed after verification.

## Verification (this is the part I skipped last time)

1. After the edit, `view_preview /dashboard` and screenshot.
2. Zoom on top-right corner — confirm the topbar avatar is a 14px-radius square, not a circle.
3. Zoom on bottom-left sidebar — confirm the member-card avatar is a 14px-radius square.
4. Reload once with cache disabled if either is still circular, to rule out HMR.
5. Only then report back to the user.

## Out of scope

- Profile-editor avatars (`size-20` / `size-16`) at 18px — already verified square in last turn's edits to `dashboard_.profile.tsx`; not re-touched.
- Settings page initials swatch — already squared at 18px.
- Demo content client/lead thumbnails — already squared at 14px.
- All the per-page `.flex h-X w-X rounded-full bg-reps-orange-soft …` initials swatches inside `_pro/dashboard_.*` routes (messages, clients, community, calendar, payments, check-ins, reviews). These are decorative initial chips, not user-avatar surfaces, and were not part of the original ask. Flag for a follow-up if you want them squared too.
- `PublicHeader` itself — only its avatar changes (because it uses the shared `UserAvatar`); no other navbar styling touched.
