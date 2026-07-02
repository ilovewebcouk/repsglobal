
# Activity Command Center — Rebuild Plan (owner-grade)

Current score: **4.5/10**. Stop patching. Rebuild the UI around a clean
command-centre model. **Backend, server functions, MaxMind, IP-reveal audit,
visitor_journeys, member sessions, PublicVisitorDrawer server wiring —
UNCHANGED.** This is a presentation-layer rebuild only.

Save this plan as `docs/admin-v2/activity-command-center-rebuild-2026-07-02.md`
before writing code.

---

## 1. Final page layout

```
┌─ Header ──────────────────────────────────────────────────────────────┐
│  Activity                                       [Range] [Filters] [↻] │
│  Live operational command centre                                       │
└────────────────────────────────────────────────────────────────────────┘
┌─ AlertBand (only if criticalCount > 0) ───────────────────────────────┐
└────────────────────────────────────────────────────────────────────────┘
┌─ StatusStrip · compact single row ────────────────────────────────────┐
│  Live now · Public now · Members now · Conversions today · Action Q   │
│  · health dot (only Degraded/Broken shows text)                       │
└────────────────────────────────────────────────────────────────────────┘
┌─ HERO ────────────────────────────────────────────────────────────────┐
│  LiveMap (70%)                        │  RealtimeCard (30%)           │
│  live + recent markers only           │  hero number, per-minute,     │
│  legend + last-updated                │  device donut, quiet/live     │
└────────────────────────────────────────────────────────────────────────┘
┌─ PEOPLE ROW ──────────────────────────────────────────────────────────┐
│  OnlineNow (50%)                      │  PagesLive (50%)              │
│  members + public visitors            │  only active pages            │
└────────────────────────────────────────────────────────────────────────┘
┌─ ACTIONS ─────────────────────────────────────────────────────────────┐
│  ActionQueue — critical first, low-priority collapsed                 │
└────────────────────────────────────────────────────────────────────────┘
┌─ HISTORICAL (collapsed by default) ───────────────────────────────────┐
│  ▸ 24h analytics summary   ▸ Member top pages   ▸ Recent activity     │
└────────────────────────────────────────────────────────────────────────┘
┌─ Footer link ─────────────────────────────────────────────────────────┐
│  Diagnostics & maintenance →  (opens drawer / /admin/diagnostics)     │
└────────────────────────────────────────────────────────────────────────┘
```

Hierarchy: **Live → People → Pages → Actions → Historical → Diagnostics.**

---

## 2. Panels kept (from current build)

| Panel | Fate | Notes |
|---|---|---|
| Server functions (`live-visitors.functions.ts`) | KEEP as-is | Data layer is good. |
| `PublicVisitorDrawer` | KEEP | Only relocate open trigger. |
| `resolveLocation` helper | KEEP | Used by every surface. |
| `AlertBand` | KEEP | Now the only critical-alert surface. |
| `OnlineNowPanel` data | KEEP | Repackage into new OnlineNow. |
| `WorldMapPanel` data | KEEP | Rewrite marker rules. |
| MaxMind enrichment + IP reveal audit | KEEP | Untouched. |

## 3. Panels removed or demoted

| Panel | Action |
|---|---|
| `CommandStrip` (6-tile banded) | REPLACE with compact `StatusStrip` (single row, 5 stats + health dot). |
| Standalone “Ingest” / “Rollup” / “Linker nominal” copy | REMOVED from main page. Moved to Diagnostics drawer. |
| Backfill geo button in header | REMOVED from header. Moved to Diagnostics drawer. Long-term: run automatically on `country_code IS NULL` rows. |
| Public 24h rollup card block | DEMOTED into collapsed “Historical” accordion, relabelled *24h analytics summary · refreshed Nm ago*. |
| Realtime card copy: “scope”, “public ingest quiet” | REMOVED. |
| Dead zero rows in every rail section | REMOVED. Sections collapse to a single empty state (“Quiet right now”). |
| Old wide member/public rail row | REPLACED by OnlineNow row (see §8). |
| “Views 5m” tile | REMOVED (was already gone; do not reintroduce). |

## 4. Owner-facing copy rules

**Allowed vocabulary:** Live · Quiet · Stale · Recent · Needs attention ·
Last updated · Historical summary · Public visitor · Member.

