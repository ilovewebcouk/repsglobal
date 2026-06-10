## Goal
Replace the **About page hero image only** with a stronger, world-class image that matches the locked visual register and uses the **exact REPS header logo from `logo.svg`** on the garment.

## What I’ll change
1. **Regenerate the hero image** in a tighter documentary-real / premium editorial register.
2. **Use the exact header logo treatment** from `src/assets/brand/logo.svg` on the garment — not a typed wordmark approximation.
3. **Keep the current page layout, overlay system, copy, CTAs, and other About images unchanged** unless the new hero framing requires a minor crop adjustment.
4. **Replace only `src/assets/about/about-hero.jpg.asset.json`** with the new uploaded asset pointer.

## Creative direction to match
- Golden-hour rim light
- Urban / industrial training backdrop
- Calm, self-possessed expression
- Realistic textile rendering
- No graphic overlays baked into the image
- Muted film palette
- Soft grain
- Shallow depth of field
- Must feel cohesive with **Built for Independence** and the stronger About imagery set

## Quality bar
The new hero needs to improve on the current one by:
- making the logo read as the **actual REPS header mark**, not just “REPS” text
- feeling less generic and more premium/editorial
- giving the left-side headline cleaner visual support
- preserving strong subject clarity on the right without awkward crop pressure near the top edge
- keeping the industrial warmth and orange-adjacent glow without looking staged or over-processed

## Technical details
- Source-of-truth logo reference: `src/assets/brand/logo.svg`
- Page route consuming the asset: `src/routes/about.tsx`
- Asset to replace: `src/assets/about/about-hero.jpg.asset.json`
- No route redesign or copy changes planned
- I’ll QA the final hero in the About preview for:
  - exact logo treatment
  - tonal match with the rest of the page
  - headline legibility on the left
  - framing/crop quality at the current desktop viewport

## Deliverable
A single new hero asset, wired into the About page, with the existing page structure preserved.