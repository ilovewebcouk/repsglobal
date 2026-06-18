# Revert "Popular gyms" to pill style

In the city-page hero sidebar (`/in/$location`), the "Popular gyms" block is currently rendering as a vertical stacked list. That broke the hero composition — it should be wrapping pills, matching the old "Popular areas" treatment.

## Change

In `src/routes/in.$location.tsx`, replace the `<ul>`/`<li>` stacked layout with the original `flex flex-wrap gap-1.5` pill row:

- Each gym = a single pill (`Link` to `/gyms/$slug`).
- Pill label = gym name only (no area subtitle, no chevron — keeps the hero compact).
- Pill style mirrors the previous areas chip: `rounded-full bg-reps-ivory px-2.5 py-1 text-[12px] font-medium text-reps-charcoal hover:text-reps-orange`.
- Block still hides when there are zero gyms.

## Out of scope

- The gyms server function, the data wiring, and the placeholder `/gyms/$slug` route stay exactly as they are.
- No changes to "All areas of {city}" further down the page.
