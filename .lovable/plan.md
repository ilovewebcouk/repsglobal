## Goal
Rebuild the homepage hero search to 10/10 + remove the avatar rotation. Use primitives that already exist in the codebase — no new infra.

## 1. Avatar rotation → one shuffled snapshot per load
**File:** `src/lib/directory/hero.functions.ts`
- Server fn already returns the verified-pro pool. Add a Fisher–Yates shuffle inside the handler so the order is randomised per request (SSR cache caveat: keep a 60s `Cache-Control` if any, but server fns are per-call).

**File:** `src/routes/index.tsx` (`HomeHeroAvatars`)
- Delete the 4s `setInterval` and `offset` state.
- Render `pool.slice(0, 4)`.
- Keep the fallback-when-<4-rows path.

## 2. New search taxonomy with synonyms
**New file:** `src/lib/search/taxonomy.ts`
Unified, typed catalogue used by the combobox:
```ts
type SearchEntry = {
  kind: "profession" | "specialism" | "goal" | "mode";
  slug: string;
  label: string;
  group: "Professions" | "Goals & specialisms" | "Training mode";
  synonyms: string[];   // lowercase: "pt", "weight loss", "bad back", "prenatal", …
  route: { specialism?: string; profession?: string; q?: string };
};
export const SEARCH_ENTRIES: SearchEntry[] = [...];
export function searchTaxonomy(query: string): SearchEntry[];  // fuzzy match label + synonyms
```
- Source: existing `PROFESSIONS` (7) + `SPECIALISMS` (16) + the 2 mode entries (in-person / online).
- Synonyms hard-coded per entry (e.g. `personal-trainer`: ["pt","personal training","1-1","one-to-one"]; `fat-loss`: ["weight loss","slim down","cut","get lean"]; `rehab-injury`: ["bad back","injury recovery","physio","post-op"]; `pre-post-natal`: ["prenatal","postnatal","postpartum","pregnancy"]).
- Matcher: case-insensitive substring on `label` + every synonym; prefix matches rank higher than mid-string matches.

## 3. New `HeroSearch` component
**New file:** `src/components/home/HeroSearch.tsx` (replaces inline `HomeHeroSearch` in `index.tsx`)

Layout: identical glass-pill shell, but each "input" opens a Popover with shadcn `Command`.

### "What" field — Command combobox
- Trigger: button styled to look identical to the current input (search icon, white text, placeholder "Personal trainer, fat loss, yoga…").
- On focus / click → opens `Popover` containing `Command`.
- `CommandInput` placeholder: "Try 'PT', 'fat loss', 'SW1A'…".
- Empty state (no query): show `CommandGroup` "Popular" with the 6 existing goal chips (Fat Loss, Strength, Mobility, Pre/Post-Natal, Rehab & Injury, Sports Performance) — same slugs already wired.
- Typing: results grouped by `Professions` then `Goals & specialisms` then `Training mode`. Each item shows label + tiny grey synonym hint when matched via synonym ("rehab & injury — matched 'bad back'").
- Keyboard: ↑↓ Enter selects; selecting fills the trigger label + stores `{kind, slug, route}` in component state.
- Bottom-of-list "free-text" fallback row: "Search for '<query>'" → sets `q` to the literal string (current behaviour preserved as escape hatch).

### "Where" field — postcode/town + geolocate + Places autocomplete
- Trigger: button (map-pin icon, label = current location label or "London, SW1A, postcode").
- Opens Popover with:
  - **Inline `Input`** accepting free text. Debounced 250 ms.
  - **Geolocate button** at the top of the popover (📍 "Use my current location") — calls existing `resolveViewerLatLng` flow from `ViewerOriginControl` (extract the mutation hook into a shared `useResolveViewerLocation` hook in `src/lib/profile/useResolveViewerLocation.ts`).
  - **Suggestions list (Command)** below the input. Source: Google Places API (New) `AutocompleteSuggestion.fetchAutocompleteSuggestions` via the browser key (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`), restricted to UK + `(regions)` types (cities, towns, postcodes, postal codes). Lazy-load Places JS only when popover first opens. Session token reused per popover lifecycle.
  - **Postcode shortcut:** if input matches UK postcode regex (`/^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2}$/i`), top suggestion = "Search around <UPPERCASE>" → calls existing `resolveViewerPostcode` server fn.
  - Selecting any suggestion: resolves to `{ lat, lng, label }` (Places `Place.fetchFields(['location','formattedAddress','addressComponents'])`) and writes it as the viewer origin via `useViewerOrigin().setOrigin(...)` (existing localStorage store) AND fills the trigger label. Falls back to free-text city if Places returns nothing.

### Submit routing (deterministic, never silent dead-end)
On submit (Enter or "Find your coach" button) build the search params:
- If "what" entry kind=`profession` → `?profession=<slug>`.
- kind=`specialism` or `goal` → `?specialism=<slug>`.
- kind=`mode=online` → `?specialism=online-coaching`.
- Free-text fallback → `?q=<text>` (preserves today's behaviour).
- If viewer origin set OR user picked a Places suggestion → `?sort=nearest` (loader already supports nearest sort via existing viewer origin).
- If `city` typed without resolving → pass `?city=<text>` (existing fallback).
- Always include `page=1&sort=recommended` unless overridden by nearest.
- Navigate to `/find-a-professional` with the typed search object.

## 4. Tighten `/find-a-professional` for the new inputs
**File:** `src/routes/find-a-professional.tsx`
- No schema changes — `validateSearch` already accepts `profession`, `specialism`, `city`, `q`, `sort`.
- Add a small banner above results when `q` is set but profession/specialism wasn't picked: "Showing name & headline matches for '<q>'. Did you mean: [Personal Trainer] [Yoga Teacher] …" — runs the same `searchTaxonomy()` against the query and links to the structured URL. This is the "no silent dead-end" guarantee for zero-result `q=yoga` cases.

## 5. Reusable hook extraction
**New file:** `src/lib/profile/useResolveViewerLocation.ts`
Extracts the two mutations from `ViewerOriginControl` so both the hero and the existing inline control share one implementation. `ViewerOriginControl` refactored to consume the hook (no UX change there).

## 6. Verification
- `bun add` nothing — all deps present.
- Manual: load `/`, confirm avatars are different each refresh; click "what" → empty popover shows 6 goal chips; type "pt" → "Personal Trainer" first; type "bad back" → "Rehab & Injury" matched-via-synonym; click "where" → geolocate button works, type "SW1A" → postcode shortcut, type "Manchester" → Places suggestions; submit → URL has correct typed params; on `/find-a-professional` confirm distance/nearest-sort kicks in when origin set.

## Out of scope (explicit)
- No changes to `/find-a-professional` results UI, card design, or any other locked screen.
- No new SEO landing routes (`/personal-trainers/manchester` etc.) — they fall out naturally later from the now-structured URLs; not built this turn.
- No analytics events (worth adding later; not in this ticket).
- No copy changes elsewhere on the homepage.

## Files touched
- New: `src/lib/search/taxonomy.ts`
- New: `src/components/home/HeroSearch.tsx`
- New: `src/lib/profile/useResolveViewerLocation.ts`
- Edited: `src/routes/index.tsx` (replace inline `HomeHeroSearch` + remove rotation)
- Edited: `src/lib/directory/hero.functions.ts` (shuffle)
- Edited: `src/routes/find-a-professional.tsx` ("Did you mean" banner only)
- Edited: `src/components/directory/ViewerOriginControl.tsx` (use shared hook)