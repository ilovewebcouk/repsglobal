## Problem

Compared the locked mockup (`src/mockups/reps_fullpage_home_v1.png`) against the current hero asset:

- **Mockup:** trainers occupy ~40%–65% of the image width, scaled modestly, with dark gym extending across the right third behind the Why REPs card.
- **Current `src/assets/hero-trainer.jpg`:** trainers are oversized and sit flush right (~55%–100%), so they slide directly under the Why REPs card no matter how the gradient is tuned.

Gradient tweaks alone can't fix this — the figures need to physically move within the image.

## Fix

Re-edit `src/assets/hero-trainer.jpg` (in place) using `imagegen--edit_image`, keeping the same two trainers, lighting, wardrobe, and gym backdrop. The edit instructions:

- Shrink the trainer pair to roughly **70%** of their current size
- Reposition them so they sit centered around the **45%–50%** horizontal mark (i.e. between the headline column and where the Why REPs card lives)
- Extend the dark gym background (rack, weights, kettlebells, soft rim light) across the **right third** of the frame so the Why REPs card sits over environment, not bodies
- Keep the 21:9 aspect ratio and the existing dark, cinematic palette

## Code

No changes to `src/routes/index.tsx`. The current gradient (solid left → clear 45%–70% center → soft re-ink right) is already calibrated for trainers in the center band, so once the image moves it will line up automatically.

## Out of scope

No layout, copy, or token changes. Mobile/tablet gradients stay as-is.
