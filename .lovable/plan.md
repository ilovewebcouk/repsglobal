## What's wrong

All 9 BEFORE chips currently force their logo into a 16×16 square slot (`h-4 w-4`). That works for the 7 single-glyph monochrome marks (Wix, Stripe, WhatsApp, etc.) but squashes Trainerize — whose asset is the original icon + "Trainerize" wordmark lockup — into an unreadable square.

## Fix

Allow chips to opt into a wordmark-shaped slot so the Trainerize lockup renders at its natural aspect ratio.

In `src/components/marketing/ReplacedStackBoard.tsx`:

1. Add an optional `wide?: boolean` flag to the `Before` type.
2. Mark the Trainerize entry with `wide: true`. No other entry changes.
3. In the chip render, when `wide` is true, swap the logo wrapper from the square `h-4 w-4` slot to a height-bound auto-width slot (`h-3.5 w-auto max-w-[64px]`) so the icon+wordmark sits cleanly inside the chip without squashing.
4. Keep the same 60% opacity / monochrome white treatment so it visually matches the other 8 chips.

No changes to copy, the AFTER card, the comparison strip above, or any other component. Trainerize keeps the same CDN asset that's already uploaded.