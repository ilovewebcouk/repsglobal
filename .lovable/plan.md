# Hero composition QA — fix the transforms, not the image

## Root cause

The hero image in `src/routes/index.tsx` (lines 151–172) applies four stacked effects tuned for the OLD image:

1. `transform: translate3d(22%, 0, 0)` — pushes the whole image 22% right (this is the "shifted right" you remembered).
2. `scale(1.05)` — 5% zoom that compounds clipping at the right edge.
3. `object-[center_25%]` — anchors to the TOP 25% of the image. The old image had subjects high up; the new one has them mid-frame with the barbell at the bottom, so this crops away the most powerful part of the shot.
4. Two stacked dark overlays (left-to-right gradient + bottom-left radial vignette). Both were needed when the image was bright edge-to-edge. The new image already has clean black negative space on the left, so these flatten it.

The image itself is correctly composed. The transforms are fighting it.

## What to change

Single file: `src/routes/index.tsx`, lines 151–172 only. No other files, no copy, no image, no layout structure.

### Before

```tsx
<img
  src={heroCoaching.url}
  alt=""
  style={{ transform: "translate3d(22%, 0, 0) scale(1.05)" }}
  className="absolute inset-0 h-full w-full origin-right object-cover object-[center_25%]"
/>
<div
  className="absolute inset-0"
  style={{
    backgroundImage:
      "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.9) 25%, rgba(11,13,16,0.55) 40%, rgba(11,13,16,0.15) 60%, rgba(11,13,16,0) 75%)",
  }}
/>
<div
  className="pointer-events-none absolute inset-0"
  style={{
    backgroundImage:
      "radial-gradient(ellipse 70% 55% at 20% 100%, rgba(11,13,16,0.95) 0%, rgba(11,13,16,0.7) 35%, rgba(11,13,16,0.25) 60%, rgba(11,13,16,0) 80%)",
  }}
/>
```

### After

```tsx
<img
  src={heroCoaching.url}
  alt=""
  className="absolute inset-0 h-full w-full object-cover object-right"
/>
<div
  className="absolute inset-0"
  style={{
    backgroundImage:
      "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.85) 30%, rgba(11,13,16,0.25) 55%, rgba(11,13,16,0) 75%)",
  }}
/>
```

Changes:
- Drop the `translate3d` push and the `scale` zoom — the image is already composed for this frame.
- Swap `object-[center_25%]` → `object-right` so the photo anchors to the subjects (the right half), keeping the barbell visible at the bottom.
- Replace the two stacked overlays with ONE softer left-to-right gradient that only darkens the leftmost ~30% (where headline sits) and clears by 75%, letting the cinematic right side breathe.

## QA after the change

1. Live screenshot at the current viewport (1484px) — confirm headline is still readable, subjects are no longer clipping, barbell is visible at the bottom.
2. Live screenshot at 1920px — confirm full coach is visible and nothing critical clips.
3. Confirm mobile/tablet still show solid black (unchanged behavior — image stays `hidden lg:block`).

## Out of scope

- No changes to copy, search bar, trust strip, or anything below the hero.
- No changes to the image asset.
- No changes to mobile/tablet hero behavior.
