# ProCard layout fix

**Goal:** Remove the white gap under each trainer's image by vertically centering the middle text column, and move the tag chips (e.g. Pilates, Reformer Pilates, Posture) directly under the blurb paragraph — matching the locked mockup.

## Changes (single file: `src/routes/find-a-professional.tsx`, `ProCard` component only)

1. **Grid alignment**
   - Change the card grid from `sm:items-start` to `sm:items-center` so the middle column centers against the 112px image. This eliminates the empty space under the image.

2. **Move tags into the middle column**
   - Remove the tag chip row from the right-hand action column.
   - Render the tag chips inside the middle column, immediately below the blurb `<p>`, left-aligned.

3. **Right column = actions only**
   - Right column keeps just "View Profile" (primary orange button) and "Save" (ghost button), stacked and vertically centered.
   - Remove the `flex-col items-stretch gap-2 sm:items-end` wrapper's tag children; keep the two buttons.

## Out of scope

- No changes to data, other cards, filters, hero, trust band, testimonial, or design tokens.
- No new components, no responsive breakpoint changes beyond what's needed for the realignment.
- Mobile (`<sm`) stays single-column stacked as today.
