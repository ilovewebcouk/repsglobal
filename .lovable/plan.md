# Repurpose old hero into Heritage bridge (4:5 crop)

## What we're doing

The previous `/about` hero — solo female trainer on wet dawn steps, golden rim, REPS embroidery — was replaced this turn by the warehouse coach+client shot. It's a strong image and a different register from the current `about-heritage.jpg` (interior consultation). We'll re-crop it to **4:5 portrait** and use it as the new Heritage bridge image.

## Steps

1. **Recover the source.** The 16:9 file still exists at `/tmp/about-hero-v7.jpg` from this session. Use that as the master.
2. **Crop to 4:5 portrait** (e.g. 1280×1600) using ImageMagick — anchor on the subject (right two-thirds of the original). Preserve all grain, palette, embroidery and rim light; pure crop, no re-render. Save to `/tmp/about-heritage-v2.jpg`.
3. **Upload** via `lovable-assets create --file /tmp/about-heritage-v2.jpg --filename about-heritage.jpg` and overwrite `src/assets/about/about-heritage.jpg.asset.json`.
4. **Update alt text** in `src/routes/about.tsx` (line 240) to: "A REPs-registered trainer pauses on a wet dawn street after a hill session." Keep all other layout / copy / sections intact.
5. **QA** on `/about` at the heritage section — verify the 4:5 frame reads cleanly inside the existing 50/50 block and that the REPS embroidery is still legible at displayed size.

## Out of scope

- No layout/component changes to the heritage section
- No regeneration of the image — pure crop of the existing master
- No edits to other about-page images
- No changes to mem://design/trainer-imagery (visual style + logo source still apply)

## Fallback

If `/tmp/about-hero-v7.jpg` is no longer on disk (sandbox CWD resets, but `/tmp` should persist within the session), re-pull the previous hero's CDN URL from chat history and curl it before cropping.
