## Shrink Specialisms tags to fit 3 lines

### What
Reduce the size of the tag pills inside the Specialisms card so 7 items wrap to 3 lines instead of 4.

### How
In `src/routes/pro.$slug.tsx`, update the Specialisms tag map (around line 430):
- Change `px-3 py-1` → `px-2 py-0.5`
- Change `gap-2` → `gap-1.5`
- Keep `text-[12px]` or bump down to `text-[11px]` if needed after preview

### Verify
- Preview `/pro/sophie-taylor` (or `/pro/james-carter`) at the current 1469px viewport
- Confirm the 7 specialism tags now wrap to exactly 3 lines
- No other sections touched