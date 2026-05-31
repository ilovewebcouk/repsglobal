## Why card 1 looks different — and the fix

All three cards have identical structure, sizing, and aspect ratio. The visual difference is content, not layout:

- **Card 1's image** (`hero-coaching-moment.jpg`) is a dark gym shot that blends into the dark `bg-reps-panel` card body. The image-to-body seam vanishes, the icon's bottom half disappears against the dark image, and the ring (`ring-reps-panel`) blends in too. Result: the icon looks like it floats over the image rather than straddling the seam.
- **Cards 2 & 3** use bright portrait shots (`pro-daniel.jpg`, `pro-sophie.jpg`) with light skin against the dark body, so the seam and icon ring read clearly.

### Fix

Swap card 1's image to a brighter, higher-contrast shot so the seam reads the same as the other two cards.

`src/routes/pro.$slug.tsx` line 103:
- `image: heroCoaching` → `image: proLaura` (Laura portrait — same look as the other two cards)

That's the only change. No structural edits, no other cards touched.

### Out of scope

Layout, padding, icon position, aspect ratio, and everything else stays exactly as-is.
