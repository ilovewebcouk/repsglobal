## Activity Command Centre v2.2 — Hero Layout Fix

Scope: composition only. No backend, PostHog, consent, rollup, server-function, Supabase, capture, or proxy changes.

### Problem

Current hero grid: map (col-span 8, ~380px) beside a right column stack of Live Rail + Needs Attention (~640px). The left column collapses under the map, leaving a large dead void. Public Analytics has also been over-collapsed and now feels sparse.

### Fix — new hero grid (Option A, preferred)

```text
Header + LiveChip + range/filters
Command strip (7 tiles, one row)

┌─────────────────────────────────────┬───────────────────┐
│ Realtime map            (col 8)     │                   │
│ height ≈ 380px                      │  Live Activity    │
├─────────────────────────────────────┤  rail (col 4)     │
│ Needs Attention         (col 8)     │  full hero height │
│ compact top-5 + "View all"          │  internal scroll  │
└─────────────────────────────────────┴───────────────────┘
```

Implementation in `src/routes/admin_.activity.tsx`:
- Outer hero: `grid xl:grid-cols-12 gap-4 items-stretch`.
- Left wrapper: `xl:col-span-8 flex flex-col gap-4` containing `<WorldMapPanel />` then `<NeedsAttentionPanel compact maxRows={5} />`.
- Right wrapper: `xl:col-span-4 flex` containing `<LiveActivityRail className="h-full" />`.
- Live rail becomes full height of the left stack via `items-stretch` + `h-full` on the panel wrapper — no fixed pixel height.
- Remove the current right-column vertical split; delete the wrapper that stacked Live Rail + Needs Attention on the right.

### Panel-level tweaks

`src/components/admin/activity/LiveActivityRail.tsx`
- Add `className` prop pass-through; ensure the root uses `flex flex-col h-full` and the tab body uses `flex-1 min-h-0 overflow-y-auto` so it fills the hero height without overflowing the page.

`src/components/admin/activity/panels.tsx` (`NeedsAttentionPanel`)
- Keep top-5 + "View all N" toggle from v2.1.
- Ensure the compact card sits naturally below the map with matching radius (`rounded-[18px]`) and internal density (`py-2` rows).
- Header shows `1 critical · N warnings` inline.

`src/components/admin/activity/WorldMapPanel.tsx`
- Keep the ~380px map, log1p bubble scaling, 10px cap, and compact top-left overlay from v2.1. No further changes.

### Public Analytics — un-collapse the useful bits

`src/components/admin/activity/PublicVisitorsPanel.tsx`
- Keep primary KPI row visible: page views, sessions, profile views, enquiries.
- Move Top public pages, Top referrers, Top countries OUT of the `<details>` disclosure so they render by default in a compact 3-column grid directly under the KPIs.
- Keep behind the disclosure (`Show discovery details`): searches, no-result searches, signup/checkout zero metrics, top public profiles when empty, and any other zero-heavy secondary lists.
- Zero-value KPI cards stay in "quiet" style; non-zero secondary metrics still promote to tiles.

### Below-the-fold order (unchanged from v2.1)

1. Public analytics (now with visible top pages / referrers / countries)
2. Member activity (Top member pages + Geo)
3. Audit feed (compact Recent Activity + Full feed drawer)

### Explicitly untouched

- `src/lib/ops/*`
- `src/lib/admin/public-realtime.functions.ts` and other analytics functions
- `src/routes/api/public/_a/*`, `src/routes/api/public/activity/*`
- `src/lib/activity/capture.server.ts`
- Consent code / `CookieBanner.tsx`
- Any Supabase migration or rollup SQL

### Acceptance

- `bunx tsgo --noEmit` passes.
- Playwright screenshot at 1440×900 shows: command strip, map + Needs Attention stacked on the left, Live Activity as a single full-height rail on the right, no empty void anywhere in the hero, Public Analytics starting immediately below with top pages/referrers/countries visible by default.
- Return: single screenshot, short layout diff, explicit confirmation no backend/analytics/consent/proxy files changed, tsgo result.
