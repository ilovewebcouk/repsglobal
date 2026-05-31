## Goal
Fine-tune the hero so the trainer sits cleanly in the gap between the headline and the Why REPs card, and add a REPs wordmark to his tank's left chest.

## Steps

### 1. AI-edit the hero image to add the wordmark
- Tool: `imagegen--edit_image` on `src/assets/hero-coaching-moment.jpg`, overwriting in place.
- Prompt: add a small white "REPs" wordmark printed on the trainer's left chest, athletic-apparel print, follows fabric curvature, matches warm tungsten lighting. Preserve face, pose, gym, depth-of-field, and color grade exactly.

### 2. Shift framing
- `src/routes/index.tsx` line 151: change `object-center` to `object-[25%_center]` so the trainer moves out from behind the headline and into the clear zone in front of the Why REPs card.

### 3. Verify
- Take a preview screenshot.
- If the trainer overshoots or still overlaps the headline, tune the x% in increments of 5 (range 20–35%).

## Out of scope
Headline, sub-copy, CTA, Why REPs card, search panel, header, mobile layout, design tokens.

## Risk
AI text rendering can mis-spell "REPs" on the first pass. If the result is dirty, re-roll once; if still bad, fall back to overlaying an SVG REPs wordmark via CSS positioned over the chest.
