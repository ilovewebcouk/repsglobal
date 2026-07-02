# Activity Command Centre — Revised Rebuild Plan (v3)

Positioning: **live analytics command centre**. Two hero surfaces (map + realtime card) stay dominant and get materially better. Everything else is triaged around them.

## Non-negotiables (locked from your feedback)
1. **Realtime Summary Card** — keep exactly as-is visually. Do not touch styling.
2. **World map** — stays hero-sized. Must actually work: live markers, auto-zoom to new visitors, click-through to drawer.
3. Analytics is a first-class citizen — this is not just an ops queue.

---

## Page structure (top → bottom)

```
┌─────────────────────────────────────────────────────────┐
│ HeroLine: "12 visitors + 3 members on site now.         │ ← one sentence, plain English
│           1 checkout in progress. Everything healthy."   │   + anomaly badge if unusual
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────┐ ┌───────────────────────┐ │
│ │                           │ │  Realtime Summary     │ │
│ │      LIVE WORLD MAP       │ │  (LOCKED — no change) │ │
│ │      (65%)                │ │  (35%)                │ │
│ │                           │ │                       │ │
│ └───────────────────────────┘ └───────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ LiveStream: one row per active session (people + pages) │ ← merged, not split
│  [avatar] Sarah T · Verified · /pricing · 2m · UK       │
│  [•]      anon · /c/james-wilson · 45s · Manchester     │
├─────────────────────────────────────────────────────────┤
│ Action Queue (only shows if items exist)                │
│  Disputes · Failed payments · Renewals at risk          │
├─────────────────────────────────────────────────────────┤
│ Analytics strip: 5 metrics WITH sparklines + deltas     │ ← this is where analytics lives
│  Visitors 24h · Signups · Conversions · Enquiries · £   │
│  each: number + 7d sparkline + "vs avg" delta           │
├─────────────────────────────────────────────────────────┤
│ [▸ Historical + diagnostics] (collapsed drawer)         │
└─────────────────────────────────────────────────────────┘
```

## Map — the real fix (this is where most work goes)

Current map is decorative and lies. New behaviour:

**Live behaviour**
- Subscribe to Supabase Realtime on `visitor_journeys` + `security_visitor_ip_observations`. New row → new marker appears with a soft pulse animation.
- Marker size = `sqrt(count)` capped 12px (kept from prior plan).
- Marker colour: orange = live (≤5m), dimmed = recent (5–30m), hidden >30m.
- Hollow ring = country-only geo; filled dot = city-level.

**Auto-zoom / focus**
- On new live visitor: brief camera nudge — the map smoothly pans (not zooms globally) to include the new marker if off-viewport. Debounced so a burst doesn't jitter.
- "Follow latest" toggle (default ON) — turn off to pin the view.
- Double-click a marker → zoom to city level (~zoom 8) and open the visitor drawer on the right.
- Cluster overlapping markers at low zoom; expand on zoom-in.

**Controls (top-right of map)**
- Zoom in / out / reset
- Toggle: World / Europe / UK
- Toggle: Live only / Last 30m / Last 24h
- "Follow latest" switch

**Empty state**
- If 0 live: map dims, single centered label "Quiet — no visitors in the last 5 minutes." No fake markers.

**Tech**
- Keep react-simple-maps if it supports pan/zoom smoothly; otherwise migrate to MapLibre GL (vector, real pan/zoom, clustering built in). Decision made during implementation after a spike — I'll flag before switching libs.

## HeroLine (new)
One sentence above map. Rebuilt every 10s from the same data feeding the Realtime Card. Includes anomaly badge ("↑ 3× hourly average") when current live count > 2× rolling 1h avg.

## LiveStream (replaces separate OnlineNow + PagesLive)
One unified feed. Each row = one active session:
`[identity] · [current path] · [time on page] · [city] · [intent tag if pricing/checkout/enquire]`
Grouped: Members first (with tier badge, avatar, "Open member 360"), then public. Click row → same drawer as map marker click. Realtime-subscribed.

## Analytics strip (this is the analytics half)
5 tiles, single row, each with a 7-day sparkline and delta vs prior period:
- Visitors (24h)
- Signups (24h)
- Conversions (24h)
- Enquiries (24h)
- Revenue (24h, £)

Sparklines are the analytics surface — not a separate page. Click a tile → deep-dive route later.

## Action Queue
Only rendered if items exist. Priority-sorted. Each item: title, SLA countdown, one-click primary action, keyboard shortcut hint. Empty state = nothing rendered (no "0 items" card).

## Historical + Diagnostics (collapsed)
Single collapsed drawer at bottom containing: 24h top pages, ingest health, backfill geo, pipeline status. Owner never sees this unless they open it.

## Language pass
Rip out: ingest, linker, rollup, scope, pipeline, beacon. Replace with: Live, Recent, Quiet, Last updated, Health.

## Freshness contract (unchanged from v2)
- Live: ≤5m — full orange
- Recent: 5–30m — dimmed
- Stale: >30m — hidden from live surfaces

## Out of scope (this phase)
- ⌘K palette, `j/k/e` hotkeys, density toggle, mobile layout — noted for a follow-up.
- Anomaly detection beyond simple "current vs 1h rolling avg" ratio.

---

## Implementation order
1. `useLiveMapChannel` hook — Supabase Realtime subscription feeding markers.
2. Rebuild `WorldMapPanel` with pan/zoom, clustering, follow-latest, controls, empty state. (Spike react-simple-maps vs MapLibre first.)
3. `HeroLine` component + anomaly calc.
4. `LiveStream` (merged people+pages) with Realtime subscription.
5. `AnalyticsStrip` with sparklines (recharts, already in project).
6. Collapse Historical + Diagnostics into `<DiagnosticsDrawer />`.
7. Language sweep across all activity components.
8. E2E: fresh incognito visit → marker appears within 3s, camera nudges, drawer opens on click.

## Files touched
- New: `src/hooks/useLiveMapChannel.ts`, `src/components/admin/activity/HeroLine.tsx`, `LiveStream.tsx`, `AnalyticsStrip.tsx`, `DiagnosticsDrawer.tsx`
- Rebuilt: `WorldMapPanel.tsx`
- Removed: `CommandStrip.tsx`, `StatusStrip.tsx`, `AlertBand.tsx`, `OnlineNow.tsx`, `PagesLive.tsx` (merged into LiveStream)
- Untouched: `RealtimeSummaryCard.tsx` (locked)

Approve to switch to build mode and start with step 1.