**Banned in the main page:** ingest · linker · rollup · nominal · scope ·
pipeline · beacon · proxy · MaxMind · diagnostics (unless the drawer trigger).

State examples:
- `hero === 0` → “Quiet right now” + “Last public visitor: 9m ago · Last member active: 21m ago”.
- degraded feed → StatusStrip health dot turns amber with text “Degraded”.
- healthy → dot only, no text.

## 5. Hidden diagnostics / maintenance area

New route: `/admin/diagnostics` (or a right-side drawer opened from the
footer link). Owner never sees it unless they click through. Contains:

- Ingest health (proxy_ingest_diagnostics live tail)
- Linker health (link_visitor_to_user last N runs)
- Rollup status (last successful run, next scheduled)
- **Backfill geo button** (moved from header)
- Beacon test button
- Raw counters + last error strings

Gate: existing `assertAdmin`. No new server functions needed.

## 6. Live / Recent / Stale rules (single source of truth)

Add `src/lib/activity/freshness.ts`:

```ts
export type Freshness = "live" | "recent" | "stale";
export function classify(lastSeenIso: string, nowMs = Date.now()): Freshness {
  const ageMin = (nowMs - new Date(lastSeenIso).getTime()) / 60_000;
  if (ageMin <= 5)  return "live";
  if (ageMin <= 30) return "recent";
  return "stale";
}
```

**Rules enforced everywhere:**
- Live = ≤ 5 min. Recent = 5–30 min. Stale = > 30 min.
- StatusStrip “Live now” counts **live only**.
- Map default view: live + recent only. Stale hidden.
- If `liveCount === 0`, map renders **zero live-styled markers** — background only, plus a subtle “No live visitors right now” overlay.

## 7. Map marker behaviour

| Marker type | When | Style |
|---|---|---|
| Live · city | ≤5 min, has city | filled emerald dot, `r = clamp(3, 3 + sqrt(n)*2, 12)` |
| Live · country-only | ≤5 min, no city | hollow ring at country centroid, same radius rule, dashed stroke |
| Recent | 5–30 min | 40% opacity, no pulse |
| Stale | >30 min | hidden by default; toggle in map legend |
| Zero live | `live=0` | no markers rendered; overlay text “No live visitors right now” |

Legend (bottom-left of map): **● Public  ● Member  ○ Country-only  · Recent (30m)**.
Tooltip: `{City, CC} · {Live | Recent 12m ago | Country-only} · {n} visitor(s)`.
Last-updated pill top-right: `Updated {n}s ago`.

Radius capped at 12px regardless of count. `ResizeObserver` drives
projection scale so the map fills its panel on desktop and laptop.

## 8. OnlineNow row design

Two grouped lists inside one panel:

**Members online (n)**
```
[avatar] Full name · Tier badge · flag City, CC
         Current page                          🖥 desktop · Chrome · 4m
                                               [Open →]
```

**Public visitors online (n)**
```
[◐]     Visitor · flag City, CC
         Current page                          📱 mobile · Safari · 2m
                                               [Open →]  ← opens PublicVisitorDrawer
```

Rules:
- Only `freshness === "live"` rows render.
- Empty group → single line “No members online” / “No public visitors online”. No dashed placeholders.
- Both groups empty → one panel-level empty state “Quiet right now”.

## 9. PagesLive design

```
/pro/james-wilson              6 viewers   4 public · 2 members  [avatars]
/directory/personal-trainer    3 viewers   3 public              [avatars]
/                              2 viewers   1 public · 1 member   [avatars]
```

- Rows only for pages with ≥1 live viewer. Never render zero-count rows.
- Empty state: single line “No pages being viewed right now.”
- Click row → filters OnlineNow + map to that path.

## 10. StatusStrip (replaces CommandStrip)

Single row, small cards, equal but compact. **5 tiles + health dot.**

| Tile | Value | Owner hint |
|---|---|---|
| Live now | `public+members` (live only) | “Quiet right now” when 0 |
| Public now | live public | “—” when 0 |
| Members now | live members | “—” when 0 |
| Conversions today | key-actions count | enquiries · signups · checkouts |
| Action queue | attention count | “All clear” when 0, red badge when critical |

