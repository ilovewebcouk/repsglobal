Remove "As featured in" and "Where you'll find our trainers" sections from every page in the app.

## Scope

1. **"As featured in" (`PressMarquee`)** — remove from:
   - `src/routes/index.tsx` (homepage)
   - `src/routes/for-professionals.tsx`
   - `src/routes/specialisms.tsx`
   - `src/components/features/FeatureGroupLayout.tsx`
   - `src/components/features/PillarPage.tsx`

2. **"Where you'll find our trainers" (`VenueMarquee`)** — remove from:
   - `src/routes/cpd.tsx`

3. **Cleanup** — remove now-unused imports for `PressMarquee` and `VenueMarquee` in each affected file.

No layout, copy, or other section changes. These sections will be brought back post-launch.