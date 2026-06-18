# City pages QA: add missing cities + fix stale hero location

## Bug 1 — Glasgow and Bristol missing from LOCATIONS

`src/routes/in.$location.tsx` only defines 4 entries in `LOCATIONS` (London, Manchester, Birmingham, Edinburgh). Glasgow and Bristol fall through to the generic fallback (region "", placeholder counts, generic blurb).

**Fix:** Add `glasgow` and `bristol` entries to `LOCATIONS` with the same shape as the existing four — `slug`, `name`, `region`, `blurb`, `count`, `areas`, `professions[]`. Use realistic district names (Glasgow: City Centre, Merchant City, West End, Finnieston, Southside, Shawlands; Bristol: City Centre, Clifton, Redland, Bedminster, Stokes Croft, Harbourside) and counts in proportion to the existing tier (Glasgow ≈ 69, Bristol ≈ 58 per the `CITIES` table on `/professions/$profession`).

## Bug 2 — Hero search field stuck on "London" across all city pages

`src/components/search/InlineHeroSearch.tsx` initialises `where` from `lockedCity` only inside the `useState(() => …)` initializer (line 131), which runs once per component mount. When the user navigates between `/in/london` → `/in/glasgow` → `/in/bristol`, TanStack reuses the same `InlineHeroSearch` instance, so `where.label` stays as whatever the very first visited city was — usually London. The existing effect at line 144 explicitly bails out when `lockedCity` is truthy, so it never resyncs.

**Fix:** Add a small effect that resets `where` whenever `lockedCity` changes:

```ts
React.useEffect(() => {
  if (!lockedCity) return;
  setWhere({ mode: "city", label: lockedCity });
}, [lockedCity]);
```

Leave the existing origin-sync effect alone (it already returns early when `lockedCity` is set).

## QA after build

After both fixes, the `/in/glasgow`, `/in/bristol`, `/in/manchester`, `/in/birmingham`, `/in/edinburgh` hero search "Where" field must read the correct city, and the page metadata/blurb/areas must match.

## Out of scope

- Adding more cities beyond Glasgow and Bristol.
- Wiring real Supabase-backed counts into the static `LOCATIONS` table (Phase 1 static numbers remain).
- Touching `/find-a-professional` results, `CITIES` on profession pages, or `TOP_LOCATIONS` in nav.
