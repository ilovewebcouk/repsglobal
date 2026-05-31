## Remove region and tighten Location card

### What
Strip the `pro.region` ("Greater London") line from the Location card and reduce internal whitespace so the card feels denser and the right-hand column sits more evenly with About and Services.

### How
In `src/routes/pro.$slug.tsx`, Location card (around line 441):
- Delete the `<div>{pro.region}</div>` line (line 449)
- Reduce `mt-4` → `mt-3` on the content grid
- Reduce `gap-4` → `gap-3` on the content grid
- Remove `mt-1` from the "In-person at private studio or local gym" paragraph
- Reduce `mt-3` → `mt-2` on the "View on map" button

### Verify
- Preview `/pro/sophie-taylor` at 1469px
- Confirm the three-column row (About | Services | Specialisms+Location) looks level and the Location card no longer has dangling whitespace
- No other sections touched