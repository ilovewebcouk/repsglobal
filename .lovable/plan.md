# Show 12 newest coaches on the homepage

Change the newest-coaches query on `/` from `limit: 16` to `limit: 12` so the grid renders exactly 4 rows of 3 on desktop (2 per row on tablet, 1 per column on mobile).

## Change
- `src/routes/index.tsx` line 194: `getNewestCoaches({ data: { limit: 16 } })` → `getNewestCoaches({ data: { limit: 12 } })`.

No other changes — grid classes, empty state, and card component stay the same.
