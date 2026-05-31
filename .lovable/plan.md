## Goal
Lock the CTA T-shirt wordmark — bold all-caps **REPS®** in off-white — as a reusable SVG logo asset, then apply it to the hero trainer's vest in place of the current baked-in "REPs" text.

## Steps

### 1. Create the locked wordmark SVG
- New file: `src/assets/reps-wordmark.svg`
- Bold geometric sans-serif (heavy weight, Inter/Manrope feel), all-caps **REPS** + small superscript **®**.
- Fill `#F4F1EA` (warm off-white matching the CTA shirts and the ivory token).
- Clean viewBox so it scales sharply from a small chest print up to large hero use.

### 2. Strip the existing baked wordmark from the hero photo
- `imagegen--edit_image` on `src/assets/hero-coaching-moment.jpg`, overwriting in place.
- Prompt: remove the "REPs" wordmark from the tank top, restore plain black fabric with the same lighting and drape, preserve face, pose, gym, depth-of-field, and color grade exactly.
- One re-roll if the face drifts.

### 3. Overlay the SVG on the hero vest
- In `src/routes/index.tsx`, inside the hero background `div`, add an `<img src={repsWordmark}>` absolutely positioned over the trainer's left chest.
- Sits inside the same transformed wrapper as the photo (or mirrors the same `scale-110 translate-x-[18%]`) so it tracks the trainer across breakpoints.
- Styling for printed-fabric feel: `opacity-90`, soft drop-shadow, very slight `skew-y-[-3deg]`, `mix-blend-mode: screen` if it reads cleaner.
- `pointer-events-none`, `aria-hidden`, `hidden lg:block`.

### 4. Verify at three viewports
- Take preview screenshots at desktop (~1469), tablet (~820), mobile (~414).
- Confirm the mark sits cleanly on the chest with no clipping or drift; tune position/scale only.

## Out of scope
CTA section, headline, sub-copy, Why REPs card, search panel, design tokens, mobile hero layout, any future T-shirt store wiring.

## Risk
AI removal of the existing wordmark may slightly alter the chest fabric or lighting. If it does, re-roll once; if still off, revert the JPG and overlay the SVG on top of the old wordmark (the SVG will fully cover it at the same position).
