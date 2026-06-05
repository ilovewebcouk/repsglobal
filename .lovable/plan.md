## Problem

On `/find-a-professional`, the left filter rail uses `lg:sticky lg:top-6` (24px). The `PublicHeader` on this page is rendered as `fixed inset-x-0 top-0` with a 72px row height, so when the user scrolls the sticky aside slides up underneath the navbar and the top of the filter card gets visually clipped.

## Fix

Single edit in `src/routes/find-a-professional.tsx`, line 284:

- Change `lg:sticky lg:top-6` → `lg:sticky lg:top-[88px]`
  - 72px header + 16px breathing gap = 88px
  - Matches the editorial rhythm without leaving a giant air gap

No other files change. No token, layout, or component-structure changes.

## Verify

Screenshot `/find-a-professional` at 1440px, scroll past the hero, confirm:
- Filter card top edge sits ~16px below the navbar bottom border
- Help card below it still scrolls into view normally
- Mobile (`<lg`) is unaffected — sticky only applies at `lg+`
