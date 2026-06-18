## Summary
Two small layout fixes for `FeaturedProCard`.

## Changes

### 1. Shorten the "In-person & Online" label so the city/mode row stops wrapping
In `src/components/public/FeaturedProCard.tsx`:
- Add a tiny display helper that maps the `mode` string to a compact form:  
  `"In-person & Online"` → `"Hybrid"`  
  `"In-person"` → `"In-person"` (unchanged)  
  `"Online"` → `"Online"` (unchanged)
- Render the compact label in the card. The underlying `FeaturedPro.mode` type and all data-conversion functions stay exactly as-is — this is purely a presentational alias.

### 2. Show every specialty pill instead of capping at 2
In the same file:
- Remove `.slice(0, 2)` from the tag mapping so all of `pro.tags` renders.
- Keep the existing `flex-wrap gap-1` styling; extra pills will simply wrap to a new line inside the card.

## Why
- Daniel Hughes’ card wraps because “Covent Garden” + “In-person & Online” is too wide for the row. “Hybrid” is short enough to fit on one line with every city name.
- Katie Gibbs (and others) have 3+ specialties but only 2 were visible because of the hard slice.

## Verification
Screenshot `/professions/personal-trainer` after the change and confirm:
1. Daniel Hughes’ city + mode row is a single line.
2. Katie Gibbs shows 3 pills instead of 2.