Right-aligned health dot:
- healthy → dot only, no text
- degraded → amber dot + “Degraded”
- broken → red dot + “Broken” (also fires AlertBand)

## 11. ActionQueue (rebuilt)

Priority order (top → bottom):
1. Open disputes
2. Failed payments
3. Urgent support (< 4h SLA)
4. Verification blockers
5. Suspicious activity
6. System failures

Everything else (aged low-priority support, informational) collapsed under
**“Other warnings (n)”** disclosure. Never shows aged emails as if they were
live incidents.

## 12. Historical accordion

Single `<Collapsible>` group, closed by default:
- 24h analytics summary — labelled *Historical · refreshed {n}m ago*
- Member top pages (24h)
- Recent activity feed

Never competes visually with live.

## 13. Component inventory (new / rename / delete)

**New files**
- `src/lib/activity/freshness.ts`
- `src/components/admin/activity/StatusStrip.tsx`
- `src/components/admin/activity/OnlineNow.tsx`
- `src/components/admin/activity/PagesLive.tsx`
- `src/components/admin/activity/ActionQueue.tsx`
- `src/components/admin/activity/HistoricalPanel.tsx`
- `src/components/admin/activity/DiagnosticsDrawer.tsx`
- `src/routes/admin_.diagnostics.tsx` (optional; drawer first, route later)

**Rewritten**
- `WorldMapPanel.tsx` — freshness rules, legend, zero-live overlay, cap radius, `ResizeObserver`.
- `RealtimeSummaryCard.tsx` — owner copy, quiet state, remove “scope” / “public ingest quiet”.
- `admin_.activity.tsx` — new layout composition; header loses Backfill.

**Retired (deleted or unused)**
- `CommandStrip.tsx` (replaced by StatusStrip).
- Any zero-row placeholder logic in `LiveActivityRail.tsx` (folded into OnlineNow/PagesLive).

## 14. Acceptance screenshots target (10-point)

Return these captures on the implementation pass:

1. Full page at 1440×900 — Live is dominant, Historical closed.
2. Full page at 1280×800 — layout holds, no overflow.
3. `live=0` state — map has no live markers, hero says “Quiet right now”, StatusStrip reads 0s with muted styling.
4. `live>0` state — map dots present with legend, RealtimeCard shows per-minute + donut.
5. OnlineNow with 1 member + 1 public — full row detail (avatar/tier/flag/page/device/last-seen/Open).
6. PagesLive with 3 active pages — no zero rows.
7. AlertBand visible with 1 critical (payment failure) — StatusStrip health dot red.
8. Historical accordion opened — 24h summary shows “refreshed Nm ago”.
9. Diagnostics drawer opened — Backfill geo button lives here, ingest/linker/rollup shown here only.
10. PublicVisitorDrawer opened from OnlineNow — JourneyTimeline renders; masked IP + reveal audit path unchanged.

## 15. Guardrails (do not touch)

Server functions · IP-reveal audit path · ActivityFeedV2 · EventDetailSheet ·
`resolveLocation` · auth · DashboardShell · consent/beacon code · MaxMind
enrichment · `visitor_journeys` schema. **No new server functions required
for this rebuild.**

---

## 16. Sequenced implementation (once approved)

1. Save this plan to `docs/admin-v2/`.
2. Add `freshness.ts`; wire into map + StatusStrip + OnlineNow.
3. Build `StatusStrip`; delete `CommandStrip` usage; remove header Backfill button.
4. Rewrite `WorldMapPanel` (zero-live overlay, legend, live/recent/country-only styles, cap radius).
5. Rewrite `RealtimeSummaryCard` copy + quiet state.
6. Build `OnlineNow` + `PagesLive`; retire `LiveActivityRail`.
7. Build `ActionQueue` (priority + collapsed “Other warnings”).
8. Build `HistoricalPanel` (Collapsible).
9. Build `DiagnosticsDrawer` (moves Backfill geo + ingest/linker/rollup).
10. Compose new `admin_.activity.tsx`.
11. E2E: `tests/e2e/admin-activity.spec.ts` — 10 acceptance checks.
12. Capture the 10 screenshots and return the evidence pack.

**Awaiting approval before any code changes.**
