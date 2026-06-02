## Goal
Prevent iOS Safari from zooming the viewport when the user taps the mobile search input opened from the header magnifying glass.

## Root cause
iOS Safari auto-zooms into any focused `<input>` with a computed `font-size` below 16px. The mobile search sheet input in `src/components/public/PublicHeader.tsx` (line ~849) uses `text-[14px]`, which trips this behavior.

## Change
In `src/components/public/PublicHeader.tsx`, update the mobile search sheet input className:

- Replace `text-[14px]` with `text-[16px]` on that single input.
- Leave all other inputs and the desktop/scrolled search pill untouched.

That is the entire code change — one class swap, scoped to the mobile sheet.

## Why not the other options
- The `font-size: 16px` + `transform: scale()` trick keeps the 14px look but mis-aligns caret/placeholder and complicates focus styling. Not worth it for a 2px difference.
- Doing nothing is acceptable but the zoom is noticeable on first tap and feels unpolished.

## Verification
Reload `/` on the mobile preview (390×844), tap the header magnifying glass, tap into the input — viewport should no longer zoom. Desktop header search pill is unaffected.
