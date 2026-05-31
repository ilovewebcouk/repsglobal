## Make service-card images a touch taller

The mock-up images sit closer to a 5:4 ratio (slightly taller than wide); the current `aspect-[4/3]` reads as too short/letterboxed.

### Change

`src/routes/pro.$slug.tsx` line 423:

- `aspect-[4/3]` → `aspect-[5/4]`

That's the only edit. Image, icon badge position, title, description, and price lockup all stay the same.

### Out of scope

No other changes anywhere on the page.
