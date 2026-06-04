## Scope

Two visual polish changes on `/for-professionals-v2`:

1. **`ComparisonStrip.tsx` — replace column header text with logos**
   - REPs column → `<RepsWordmark />` (already used in `CompetitorCompare`), kept in `text-reps-orange`.
   - Trainerize / MyPTHub / PT Distinction → existing SVG logo assets at `src/assets/logos/{trainerize,mypthub,pt-distinction}.svg.asset.json`, rendered at ~20–22px height in white/80 so they read on the dark panel.
   - Update the `COLS` array from string literals to `{ label, logo?, logoHeight? }` objects (mirroring `CompetitorCompare`), and render `<img>` for logo cols, wordmark for REPs, with `alt` set to the label for a11y.
   - No other layout/table changes. Mobile horizontal scroll behaviour stays the same.

2. **Testimonials — replace initials-only avatars with real headshot images**
   - Generate 4 new headshots (existing `pro-james/sophie/laura/daniel.jpg` are reused heavily across the site, so make fresh ones for this surface):
     - `src/assets/testimonials/james-carter.jpg` — male strength coach, 30s, Manchester gym backdrop (for `TestimonialFeature`)
     - `src/assets/testimonials/sofia-reyes.jpg` — female Pilates instructor, 30s, bright studio backdrop
     - `src/assets/testimonials/marcus-okafor.jpg` — male online coach, 30s, neutral home-office backdrop
     - `src/assets/testimonials/ella-marsh.jpg` — female studio owner, 40s, boutique studio backdrop
   - All photos: warm, professional, candid editorial style, soft natural light, looking toward camera, head & shoulders crop, consistent treatment so the triad reads as a set. Generated via `imagegen--generate_image` at 768×768 (square, since avatars are circular).
   - Wire each image into an `<AvatarImage src={…} alt={name} />` inside the existing `<Avatar>` in `TestimonialFeature.tsx` and `TestimonialTriad.tsx`. Keep `<AvatarFallback>` with the initials as the loading/error fallback. No size or layout changes.

## Out of scope

- v1 page, hero device cluster, pillar tabs, comparison page (`/compare`), or any other surface.
- Copy edits to quotes, names, stats, or roles.
- Adding logos anywhere outside the `ComparisonStrip` header row.
- Migrating existing `pro-*.jpg` references elsewhere.

## Files touched

- `src/components/marketing/ComparisonStrip.tsx` — header logo swap (+ logo imports).
- `src/components/marketing/TestimonialFeature.tsx` — add `AvatarImage` with James Carter headshot.
- `src/components/marketing/TestimonialTriad.tsx` — add `AvatarImage` for Sofia / Marcus / Ella.
- New: `src/assets/testimonials/{james-carter,sofia-reyes,marcus-okafor,ella-marsh}.jpg`.

## Risk / notes

- Generated faces are synthetic stock-style; matches the existing Phase 1 placeholder pattern (real opted-in quotes/photos still need to land before public launch — leaving the existing "Phase 1 placeholder" comment in place).
- Logos are dark-mode-friendly SVGs already used on `CompetitorCompare`, so no contrast surprises expected.
