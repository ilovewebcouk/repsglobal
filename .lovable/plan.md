## Activity Command Centre v2.1 — Final Composition Pass

Locked: no changes to `src/lib/ops/*`, `src/lib/admin/public-realtime.functions.ts`, `src/routes/api/public/_a/*`, `src/routes/api/public/activity/*`, `src/lib/activity/capture.server.ts`, consent, or any Supabase migration/rollup. This pass is composition, density, and hierarchy only.

Files in scope:
- `src/routes/admin_.activity.tsx`
- `src/components/admin/activity/CommandStrip.tsx`
- `src/components/admin/activity/WorldMapPanel.tsx`
- `src/components/admin/activity/LiveActivityRail.tsx`
- `src/components/admin/activity/PublicVisitorsPanel.tsx`
- `src/components/admin/activity/panels.tsx` (NeedsAttention + Geo density)
- `src/components/admin/activity/feed-and-sheet.tsx` (compact row variant only)

---

### 1. New above-the-fold layout (fits 1440×900)

Replace the current stacked grid with a single deliberate cockpit block:

```text
┌────────────────────────────────────────────────────────────┐
│ Header (title + LiveChip · Range · Filters · Refresh)      │
├────────────────────────────────────────────────────────────┤
│ Command strip — 7 tiles, one row, fixed 84px height        │
├──────────────────────────────────────┬─────────────────────┤
│                                      │ Live rail           │
│           Map  (col-span 8)          │ (col-span 4, top)   │
│           height ≈ 380px             │                     │
│                                      ├─────────────────────┤
│                                      │ Needs Attention     │
│                                      │ top-5 + View all    │
└──────────────────────────────────────┴─────────────────────┘
```

- Right column split vertically so total right height = map height. No above-the-fold Recent Activity.
- Ops banner + filter chips are inline one-line strips directly under header (no fat card).
- Grid becomes `xl:grid-cols-12` with an outer `space-y-4` (was `space-y-5+`).

### 2. Command strip — 7 tiles, tightened (`CommandStrip.tsx`)

Tiles: Live sessions · Public now · Members now · Views 5m · Key events · Action queue · Ingest.

- Live sessions = `publicOnline + membersOnline` (client add).
- Ingest tile: green Healthy / amber Degraded / red Down, derived from existing `isError`/`degraded` props passed from route (no new query).
- Zero-value tiles render in "quiet" style (muted number, no ring, no accent bg) so alert/live tiles dominate the eye.
- Public = blue, Members = orange, Alerts = amber/red, Health = emerald.
- Compact microcopy per spec ("Public now", "Members now", "Views 5m", "Key events", "Action queue", "Ingest"). No "anonymous visitors now" phrasing.
- **Public-online reconciliation (display-only fallback)**: read `publicOnline = Math.max(publicRealtimeQ.data?.online_now ?? 0, sum(countries[].online))`. This fixes cases where the top counter shows 0 while country rows show live sessions. Purely a presentation adapter in the route — server functions untouched.

### 3. Map — smaller and more restrained (`WorldMapPanel.tsx`)

- Container height reduced ~12% (from ~440px → ~380px via `min-h`/`h` tokens).
- Bubble scale switched to `log1p` normalized; hard cap **10px** radius for both member and public bubbles (down from 13–14).
- Pulse ring: reduce max radius +opacity so a single visitor is a subtle dot, not a cartoon blob.
- Country hover label: `text-[10px]`, muted bg, no drop-shadow.
- Members/Public/Both toggle: restyled as segmented pill matching `RangeSwitcher`.
- Compact top-left overlay (single card): `Public N · Members N · Updated Xs ago` — replaces existing verbose legend.
- Simplified legend row: two dots + counts on one line at bottom-right.

### 4. Live rail (`LiveActivityRail.tsx`)

- Height = top ~55% of right column; internal scroll.
- Tabs get an active underline + count badge.
- Empty state = one elegant row: "No member sessions right now" / "Waiting for consented traffic" — never a tall empty block.
- Row density: `py-2`, live green dot only for rows updated < 60s ago.

### 5. Needs Attention — compact priority queue (`panels.tsx`)

- Header shows `1 critical · 10 warnings` derived from rows.
- Top 5 rows only; footer button `View all 11` opens the existing full list in a Sheet reusing the same panel (no data change).
- Row density: single line where possible, second line only for critical items.
- Critical rows: solid amber-red left border + bold label. Warning: subtle border. Info: muted single line.
- Action buttons pushed to a fixed right-aligned column so they stack cleanly.
- Total panel height bounded so it never dominates the right column.

### 6. Below the fold — cleaner grouping (`admin_.activity.tsx`)

New order (each preceded by a slim divider + a single section header):

- **Section A — Public analytics (compact by default)** → uses updated `PublicVisitorsPanel`.
- **Section B — Member activity (secondary)** → `TopMemberPagesPanel` + `GeoPanel`, tighter density.
- **Section C — Audit feed** → the moved Recent Activity card + `Full feed` drawer button. Renders as a compact feed (row height ≈ 44px). When events < 5, panel collapses to natural height instead of a fixed tall card.

### 7. Public analytics rollup — collapsible detail (`PublicVisitorsPanel.tsx`)

Default (always visible):
- Page views, Sessions, Profile views, Enquiries — as a single 4-tile compact row.
- Top pages, Top referrers.

Behind a `Show discovery details` disclosure (`<details>` or shadcn Collapsible):
- Countries, searches, no-result searches, other zero-heavy metrics.

Zero-metric cards render in "quiet" row style — never full-size panels. Empty strings updated to spec ("No public profile views today", "No searches recorded in 24h", "Realtime updates when visitors accept analytics cookies").

### 8. Vertical rhythm sweep (all components)

- Outer route spacing: `space-y-4` cockpit block → `space-y-6` between below-fold sections (was 8+).
- Card radius standardised: panels `rounded-[18px]`, inner blocks `rounded-[14px]`.
- Section headers unified: colored dot + `font-display text-[14px]` + eyebrow. No repeated headers within a section.
- Muted text = `text-white/55`; eyebrows = `text-[10.5px] uppercase tracking-wide text-white/50`.
- Row hover: `hover:bg-white/[0.04]` everywhere.
- No `space-y-*` on flex columns; use `gap-*`.

### 9. Loading & refresh polish

- Skeleton rows match final row heights → no jitter.
- Command-strip tiles keep last number + faint pulse ring on refetch (no collapse to "—").
- Map keeps prior bubbles during refetch — no full remount.

### 10. Acceptance verification

- `bunx tsgo --noEmit` must pass.
- Playwright screenshot at 1440×900 confirming: full cockpit above the fold (strip + map + rail + attention), map visibly smaller, bubbles small and restrained, no Recent Activity above the fold, zero-value tiles muted, public rollup collapsed by default, page noticeably shorter overall.
- Return: single screenshot, short layout-change summary, explicit confirmation that no backend / analytics / consent / proxy / Supabase / rollup files were modified, tsgo result.

### Explicitly untouched

- `src/lib/ops/activity-*.functions.ts`
- `src/lib/admin/public-realtime.functions.ts`
- `src/routes/api/public/_a/*`
- `src/routes/api/public/activity/*`
- `src/lib/activity/capture.server.ts`
- `CookieBanner.tsx` / consent code
- Any Supabase migration or SQL rollup
