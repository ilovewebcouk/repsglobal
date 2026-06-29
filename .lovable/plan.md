
# Admin v2 — Phase C rebuild

The current `/admin/v2` is a scaffold stub (a Card with a search box). This plan replaces it with the real operator console: REPs-branded dark surfaces with orange accents, left sidebar shell, breadcrumbs, pinned Member Finder in the header, KPI-first overview, and Member 360 wired to the Stripe mirror as the source of truth.

Locked rules carried in: brand orange token only (never raw hex), 9-step radius scale (cards 16/18px, buttons 10px), emerald only for status, no shadows on buttons, shadcn primitives everywhere (no hand-rolled bubbles, no `space-y-*`, `size-*` for square, full Card composition).

---

## 1. Shell — `src/routes/admin_.v2.route.tsx`

A pathless v2 layout wrapping every `/admin/v2/*` page.

```text
┌───────────────────────────────────────────────────────────────┐
│ ┌───────────┐ ┌─────────────────────────────────────────────┐ │
│ │           │ │ Header: SidebarTrigger · Breadcrumbs        │ │
│ │ Sidebar   │ │         · MemberFinder (pinned, ⌘K hint)    │ │
│ │           │ ├─────────────────────────────────────────────┤ │
│ │  Overview │ │                                             │ │
│ │  Members  │ │                                             │ │
│ │  Billing  │ │         <Outlet /> (page content)           │ │
│ │  Churn    │ │                                             │ │
│ │  Recon.   │ │                                             │ │
│ │  Ops      │ │                                             │ │
│ │  Support  │ │                                             │ │
│ └───────────┘ └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- shadcn `SidebarProvider` + `Sidebar collapsible="icon"`.
- Header uses `SidebarTrigger`, shadcn `Breadcrumb`, and the existing `MemberFinder` with `target="/admin/v2/members/$userId"`.
- Lives under `_authenticated/` — admin check via `has_role` in each loader (already established pattern).

## 2. Sidebar — `src/components/admin/v2/AdminSidebar.tsx`

shadcn Sidebar with one group "Admin v2" and these items, each a `Link` from `@tanstack/react-router` with `isActive` from `useRouterState`:

| Label | Route | Icon |
| --- | --- | --- |
| Overview | `/admin/v2` | LayoutDashboard |
| Members | `/admin/v2/members` | Users |
| Billing | `/admin/v2/billing` | CreditCard |
| Churn | `/admin/v2/churn` | TrendingDown |
| Reconciliation | `/admin/v2/reconciliation` | Scale |
| Operations | `/admin/v2/ops` | Activity |
| Support | `/admin/v2/support` | LifeBuoy |

Footer item: "Back to legacy admin" → `/admin`. Active item uses brand-orange left border + soft tint; inactive uses muted foreground.

## 3. Overview — `src/routes/admin_.v2.index.tsx` (rewrite)

Replaces the current stub. All numbers from `stripe-mirror.server.ts` (already canonical).

- **KPI strip (6 tiles, shadcn `Card` with full composition):**
  - Active paying members (339)
  - MRR (£)
  - ARR (£)
  - Trialing
  - Open disputes
  - Failed payments (last 7d)
- **Two-column row:**
  - Left: "Recent billing events" (last 10 from `payment_events`, status badge in emerald/destructive).
  - Right: "Needs attention" (disputes open + payment_standing != good), each row links to Member 360.
- **Footer row:** mini sparkline of new active members per day (Recharts) over 30d.

No charts beyond the sparkline in Phase C — keep this shippable. Bigger charts come in Phase C2.

## 4. Member 360 — `src/routes/admin_.v2.members.$userId.tsx` (polish existing)

Already scaffolded. Polish pass only:

- Wrap in a 3-column grid: left = identity card (avatar/Monogram, email, full name, user_id, copy buttons), center = `MemberSnapshotCard` + timeline, right = quick actions stack (Open in Stripe, Send email, View profile, Refund last charge — buttons stub onClick to `console.warn("TODO")` for actions not yet wired).
- Replace any raw `<div className="border-t">` with `<Separator />`.
- Status pills use emerald/destructive/muted via shadcn `Badge` variants — no raw colors.

## 5. Other tabs (stubs that route correctly)

So the sidebar isn't broken on click. Each renders an `Empty` shadcn component with "Coming in Phase C2 — wire to mirror" and a button back to Overview:

- `admin_.v2.members.index.tsx` — directory list (stub)
- `admin_.v2.billing.tsx` — stub
- `admin_.v2.churn.tsx` — stub
- `admin_.v2.reconciliation.tsx` — stub
- `admin_.v2.ops.tsx` — stub
- `admin_.v2.support.tsx` — stub

Phase D will replace each with the mirror-sourced rebuild of its legacy counterpart.

## 6. Tokens / styling

- Active sidebar item: `bg-[color-mix(in_oklab,var(--brand-orange)_12%,transparent)] text-foreground border-l-2 border-[var(--brand-orange)]`.
- KPI numerals: `font-display tabular-nums`.
- Cards: `rounded-[16px]` standard, `rounded-[18px]` for the member snapshot. No `rounded-xl/2xl`.
- Buttons: `shadow-none` enforced; primary action uses brand-orange variant already in the system.
- No new hex values; everything goes through tokens already in `src/styles.css`.

## 7. Out of scope (deliberate)

- No new server functions — Overview KPIs reuse `getAdminOverview` from `src/lib/admin/overview.functions.ts` (already mirror-sourced).
- No new tables, no migrations.
- No nav change in `src/components/dashboard/nav-data.ts` — `/admin` stays the default until Phase D cutover.
- Legacy `/admin/*` routes untouched.

## 8. Acceptance

- `/admin/v2` shows the new sidebar shell + KPI overview reconciling to 339 / matching `/admin` exactly.
- Sidebar trigger collapses to icon-only rail; pinned MemberFinder still works in collapsed state.
- Member Finder in header jumps to `/admin/v2/members/$userId` and the 360 page renders snapshot + timeline + quick actions.
- All other sidebar items route without 404, render Empty stub.
- `tsgo` clean. `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` exits 0.

## Technical notes

- New files: `src/routes/admin_.v2.route.tsx`, `src/components/admin/v2/AdminSidebar.tsx`, `src/components/admin/v2/AdminHeader.tsx`, 6 stub routes above.
- Rewritten: `src/routes/admin_.v2.index.tsx`, `src/routes/admin_.v2.members.$userId.tsx`.
- shadcn primitives used: Sidebar, Breadcrumb, Card, Badge, Separator, Empty, Button, Skeleton, Tooltip.
- Recharts already installed for the sparkline.
- All loaders call existing mirror-backed server fns; no `legacy_stripe_link` / `bd_member_seed` reads anywhere in v2.
