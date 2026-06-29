## What you saw

The new `/admin/v2` rendered its own shell (`src/routes/admin_.v2.tsx` + `src/components/admin/v2/AdminSidebar.tsx`) with a light cream surface, a bare Members/Billing/Churn list, no NotificationsBell, no UserAccountMenu card, no REPs Admin badge. That's the regression — we rebuilt the shell from scratch instead of reusing the existing one.

## Fix — reuse the existing admin shell, change nothing visual about it

1. **Delete the custom v2 shell**
   - `src/routes/admin_.v2.tsx` (the SidebarProvider + custom header)
   - `src/components/admin/v2/AdminSidebar.tsx`
   - The pinned `MemberFinder` lives back in each v2 page header as an `actions` slot, not in a custom topbar.

2. **Each `/admin/v2/*` route renders inside `DashboardShell` (role="admin")**
   - Reuses the locked branded sidebar: REPS wordmark, "REPS Admin" badge, Overview / Members & Pros / Revenue / Content & Discovery / Operations / System groups, NotificationsBell, UserAccountMenu, bottom user card with avatar + email + Admin pill.
   - Uses the existing `⌘K` search input in the TopBar — wires through `search.value/onChange` to drive the `MemberFinder` results popover so finding a member feels identical to current `/admin`.
   - `active` prop maps each v2 page to its existing nav label so the correct sidebar row highlights:
     - `/admin/v2` → active `"Overview"`
     - `/admin/v2/members` and `/admin/v2/members/$userId` → active `"Memberships"`
     - `/admin/v2/billing` → active `"Stripe"`
     - `/admin/v2/churn` → active `"Churn"`
     - `/admin/v2/reconciliation` → active `"Reconciliation"`
     - `/admin/v2/ops` → active `"Operations"`
     - `/admin/v2/support` → active `"Support"`
   - `title` / `subtitle` per page (e.g. "Overview" / "Active paying members, revenue received, projected cash due.").

3. **Page bodies — keep the work we just did, restyle for the dark surface**
   - Overview KPIs, Tier mix, sparkline, Memberships + Reconciliation tiles all stay; replace any hand-rolled neutral surfaces with the existing dashboard tokens (`bg-reps-panel`, `border-reps-border`, `text-white`, brand-orange accents) so they match the screenshot you liked.
   - Member 360 keeps the 3-column layout (Identity / Snapshot+Timeline / Quick actions) but inside the existing shell, on the dark surface.
   - Stub pages (Billing/Churn/Reconciliation/Ops/Support) keep their deep-links to the legacy cockpits — same shell, just a card.

4. **No nav changes**
   - We do NOT add a "v2" entry to `ADMIN_NAV`. The v2 pages are reachable from the legacy pages' "Open in v2" affordances and via direct URL; nav stays exactly as today.

## Out of scope

- The redesign Phase C2 (rebuilding the legacy cockpits on the mirror) is unchanged — only the shell wrapper is being reverted.
- No backend / data changes. No nav copy changes. No new route files.

## Files touched

- Delete: `src/routes/admin_.v2.tsx`, `src/components/admin/v2/AdminSidebar.tsx`.
- Edit: `src/routes/admin_.v2.index.tsx`, `src/routes/admin_.v2.members.index.tsx`, `src/routes/admin_.v2.members.$userId.tsx`, `src/routes/admin_.v2.billing.tsx`, `src/routes/admin_.v2.churn.tsx`, `src/routes/admin_.v2.reconciliation.tsx`, `src/routes/admin_.v2.ops.tsx`, `src/routes/admin_.v2.support.tsx` — each wraps its content in `<DashboardShell role="admin" active={…} title={…} subtitle={…} search={…} actions={…}>` and switches surfaces to dark dashboard tokens.

After this lands, `/admin/v2` looks identical in chrome to your first screenshot — same sidebar, same logo, same bell, same SC avatar card, same ⌘K search — only the page body changes per route.