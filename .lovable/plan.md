## Change

Drop the `Map` option from the view toggle. Toggle becomes **List ↔ Split** (desktop) and **List ↔ Split** on mobile too (mobile already falls back gracefully). Add an Airbnb-style **expand control inside the map** that swaps Split ↔ Map (full-width map with a floating "Show list" pill to come back).

## UX

- Desktop default: Split view (list left, map right).
- Inside the map, top-right corner, a small white pill button: `⤢ Expand map`.
- Clicking it sets `view=map`: list hides, map fills the canvas.
- In expanded mode, the same corner shows `⇤ Show list` to return to Split.
- Mobile: unchanged — view toggle stays List ↔ Map (no Split on mobile anyway, since the split layout is `lg+` only). The expand control is hidden below `lg`.

## Files

- `src/components/directory/ResultsSearchBar.tsx`
  - `ViewToggle`: remove the Map button on `lg+`. Mobile keeps List/Map binary (since Split is desktop-only).
- `src/components/directory/ResultsMap.tsx`
  - Add optional `expanded?: boolean` + `onToggleExpand?: () => void` props.
  - Render a floating pill (top-right, inside the map container) when `onToggleExpand` is provided: shows `Expand map` when collapsed, `Show list` when expanded. Uses `lucide-react` `Maximize2` / `Minimize2` icons. Hidden below `lg` via `hidden lg:flex`.
- `src/routes/find-a-professional.tsx`
  - Pass `expanded={view === "map"}` and `onToggleExpand={() => patch view between "split" and "map"}` to `<ResultsMap />`.
  - Keep existing `showMapAside` / `hideListAtLg` layout logic — it already handles `view === "map"` correctly (list hides, map fills).

## Out of scope

- No change to mobile map experience (still full-screen sheet via `MapIcon` FAB).
- No change to sort/filter/pagination behavior.
- No change to URL schema — `view=map` and `view=split` already valid.
