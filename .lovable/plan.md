## What you're actually asking

The sidebar MemberCard already has the original grey-square placeholder (`bg-reps-panel-soft text-white/40`, 10px radius). The topbar uses a different component (`UserAvatar`) with an **orange** fallback and white initials. That's a second, parallel avatar style for no reason — the grey square was already the placeholder.

## Fix

One file: `src/components/account/UserAvatar.tsx`

- Change the `AvatarFallback` from `bg-reps-orange font-semibold text-white` to `bg-reps-panel-soft text-white/40` so it matches the sidebar MemberCard placeholder exactly.
- Keep initials inside it (same as MemberCard does).
- Keep the 10px radius and sizing as-is.

Result: topbar avatar = same grey square as the sidebar placeholder. One avatar style across the dashboard. No new component, no other files touched.

## Out of scope

- Sidebar MemberCard (already correct).
- Directory / profile-editor avatars (different surface, different radius — unchanged).
- Removing initials entirely (can do if you'd rather have a fully empty grey square — say the word).