# Ranking reset + nearest-sort polish — make `/find-a-professional` 10/10

## The bug, in one paragraph

Katie Gibbs (Lowestoft, verified, quality 102) is ranking below seven London demos (verified, quality 117) because on first paint `viewerOriginEarly` is `null` (localStorage is read inside a `useEffect`). The server query goes out with `sort_by_nearest: false`, falls back to the default ladder `verified → hasAvatar → paidTier → quality → recency`, and quality 117 beats 102. Once origin hydrates the query refetches — but the silent fallback is wrong on principle: "Nearest" should never quietly render a non-nearest list.

Separately, the discrete `hasAvatar` tier double-counts what `quality_score` already weights, and can flip a high-quality no-photo verified pro under a low-quality verified pro who happens to have any avatar.

## The plan

### 1. Collapse the sort ladder — `src/lib/directory/search.functions.ts`

Drop the `hasAvatar` tier. Demote paid tier below quality (it's a tie-break, not a primary signal).

**Nearest (origin set):**
1. 1-mile distance bucket
2. verified
3. quality_score
4. paid tier (tie-break)
5. raw distance
6. recency

**Default (no origin):**
1. verified
2. quality_score
3. paid tier (tie-break)
4. recency

Update the doc comment at the top of the handler to match.

### 2. Make `quality_score` actually reward an avatar

Audit the `quality_score` SQL function. If "has avatar" isn't already weighted (e.g. +10), add it. This preserves the *intent* of the avatar bump without it being a hard tier that can override quality. Only ship the SQL migration if the audit shows it's missing.

### 3. Resolve origin BEFORE the first query — `src/routes/find-a-professional.tsx`, `src/lib/useViewerOrigin.ts`

Today origin only exists after `useEffect` runs. World-class = no flicker, no silent fallback.

- Read origin synchronously from `localStorage` inside the initial `useState`, guarded for SSR (`typeof window !== "undefined"`). No `useEffect` race.
- Accept `?near=NR32` (or `?near=52.475,1.75`) in the route search schema. If present, it overrides localStorage and is the source of truth for that visit (and gets persisted).
- When `sort=nearest` and origin is still `null` after that, **do not** send the query with `sort_by_nearest: false`. Show the existing "Set your postcode to sort by distance" prompt in the results column, with the postcode entry inline. Once they enter it, the query fires.

### 4. Show the origin in the toolbar, always — `src/components/directory/ResultsSearchBar.tsx`

When origin is set, render a small chip next to the sort selector:

`Near Lowestoft NR32 · change`

Clicking "change" opens the existing postcode entry. This makes "Nearest" legible — the user always knows what it's measured from. Removes the entire class of "why is this pro first?" confusion.

### 5. Distance on every card, not just the first — `src/routes/find-a-professional.tsx` card render

Today only card #1 gets the "Closest" badge; the rest only show miles inline near the town label. World-class directories (Airbnb, Booking, Google) show distance on **every** result when a location is set.

- When `origin` is set and `_miles != null`, render a small distance pill in a consistent slot on every card (top-right of the meta row, next to the town): `0.1 mi · Lowestoft`.
- Keep the "Closest" treatment on card #1 (subtle emphasis, not a different layout) so the eye still lands there first.

### 6. Verify

After changes, with origin = Lowestoft:
- Katie Gibbs → row 1, `0.1 mi · Lowestoft` pill visible.
- Other Suffolk/East Anglia pros (if any) → next, quality order within each 1-mile bucket.
- London demos → far down the list with `~120 mi · Mayfair / Soho / …` pill visible.
- Toolbar chip reads `Near Lowestoft NR32 · change`.
- Switching to `sort=nearest` with no origin shows the postcode prompt instead of a quality-ranked list under a "Nearest" label.

I'll spot-check the new sort against live data via `supabase--read_query` before closing.

## Files touched

- `src/lib/directory/search.functions.ts` — collapse sort ladder.
- `src/routes/find-a-professional.tsx` — drop silent fallback; render per-card distance pill; accept `?near=` search param.
- `src/lib/useViewerOrigin.ts` — synchronous initial read (SSR-guarded).
- `src/components/directory/ResultsSearchBar.tsx` — "Near {town} {outward} · change" chip when origin set.
- *(Conditional)* `quality_score` SQL function — add avatar weight if missing.

## What this does NOT change

- No visual redesign of cards, toolbar layout, map, or pagination.
- No change to radius filtering, rating filter, mode (online / in-person), or venue filter.
- No change to how postcode entry / geolocation actually captures origin — only when it's read and how it's surfaced.
- Locked Phase 1 visuals stay locked; this is data + one toolbar chip + one card pill.

## Honest take

With 1–5 done, this is genuinely 10/10 for the nearest-sort UX. The bug is fixed at the root (not patched), the ranking is explainable in one sentence ("closest mile wins, then verified, then quality"), and the user can always see what "Nearest" means. Without #3 and #4, it's a 7 — correct logic but still relies on the user to *remember* what origin they set.
