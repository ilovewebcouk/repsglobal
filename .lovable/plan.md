## Goal
Make the trainers look like they're actually standing in the gym by merging the two existing images (`hero-gym-bg.jpg` + `hero-trainers-cutout.png`) into one AI-composited hero image with matched lighting, contact shadows, and color grade.

## Steps

### 1. Generate the composite
- Tool: `imagegen--edit_image` with both source images as input.
- Aspect: 16:9, saved as `src/assets/hero-composite.jpg`.
- Prompt locks: same two trainers (faces, skin tones, outfits, REPs logo on male's tank), same gym scene, trainers placed right-of-center mid-ground, cinematic depth-of-field, matched warm gym lighting with real contact shadows under their feet.

### 2. Update `src/routes/index.tsx` hero block (lines ~155–185)
- Replace the gym `<img>` + absolutely-positioned trainer `<div>` (with its ground shadow and drop-shadow) with a single `<img>` of `hero-composite.jpg`.
- Keep the left-to-right dark gradient overlay so the headline and CTA stay readable.
- Keep the bottom fade into the search panel.
- Remove the now-dead trainer cutout import if nothing else uses it.

### 3. Leave source assets in place
Keep `hero-gym-bg.jpg` and `hero-trainers-cutout.png` so we can re-roll the composite without regenerating from scratch.

## Out of scope
Copy, Why REPs card, search panel, header, mobile layout (mobile keeps the gym backdrop alone), design tokens, any other section.

## Risk
AI compositing may need 1–2 re-rolls to keep faces and outfits true. If the first result drifts, we iterate on the prompt before touching the markup.
