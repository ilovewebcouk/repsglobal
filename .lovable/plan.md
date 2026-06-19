# Migrate DashboardShell to shadcn Sidebar (sidebar-04)

Replace the hand-rolled sidebar in `src/components/dashboard/DashboardShell.tsx` with the shadcn `Sidebar` primitive, using the **sidebar-04** pattern: header (logo), grouped nav, footer user card, collapsible to a **3rem icon rail** with hover tooltips on collapsed items. Keep every existing behaviour — tier-aware nav, all badge counters, impersonation banner, admin badge, "Switch to Admin", "Upgrade to Pro", mobile sheet, `⌘K` search.

This is a shell swap, **not** a redesign. Tokens, colours, radii, copy, and route structure stay identical.

---

## 1. Wire `SidebarProvider` at the right level

The provider must wrap both the Sidebar and `SidebarInset` (main content). Cleanest spot is **inside `DashboardShell` itself** — not in `_authenticated/route.tsx` — because `/portal/*` (client portal) and other authenticated routes don't use this shell.

```text
<SidebarProvider defaultOpen> (reads `repsuk:sidebar:open` cookie/localStorage)
  <DashboardSidebar role tier active member />     ← collapsible="icon"
  <SidebarInset>
    <ImpersonationBanner />
    <TopBar … with <SidebarTrigger /> for desktop collapse + existing mobile <Sheet /> swap-out >
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

Persistence: rely on shadcn's built-in cookie (`sidebar_state`) so collapse survives navigation/refresh.

## 2. New file: `src/components/dashboard/DashboardSidebar.tsx`

Extract the sidebar out of `DashboardShell.tsx` into its own file built on shadcn primitives:

- `Sidebar collapsible="icon" variant="sidebar"` — dark theme via existing `bg-reps-midnight` class on the inner shell; sidebar tokens (`--sidebar-background` etc.) stay default so we don't fight the primitive.
- `SidebarHeader` → `RepsWordmark` (full when expanded, mini "R" mark when collapsed via `group-data-[collapsible=icon]` selector).
- `SidebarContent` → one `SidebarGroup` per existing nav group (`Account` / `Work` / `Deliver` / `Grow` / `Money & Admin` for trainer; `Manage` / `Platform` for admin). Each uses `SidebarGroupLabel` + `SidebarMenu` + `SidebarMenuItem` + `SidebarMenuButton asChild` wrapping `<Link to=…>`.
  - `isActive` prop wired from `useRouterState` pathname (same logic as today).
  - `tooltip={item.label}` on every `SidebarMenuButton` so labels still surface in collapsed icon-rail mode.
  - Counter badges (`VerificationCountBadge`, `EnquiriesUnreadBadge`, `SupportUnreadBadge`, `ReviewsUnreadBadge`, BD chip) rendered via `SidebarMenuBadge` so they auto-hide in icon mode.
- `SidebarFooter`:
  - `AdminBadge` (admin only) — hidden in icon mode.
  - `MemberCard` → collapsed mode swaps to just the avatar (size-8) inside a `SidebarMenuButton size="lg"` pattern (mirrors sidebar-04 NavUser).
  - "Admin console" + "Upgrade to Pro" CTAs — hidden in icon mode (`group-data-[collapsible=icon]:hidden`).
- `SidebarRail` at the end (sidebar-04 drag-to-collapse rail).

Keep all `*Badge` helper components and `trainerNav` / `ADMIN_NAV` data exactly as-is; just move them with the sidebar.

## 3. Mobile behaviour

shadcn `Sidebar` already provides a built-in `Sheet`-backed mobile drawer at `<lg`. Delete the bespoke `mobileNav` `<Sheet>` block in `DashboardShell` and the `<aside className="hidden lg:block">` wrapper — `SidebarTrigger` covers both desktop collapse and mobile sheet open.

`SidebarTrigger` moves into `TopBar`, replacing the current `mobileNav` button slot. It auto-shows on mobile and stays visible on desktop for collapse toggle (this is the sidebar-04 default).

## 4. ESLint exemption

`mem://design/dashboard-ui-kit` bans `@/components/ui/*` imports under `_authenticated/`. The shadcn Sidebar lives at `@/components/ui/sidebar`. Add `sidebar` to the kit allowlist in `eslint.config.js` (or re-export it from `@/components/dashboard/ui/sidebar.ts` as a passthrough — preferred, matches existing pattern for `dialog`, `button` etc.). Pick the re-export approach for consistency.

New file `src/components/dashboard/ui/sidebar.ts`:
```ts
export * from "@/components/ui/sidebar";
```
And add to `src/components/dashboard/ui/index.ts` barrel.

## 5. Files touched

- **New** `src/components/dashboard/DashboardSidebar.tsx` — extracted + shadcn-ified sidebar.
- **New** `src/components/dashboard/ui/sidebar.ts` — re-export.
- **Edit** `src/components/dashboard/ui/index.ts` — add sidebar export.
- **Edit** `src/components/dashboard/DashboardShell.tsx` — slim down to `SidebarProvider` + `DashboardSidebar` + `SidebarInset` + `TopBar` + `<main>`. Remove old `Sidebar`, `NavSection`, `mobileNav`, desktop `<aside>`.
- **Edit** `eslint.config.js` — only if the re-export approach doesn't satisfy the rule (verify after first build).
- **Save** `mem://design/dashboard-ui-kit` — add Sidebar to the kit + note collapse persistence cookie.

## 6. Out of scope

- No changes to nav items, route paths, tier rules, or any page under `/dashboard/*` and `/admin/*`.
- No visual redesign — tokens, badge styles, member card, CTAs render with the same classes.
- No changes to `/portal/*` (client portal uses `ClientShell`, untouched).
- No changes to TopBar contents beyond swapping the mobile menu button for `SidebarTrigger`.

## 7. QA checklist (post-build)

1. `/dashboard` (verified, pro, studio tiers) and `/admin` — sidebar renders, active state correct on each route.
2. Click `SidebarTrigger` → collapses to icon rail (~3rem), labels hidden, tooltips show on hover.
3. Refresh after collapse → state persists.
4. Mobile (<lg) → trigger opens Sheet, nav fully visible, footer card visible.
5. Counter badges (Verification chip, Enquiries unread, Support unread, Reviews unread, BD migration) render in expanded mode, hidden/dot in icon mode.
6. Impersonation banner + admin-as-trainer "Admin console" CTA still appear.
7. Verified trainer sees "Upgrade to Pro" CTA; Pro/Studio don't.
8. `⌘K` still focuses search.
9. ESLint passes; build clean.
