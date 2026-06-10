---
name: Trainer imagery
description: REPS wordmark placement, geometry, color, and execution rules for any generated trainer/coach image across the app
type: design
---

# Trainer imagery — REPS wordmark on apparel

Any generated image of a trainer/coach MUST show a visible "REPS" wordmark on their T-shirt/polo, rendered as real woven/embroidered/printed garment detail (never an overlay, sticker, or sign).

## Wordmark geometry (LOCKED 2026-06-10 — must match RepsWordmark SVG)

The on-shirt wordmark must match the site header logo (`src/components/brand/RepsWordmark.tsx`, sourced from the uploaded `logo.svg` / `logo.png`). Distinguishing features the image model MUST reproduce:

- ALL CAPS, four letters: **R · E · P · S**
- Heavy custom geometric sans — wider than tall on each letter, even stroke weight
- **Diagonal / chamfered corner cuts** on specific letter edges (not a generic blocky sans). The letters read with a subtle forward-leaning energy from these angled cuts.
- **R**: counter has a small angled notch; the leg has a clean diagonal kick
- **E**: top-right corner is stepped/chamfered (not square)
- **P**: round bowl, vertical stem, tight aperture
- **S**: classic balanced S, even weight

Color: **always pure WHITE** regardless of garment colour. Never orange, never tonal, never lowercase, never "REPs".

Placement: small left-chest for editorial / premium / single-subject shots; centred chest for wide / group / team shots.

## Reference assets (use with `imagegen--edit_image` for accuracy)

For best fidelity, pass the actual logo file as a reference image when generating/editing trainer shots:
- `/mnt/user-uploads/logo.png` — white wordmark on transparent
- `/mnt/user-uploads/logo.svg` / `logo-4.svg` — vector source

When generating from scratch with `imagegen--generate_image`, describe the geometry above explicitly — generic "REPS in bold sans-serif" produces the wrong letterforms.

## Canonical visual style (LOCKED — source of truth)

`src/assets/about/about-independence.jpg` is the visual benchmark for every REPs trainer image across the app. New trainer images must match its look:

- Cinematic editorial documentary photography
- Urban-industrial backdrop (warehouse / loading bay / exposed brick + raw steel / city skyline beyond)
- Golden-hour rim light, dawn or low sun
- Heather charcoal grey premium performance t-shirt
- Muted film palette, soft anamorphic grain, shallow DoF, creamy bokeh
- Premium athletic editorial mood (A24-meets-Lululemon)
- Photo-realistic, no text overlays, no logos other than the chest REPS wordmark

## About-page image set (LOCKED 2026-06-10)

- `about-independence.jpg` — solo trainer, dawn studio (BENCHMARK)
- `about-hero.jpg` — trainer + client mid-session, warehouse window light
- `about-heritage.jpg` — solo female trainer, chalked hands, kit rack
- `about-professionals.jpg` — two trainers conferring at loading-bay doorway

Re-generate any of the four if the chest wordmark drifts from RepsWordmark geometry.
