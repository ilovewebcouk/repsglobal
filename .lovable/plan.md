## Goal
Make all rating `Star` icons use the REPs orange instead of the current gold (`#D9B66F`).

## Changes
Replace `fill-reps-gold text-reps-gold` (and the wrapping `text-reps-gold` on rating rows) with `fill-reps-orange text-reps-orange` at these star locations:

- `src/routes/find-a-professional.tsx:479` — RatingRow wrapper span
- `src/routes/find-a-professional.tsx:484` — filled stars in RatingRow
- `src/routes/find-a-professional.tsx:523` — inline star next to rating number
- `src/routes/index.tsx:411` — rating row wrapper span
- `src/routes/index.tsx:412` — inline star

Empty/unfilled stars keep `text-reps-stone`.

## Out of scope
- `ShieldCheck` icon at `src/routes/index.tsx:214` (not a star) stays gold.
- `--reps-gold` token and `--chart-4` mapping remain untouched (still used by ShieldCheck / charts).
