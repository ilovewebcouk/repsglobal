## Goal

Reduce the heaviness on the left side of the `/features/operations` hero so the copy area feels open and atmospheric (like the trainer side) instead of a solid black panel — while keeping headline/lede contrast strong.

## What's causing it

Three stacked layers all darken the left:
1. Linear gradient: `rgba(10,10,12,0.88)` at 0% → `0.70` at 35%.
2. Radial gradient anchored at 15%/55% at `0.55` opacity.
3. Orange radial wash (minor).

Stacked, the left ~35% is effectively ~94% black — flatter and darker than intended.

## Change (desktop only, mobile untouched)

In `src/routes/features.operations.tsx` `Hero()`:

- Linear gradient: soften stops to
  `rgba(10,10,12,0.72) 0% → 0.55 at 30% → 0.20 at 58% → 0 at 78%`.
- Left radial: drop opacity from `0.55` to `0.32` and shrink to `50% 80%`.
- Leave the orange top-left glow and bottom fade as-is.

Net effect: the left retains enough darkening for AA contrast on white headline + `/80` lede, but the image texture (warm room glow, bokeh) reads through instead of being crushed to flat black.

## Verification

Re-screenshot `/features/operations` at 1440 wide and confirm:
- Headline + lede still pass contrast.
- Left side shows image texture, not a solid panel.
- Trainer on the right stays fully visible (unchanged).
