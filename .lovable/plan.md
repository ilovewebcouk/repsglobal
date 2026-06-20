# Switch DashboardSidebar to sidebar-04 (floating + collapsible sections)

Rework `src/components/dashboard/DashboardSidebar.tsx` to match the **sidebar-04** pattern: floating rounded sidebar with a gap from the window edge, each nav section a **collapsible group with a chevron**. Leaves stay exactly as they are today — no IA change, no new routes.

Pair it with `variant="inset"`-aware spacing on the main content so the floating card has room to breathe.

---

## 1. Sidebar variant + provider spacing

In `DashboardShell.tsx`:

- `<Sidebar variant="floating" collapsible="icon">` (replaces `variant="sidebar"`).
- Keep `SidebarProvider` widths. shadcn's floating variant already adds the outer padding (`p-2`) and rounded-lg + border + shadow internally — no extra wrapper needed.
- Main `SidebarInset` keeps its current bg (`bg-reps-ink`). The floating gap lets the dark page show through, which reads correctly on our theme (verified visually after build).

## 2. Collapsible section groups

Each `NavGroup` becomes a `Collapsible` wrapping a `SidebarGroup`:

```tsx
<Collapsible defaultOpen={containsActive} className="group/collapsible">
  <SidebarGroup>
    <SidebarGroupLabel asChild>
      <CollapsibleTrigger>
        {group.title}
        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(... existing SidebarMenuButton + Badge ...)}
        </SidebarMenu>
      </SidebarGroupContent>
    </CollapsibleContent>
  </SidebarGroup>
</Collapsible>
```

- `defaultOpen` per group = `true` when any item in that group matches the current pathname (or is `active`). So the section containing the current page is auto-expanded; others start collapsed.
- Chevron right rotates 90° on open (standard sidebar-04 detail).
- Hover state on the trigger via `SidebarGroupLabel`'s existing styling — no custom colors.

## 3. Icon-rail behaviour (collapsed sidebar)

shadcn's `SidebarGroupLabel` already auto-hides in `collapsible=icon` mode. In the icon rail:
- Section headers (and chevrons) disappear.
- All leaves render as a flat icon column with tooltips (same as today).
- The collapsible state of each group is preserved on re-expand.

So the icon rail experience is identical to what we have now — collapsibles only matter when the sidebar is expanded.

## 4. `Collapsible` install check

`@/components/ui/collapsible` is a one-line Radix wrapper. If it's not already in the project I'll add it with `bunx shadcn add collapsible`. (I'll check before installing.)

## 5. Files touched

- **Edit** `src/components/dashboard/DashboardSidebar.tsx` — wrap each section in `Collapsible`, add chevron, compute `defaultOpen` from active pathname.
- **Edit** `src/components/dashboard/DashboardShell.tsx` — flip `Sidebar variant` to `floating`. Possibly nudge `--sidebar-width` (floating eats ~16px of horizontal space for the gap; current 232px stays fine).
- **Maybe new** `src/components/ui/collapsible.tsx` — only if missing.
- **No** changes to nav data, routes, badges, or any dashboard page.

## 6. Out of scope

- No IA changes, no new routes, no parent-routed hubs.
- No restyle of tokens, badges, footer card, CTAs, topbar.
- No change to `/portal/*` or any page-level component.

## 7. QA after build

1. `/dashboard` (verified + pro) and `/admin` — sidebar floats with rounded corners and a gap from the edge.
2. Section containing current route is open on first paint; other sections collapsed.
3. Click section header → expand/collapse animates, chevron rotates.
4. Collapse to icon rail → section headers hidden, leaves still visible with tooltips.
5. Mobile sheet — sections still collapsible inside the sheet.
6. Counter badges still render on Verification / Enquiries / Reviews / Support / Migration.
