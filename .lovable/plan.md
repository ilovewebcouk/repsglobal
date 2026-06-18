## Bug

On `/find-a-professional`, clicking the **What are you looking for?** chip, typing "fat loss" and pressing **Enter** does nothing useful — Fat Loss is highlighted in the dropdown, but the URL ends up with no `specialism` (and even drops the existing `city`). The list never narrows to fat-loss pros.

## Root cause

`patch()` in `src/components/directory/ResultsSearchBar.tsx` (the URL-writer used by the chip) runs this guard on every profession-related change:

```ts
if ("profession" in p) {
  const nextProf = typeof p.profession === "string" ? p.profession : null;
  const nextSpec = typeof next.specialism === "string" ? next.specialism : null;
  if (nextSpec && !isSpecialismValidForProfession(nextSpec, nextProf)) {
    delete next.specialism;
  }
}
```

`WhatChip.onPick` for a generic specialism like **Fat Loss** calls:

```ts
patch({ profession: undefined, specialism: "fat-loss", q: undefined })
```

So:

1. `"profession" in p` is `true` (the key exists, value is `undefined`).
2. `nextProf` becomes `null`.
3. `isSpecialismValidForProfession("fat-loss", null)` returns `false` (guard returns `false` whenever profession is null).
4. `next.specialism` is deleted → the URL loses the only meaningful filter the user just chose.

The guard was meant to protect against switching to a different profession that doesn't own the current specialism — not against clearing profession or selecting a profession-agnostic specialism.

## Fix (one file)

`src/components/directory/ResultsSearchBar.tsx` — tighten the guard so it only runs when profession is being set to an actual non-empty value:

```ts
// Only validate when switching TO a defined profession. Clearing profession
// (or picking a profession-agnostic specialism like "fat-loss") must NOT
// wipe the specialism the user just chose.
if ("profession" in p && typeof p.profession === "string" && p.profession) {
  const nextSpec = typeof next.specialism === "string" ? next.specialism : null;
  if (nextSpec && !isSpecialismValidForProfession(nextSpec, p.profession as ProfessionSlug)) {
    delete next.specialism;
  }
}
```

After the fix, pressing **Enter** on the highlighted "Fat Loss" item navigates to `?city=London&specialism=fat-loss` and the result list narrows correctly. The free-text "Search for …" fallback (`q=…`) already works the same way through the same patch path and is unaffected.

## Out of scope

- The hero search on `/`, `/in/$city`, `/professions/$profession` — uses `InlineHeroSearch`, different code path, not affected by this bug.
- Adding live-as-you-type filtering of the result list. The current behaviour (chip opens a dropdown → pick / Enter → URL updates → list refetches) stays; only the Enter case is fixed.
- Any change to `isSpecialismValidForProfession` or the legacy-slug map.

## Verification

After the edit:
1. Load `/find-a-professional?city=London`.
2. Click the chip, type "fat loss", press Enter.
3. URL becomes `…?city=London&specialism=fat-loss` and the list shows pros tagged Fat Loss.
4. Repeat with "yoga" → URL gets `profession=yoga-teacher`.
5. Repeat with a nonsense string → free-text item selects, URL gets `q=…`.
