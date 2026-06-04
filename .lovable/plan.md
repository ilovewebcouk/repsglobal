# Swap homepage hero back to the original (Black coach + Latina client)

## What to do

Single one-line edit in `src/routes/index.tsx`:

- Line 29: change the import back from `home-hero-coaching-v2.jpg.asset.json` → `home-hero-coaching.jpg.asset.json`.

## Bank the v2 image

Keep `src/assets/home-hero-coaching-v2.jpg.asset.json` in the project (do NOT delete the asset or the pointer file). The asset stays on the CDN and the pointer file stays in the repo, so we can swap back to it in one line whenever you want. No other files reference it.

## QA after the swap

Live screenshot at the current viewport (1484px) to confirm:
- Original Black coach + Latina client image is rendering.
- The recent hero overlay/positioning fix still works correctly with this image (object-right anchor, single soft left-to-right gradient) — the original was previously composed with subjects in the right half too, so it should land cleanly without the old translate3d hacks.

If the gradient/anchor needs a small re-tune for the original image, do it as a follow-up after confirming.

## Out of scope

- No changes to copy, layout, or anything else on the page.
- No image regeneration.
- No file deletions.

## Files touched

- Edited: `src/routes/index.tsx` (one line)
