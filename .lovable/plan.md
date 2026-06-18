Make every FeaturedProCard the same height within its grid row and push the "View Profile" button to the bottom so all buttons line up horizontally, regardless of varying name length, location text, or tag count.

### What to change

1. **`src/components/public/FeaturedProCard.tsx`**
   - Add `flex flex-col` to the `<article>` root so the card becomes a flex container.
   - Wrap the text content block (name, role, rating, city/mode, tags) in a wrapper with `flex-1` so it expands to fill available vertical space.
   - Keep the "View Profile" `<Link>` as the last child so it naturally sits at the bottom.

2. **Parent grids** (e.g. `src/routes/professions.$profession.tsx`, `src/routes/in.$location.tsx`, `src/routes/about.tsx`)
   - Ensure the card receives `h-full` (or the grid uses `items-stretch`) so each grid cell stretches to the tallest card in the row.

### Why this works

Cards currently have no vertical stretching: content with longer text (e.g. Daniel Hughes’ two-line location) pushes its own button lower, while shorter cards leave whitespace above the button. By giving the card `flex flex-col` and the middle content `flex-1`, the button is forced to the bottom edge on every card, and the parent grid makes all cards in a row match the tallest one.

### Verification

Screenshot `/professions/personal-trainer` after the change and confirm all four "View Profile" buttons share the same baseline.
