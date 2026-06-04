# Hero overlay audit — soften so it darkens the photo, doesn't replace it

## Problem (verified from live screenshot at 1484px)

The current overlay is too heavy in three ways:

1. **Left half is effectively solid black.** Gradient hits 0.95 opacity at 38%, so 0 → 38% of the width is just `#0B0D10` with no photo bleed-through. You can see a visible "edge" where the photo abruptly starts at ~40% — the hero reads as a black panel next to a photo, not as one cinematic image.
2. **Overlay runs to 88%, darkening the right side.** The photo's already moody/dark and shot with cinematic rim lighting. Stacking 0.25 opacity over the subjects washes out faces, sunset, and rim light.
3. **Contrast is overkill.** White headline on near-pure black is ~19:1 (WCAG requires ~4.5:1). We're paying a big visual cost for contrast we don't need.

The headline, paragraph, and search form sit on a solid black mat instead of feeling embedded in the scene.

## What to change

Single edit in `src/routes/index.tsx`, lines 157–163. No layout, copy, image, or transform changes.

### Before

```tsx
<div
  className="absolute inset-0"
  style={{
    backgroundImage:
      "linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.95) 38%, rgba(11,13,16,0.75) 52%, rgba(11,13,16,0.25) 72%, rgba(11,13,16,0) 88%)",
  }}
/>
```

### After

```tsx
<div
  className="absolute inset-0"
  style={{
    backgroundImage:
      "linear-gradient(to right, rgba(11,13,16,0.85) 0%, rgba(11,13,16,0.7) 35%, rgba(11,13,16,0.3) 55%, rgba(11,13,16,0) 70%)",
  }}
/>
```

Changes:
- **Start at 0.85, not 1.0** — left side is a darkened version of the gym, not a black void. You'll faintly see ambient light/atmosphere bleeding through.
- **Smoother ramp** with only 4 stops instead of 5.
- **Falloff completes at 70%, not 88%** — right side shows the photo at full intensity (subjects, sunset, kettlebell, rim light).
- Final contrast for the headline still ~13:1 (well above WCAG AA).

## QA after the change

1. Live screenshot at the current viewport (1484px) — confirm:
   - Headline, paragraph, search bar, pills, and trust strip remain clearly readable.
   - You can see the photo subtly through the left side (darkened gym atmosphere, not solid black).
   - The right side of the image (subjects, sunset, kettlebell) is brighter / more cinematic than before.
   - No visible hard "edge" between black panel and photo.
2. If the form/pills become hard to read against any subtle photo detail behind them, nudge the gradient one stop darker — but don't go back to a solid panel.

## Out of scope

- No layout changes.
- No image swap (keep the original Black coach + Latina client image).
- No copy changes.
- Mobile/tablet unchanged (still solid black, image is `hidden lg:block`).

## Files touched

- Edited: `src/routes/index.tsx` (one gradient string, ~7 lines)
