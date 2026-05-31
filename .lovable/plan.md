## Move service icon to straddle the image/body seam

In the mock-up, the orange icon circle sits at the **bottom-left of the image** and overlaps onto the dark card body. That overlap pushes the title down, giving the card more vertical breathing room.

### Changes (`src/routes/pro.$slug.tsx`)

1. **Icon position** (line 430): from `absolute left-3 top-3` to `absolute left-3 -bottom-4` so the circle straddles the seam (half on the image, half on the body).

2. **Body top padding** (line 434): bump from `p-4` to `pt-7 px-4 pb-4` so the title clears the overlapping icon.

That's it — image ratio (5/4), title, description, and price lockup all unchanged.

### Out of scope

No other cards, sections, or pages.
