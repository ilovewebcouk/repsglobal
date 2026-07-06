# Homepage "Newest coaches" — from 4 to a 16-card wall of faces

Replace the current 4-card rail with a 16-card, 4×4 face-first grid. Keep the section slot and eyebrow; rebuild the card and drop the pagination arrows (they don't fit a static grid).

## Card redesign (face-first)

`src/components/public/NewestCoachCard.tsx` rewritten to prioritise the photo and shrink the meta so 16 units read as a wall, not a spec sheet.

- Whole card is a single `<Link to="/c/$slug">` — no "View profile" button.
- Square avatar fills the top, unchanged aspect (`aspect-square`, `object-cover object-top`).
- Below the photo: two lines only.
  - Line 1: **Name** — `font-display text-[15px] font-bold`, truncated.
  - Line 2: **Skill · City** joined by a middle dot — `text-[12px] text-reps-muted-light`, truncated.
- **Remove** from this variant: Star/rating chip, delivery-mode (Laptop icon), Verified pill, Save button, "View profile" CTA button.
- Hover: subtle lift only (`hover:-translate-y-0.5 transition-transform`), no scale of the photo (keeps the grid feeling calm at 16 units).
- Radius stays 18px per the locked radius system.
- Padding shrinks from `p-4` to `px-3 py-2.5` so the meta reads as a caption under the photo, not a body block.

The old shape (rating chip + delivery mode + CTA) is retained visually nowhere else, so no other consumer breaks — this component is only used on the homepage rail.

## Data change

`src/lib/directory/newest.functions.ts` — bump `limit` default and cap:
- `z.number().int().min(1).max(24).default(16)` (was `.default(4).max(12)` — need to check and widen).
- Ordering + filter unchanged (published, non-demo, individual/null, has `avatar_url`, newest first).
- Filter stays loose per your answer — no profession/city gate, no logo-vs-face heuristic.

`src/routes/index.tsx` — `useQuery` call passes `limit: 16`, `queryKey` bumped to `["home-newest-coaches", 16]`.

## Section rewrite (`src/routes/index.tsx`, ~L301–341)

- Keep the eyebrow "Just joined" + H2 "Newest coaches on REPS".
- Keep "View all" link.
- **Remove** the left/right chevron pagination buttons — meaningless for a static grid.
- Replace the responsive rail (`flex snap-x ... sm:grid sm:grid-cols-2 lg:grid-cols-4`) with a proper dense grid:
  - Mobile: `grid-cols-2 gap-3`
  - `sm`: `grid-cols-3 gap-4`
  - `lg`: `grid-cols-4 gap-4`
  - No horizontal snap-scroll at any breakpoint (the whole point is showing the density).
- 16 rows / 4 cols = 4 rows on desktop, 4 rows on `sm` (5–6 rows), 8 rows on mobile. Long on mobile is fine — this section is exactly the moment users want to see "there are lots of real people here."

## What I'm deliberately NOT doing

- Not adding a "photo is a real face, not a logo" filter — no reliable auto-detector, and you said keep it loose. The Alt Fitness–style logo tile will occasionally appear.
- Not adding a profession/city completeness filter — same reason.
- Not touching `FeaturedProCard` (still used on locked pages).
- Not changing any other homepage section — locked-homepage memory stands, this is the same section slot, just denser.
- No mock/demo profiles; strictly whatever the DB returns.

## Verification

- `bunx tsgo --noEmit` clean on the three edited files.
- Load `/` and confirm: 16 tiles, 4×4 on desktop, no horizontal scrollbar, hover lift works, each tile navigates to `/c/{slug}`.
- Confirm section still hides entirely when `newestCoaches.length === 0`.
