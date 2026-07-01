# Activity Map Behaviour QA — `WorldMapPanel`

## Current behaviour

| Capability | Status |
|---|---|
| Renders | ✅ Yes, via `react-simple-maps` + world-atlas topojson (CDN) |
| Client-only guard | ✅ `ClientOnly` wrapper + route is `ssr: false` |
| Country bubbles | ✅ Yes, driven by `page_views_24h` for radius |
| 24h activity layer | ✅ Sky-blue bubbles when `online == 0` |
| `online_now` layer | ✅ Pulsing orange when `online > 0` |
| Hover tooltip | ✅ Yes, top-right card with flag + counts |
| Click-to-filter | ✅ Yes, updates `selectedCountry` |
| Selected country state | ✅ Yes, orange bubble + white ring, other bubbles dimmed |
| Auto-updates on new session | ✅ Via `useQuery({ refetchInterval: 30_000 })` on `geoQ` |
| Auto-refresh without manual button | ✅ Every 30s |
| Zoom / pan | ⚠️ Partial — `ZoomableGroup` allows scroll-wheel zoom and drag-pan, but the UI has no zoom controls, no reset button, no visual affordance |
| Touch pinch zoom | ❌ Not tested; `react-simple-maps` supports it via `d3-zoom` but requires `filter` prop for touch events |
| Auto-fit active countries | ❌ Not implemented — always renders at `center=[10, 20]`, `zoom=1` |
| Auto-focus single active country | ❌ Not implemented |
| Fit bounds around multiple actives | ❌ Not implemented |
| Fallback when map fails | ✅ Yes, `MapFallback` renders a list |
| Empty state (no activity) | ✅ Yes, calm globe icon + message |

## Desired behaviour (per user spec)

1. Single active country → auto-zoom toward that country.
2. Multiple active countries → fit bounds around all.
3. No live but 24h activity → show 24h bubbles (already works).
4. No activity at all → calm empty state (already works).
5. Admin can reset to world view.
6. Touch/pinch zoom should work.

## Recommendation

**Do not swap the map library.** `react-simple-maps` handles the load fine
and is already wired. The polish work is:

### R1 — Add zoom controls + reset (small)

- Add `+` / `-` / `Reset` buttons overlaying the map (bottom-right).
- Wire to `ZoomableGroup` state (`useState` for `[zoom, center]`).

### R2 — Auto-fit to active countries (medium)

- Compute bounds of all bubbles with `online > 0` (or `views_24h > 0` as
  fallback).
- If 0 → world view. If 1 → `zoom: 3, center: [lng, lat]`. If N →
  compute mid-point and pick zoom via a simple bbox heuristic
  (`max(|lng_range|, |lat_range|)` → zoom).
- Only auto-fit on **first load** and when the active set changes. Do
  **not** override user's manual zoom during a session; provide the
  Reset button instead.

### R3 — Touch pinch (small)

- Pass `filter={() => true}` to `ZoomableGroup` and ensure the map
  container has `touch-action: none`.

### R4 — Do NOT

- Fake city-level bubbles (Cloudflare CF-IPCity is not enabled — country
  only).
- Show anonymous public-visitor bubbles (v1.2 is logged-in-only).

## Verdict

Current map is functional, honest, and fits the v1.2 remit. Auto-fit and
zoom controls are the highest-ROI additions. Deferred to the next
implementation pass; no changes made this turn.
