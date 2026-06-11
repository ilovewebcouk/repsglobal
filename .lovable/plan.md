# Phase B — DashboardShell + Dashboard Primitives

Single role-and-tier-aware shell, no separate `VerifiedShell`. Verified trainers get a focused nav (no locked Pro clutter). Direct hits on Pro-only URLs render an upgrade panel instead of silently rerouting.

## Architecture

```text
DashboardShell
  role:  "admin" | "trainer"
  tier?: "verified" | "pro" | "studio"     (trainer only)
  active, title, subtitle, actions, member, children
```

- `role="admin"` → renders the admin nav (today's AdminShell groups).
- `role="trainer"` → renders the trainer nav filtered by `tier`:
  - **verified** → Dashboard, Public Profile, Edit Profile, Verification, Reviews, Settings + sidebar-footer "Upgrade to Pro" CTA.
  - **pro** → today's full trainer nav (Work / Deliver / Grow / Money & Admin) **minus** Studio-only items.
  - **studio** → pro nav + Team / Locations / Staff / Studio Settings (deferred wiring; only nav slots).

Layout/topbar/mobile sheet, brand mark, account card, search affordance, notifications stub — all live once in `DashboardShell`. Visual output for current Pro routes stays pixel-identical (Phase 1 lock).

## New files

```text
src/components/dashboard/
  DashboardShell.tsx          # the unified shell (replaces ProShell.tsx / AdminShell.tsx wiring)
  primitives/
    index.ts                  # barrel
    PCard.tsx                 # moved from ProShell
    PPanel.tsx                # moved from ProShell
    KpiTile.tsx               # new, factored from DashboardDemoContent.KpiRow tiles
    SectionHeader.tsx         # new, dashboard-section heading + optional action slot
    UpgradePanel.tsx          # new, full-page "Pro feature — upgrade to unlock" with /pricing CTA
```

`ProShell.tsx` and `AdminShell.tsx` become thin re-export shims for one turn (so the 17+ consuming routes don't break in the same commit), then a follow-up turn migrates imports and deletes the shims. No route file's JSX changes in this turn.

## Route-level upgrade behavior

`_authenticated/_professional/_pro/route.tsx` currently redirects Verified users hitting Pro-only URLs to `/dashboard/profile-edit`. Change it to render `<UpgradePanel feature={...}/>` inside `DashboardShell` so the URL is preserved, the sidebar still renders (Verified variant), and the panel explains the feature with a CTA to `/pricing`. Feature copy comes from a small map keyed by pathname (Bookings, Clients, Programs, Nutrition, etc.).

## Tier source

`getDashboardStatus` already returns `tier`. Each route reads it (it's in the existing query) and passes `tier={status.tier}` to `DashboardShell`. No new server function. Admin routes pass `role="admin"`.

## Out of scope (explicit)

- No visual changes to any Phase-1-locked screen.
- No new Stripe/checkout work.
- No Studio activation — Studio nav slots render but features stay disabled.
- No migration of the 17 route imports in this turn — done via shims, swept in a follow-up turn to keep this diff small.
- No new design tokens; reuses existing `reps-*` tokens and radius system.

## Acceptance

1. `/dashboard` (Verified user) shows only Verified nav + footer "Upgrade to Pro" CTA. No 🔒 icons.
2. `/dashboard/bookings` (Verified user) renders the Verified sidebar + `UpgradePanel` (not a redirect).
3. `/dashboard/bookings` (Pro user) renders unchanged.
4. `/admin/*` renders unchanged (now via `DashboardShell role="admin"`).
5. `PCard`, `PPanel` importable from `@/components/dashboard/primitives`; old `@/components/dashboard/ProShell` imports still resolve via shim.
6. `bun run build` clean; `_authenticated` gates unchanged.

## Follow-up turn (not this PR)

- Sweep all `import { ... } from "@/components/dashboard/ProShell"` → `DashboardShell` / `primitives`.
- Delete `ProShell.tsx` and `AdminShell.tsx` shims.
- Wire `KpiTile` / `SectionHeader` into `DashboardDemoContent` to replace hand-rolled markup.
