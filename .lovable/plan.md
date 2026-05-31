## Restore original Specialisms pill size

The pills were shrunk in an earlier pass (gap-1.5, px-2 py-1, text-[11px]) to force 3 lines. Revert to the original mock-up sizing.

### Change

In `src/routes/pro.$slug.tsx`, Specialisms block (~lines 459-467):

- container: `gap-1.5` → `gap-2`
- pill: `px-2 py-1 text-[11px]` → `px-3 py-1 text-[12px]`

Border, radius, colors, and wrap behavior unchanged. Tags will wrap to ~4 lines again, which is the original look.

### Out of scope

No other changes to Specialisms card, Location, Services & Pricing, or anywhere else.
