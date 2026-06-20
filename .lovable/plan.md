## Brutally honest QA of `DashboardShell` + `DashboardSidebar`

I read both files end-to-end and cross-checked every `active="..."` call site, the shadcn sidebar primitive, and the design tokens. I could not screenshot authed routes from plan mode (preview redirects to coming-soon without a session), so the visual sweep across breakpoints needs to happen in build mode — see the last section.

Score, honestly: **7.5 / 10**. Solid architecture, real bugs.

### 🔴 Bugs (must fix)

1. **Two routes have no active nav highlight.** `dashboard_.services.tsx` passes `active="Services"` and `dashboard_.shop-front.tsx` passes `active="Shop-front"`, but neither label exists in `PRO_NAV`. Nothing in the sidebar lights up on those pages. Either add the items to `PRO_NAV` (Deliver group) or change the routes to a label that exists.
2. **Type system isn't catching #1.** `TrainerActive` in `DashboardShell.types.ts` clearly allows values that have no corresponding `NavItem`. Derive `TrainerActive` from the nav arrays (`(typeof PRO_NAV)[number]["items"][number]["label"]`) so this fails at typecheck, not at runtime.
3. **Active match is label-based and ambiguous.** `isActive = item.label === active || pathname === item.to`. "Reviews" appears in PRO_NAV under *Deliver* — if a future page passes `active="Reviews"` from somewhere unexpected, both Reviews entries match (only one exists today, but the door is open). Switch the primary match to `pathname === item.to` and use `active` only as a fallback.
4. **`SidebarHeader` logo links to `/`.** Clicking the wordmark inside an authenticated dashboard kicks the user back to the marketing homepage with no warning. Should link to `/dashboard` (trainer) or `/admin` (admin), or open in a new tab.
5. **Admin badge is rendered in a stray `<div>` between `SidebarHeader` and `SidebarContent`.** It breaks the shadcn structural contract and produces inconsistent spacing in icon mode (the wrapper takes vertical space even when its child is `hidden`). Move it inside `SidebarHeader` (or a dedicated `SidebarGroup` with no label).

### 🟠 Polish (should fix)

6. **TopBar is overloaded on small desktop / large mobile.** SidebarTrigger + title block + (sometimes large) `actions` + bell + UserAccountMenu, with `px-4` and no `min-w-0` on the title block. On 1024–1280 the subtitle wraps awkwardly behind actions. Add `min-w-0` + `truncate` on the title block and `shrink-0` on the action cluster, per our responsive pattern.
7. **No mobile-only branding in the topbar.** On `<lg` the sidebar collapses to a sheet, so the user sees a trigger + bare title with no REPS wordmark anywhere. Add a small `RepsWordmark` next to the trigger that's `lg:hidden`.
8. **Footer CTAs vanish completely in icon mode.** "Admin console" and "Upgrade to Pro" are both `group-data-[collapsible=icon]:hidden`. For power users on the icon rail there's no longer any way to jump to the admin console. Render them as icon-only buttons (with tooltip) in collapsed mode.
9. **`SidebarMenuBadge` hides counters in icon mode** (shadcn default `group-data-[collapsible=icon]:hidden`). A coach sitting on the icon rail won't see "3 new enquiries". Either: (a) accept and document, or (b) replace with a small absolute-positioned dot indicator visible when collapsed.
10. **Active state colors lose contrast on hover.** `data-[active=true]:hover:bg-reps-orange-soft data-[active=true]:hover:text-reps-orange` — hover on the already-active item does nothing visible, which feels dead. Add a very subtle delta (e.g. `hover:bg-reps-orange/15`).
11. **`MemberRow` has its own 16px border-card inside the footer**, while `SidebarFooter` already provides padding. Visually it reads as a card-inside-a-card. Simplify to a borderless row in expanded mode; keep the avatar-only treatment in icon mode.
12. **`SidebarSeparator` above the footer uses `bg-reps-border` but `SidebarFooter` is on the same `bg-sidebar`** — the line is barely visible. Either drop the separator (footer already separates via padding) or use `bg-reps-border/60` with extra `my-2`.

### 🟡 Nice-to-have

13. **Persisted state is correct** (cookie-based) but `defaultOpen` is hardcoded `true` on the provider; that overrides the cookie on the very first paint, causing a one-frame "expanded → collapsed" flash for users who previously collapsed. Pass `defaultOpen={cookieValue}` read from the request, or just remove `defaultOpen` and let the provider read the cookie.
14. **No `aria-current="page"`** on the active `Link`. shadcn's `data-active` handles styling but not assistive tech. Add `aria-current={isActive ? "page" : undefined}` on the `<Link>`.
15. **The Notification bell + UserAccountMenu have no keyboard shortcut hints** unlike search (⌘K). Optional — add `?` overlay later.

### ✅ Confirmed good

- Tailwind v4 width syntax in `src/components/ui/sidebar.tsx` uses `w-(--sidebar-width)` natively — no `w-[--sidebar-width]` v4 bug.
- Tokens (`--sidebar`, `--sidebar-foreground`, …) all map to REPs palette correctly.
- `SidebarRail` is present (click-to-collapse from the edge).
- Mobile Sheet behaviour is delegated to the shadcn primitive — no bespoke duplicate.
- `⌘K` search focus still works.
- Tier-aware nav split is intact.

### Plan once you approve

1. **Fix the 5 bugs** (items 1–5).
2. **Apply the 7 polish items** (6–12).
3. **Visual sweep in build mode** — log in as the admin and as `demo-verified@repsuk.org`, screenshot at **1920 / 1440 / 1280 / 1024 / 768 / 414**, expanded and icon-collapsed, on:
   - `/admin` (admin nav)
   - `/dashboard` (Pro nav)
   - `/dashboard/verification` (Verified nav, counter badge)
   - `/dashboard/enquiries` (unread badge)
   - `/dashboard/clients/$slug` (long subtitle, action cluster)
   Verify: no overflow, footer CTAs reachable, active state correct, mobile sheet opens, icon rail tooltips, focus ring on trigger.
4. **Report back with annotated screenshots** + a final tick-list. No further code changes unless something else turns up.

Out of scope: no nav re-org, no new routes, no copy changes, no token edits.
