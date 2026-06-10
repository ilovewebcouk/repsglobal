---
name: Trainer imagery
description: Locked visual style + logo source for any generated trainer/coach image across the app
type: design
---

# Trainer imagery

Any generated image of a trainer/coach MUST carry the REPS logo on the garment and match the Built For Independence visual style.

## Logo source (LOCKED — single source of truth)

The ONLY canonical REPS logo file is `src/assets/brand/logo.svg`. The brand identity IS the four-letter REPS wordmark with custom letterforms (specific R counter, curved S, unique E/P proportions). Always composite the real SVG raster onto the garment — never let the image model render it.

**Image models CANNOT reproduce exact letterforms.** Even with the SVG passed as a reference image, they will redraw the letters in a generic sans-serif approximation. The only acceptable method is **deterministic post-composite via Python/Pillow**:

1. Generate the base photo with `imagegen--generate_image` (premium tier) referencing the style of `src/assets/about/about-independence.jpg`. **The tee chest must be completely blank** — explicitly prompt "no logo, no graphics, no text on the shirt".
2. Rasterise the SVG: `nix run nixpkgs#librsvg -- --width 1200 src/assets/brand/logo.svg -o /tmp/reps-logo-white.png`
3. Run a PIL composite script (see `/tmp/compose-logo.py` as canonical template) that:
   - Resizes the logo to ~130px wide for single-subject editorial shots (~3 fingertips)
   - Applies ~0.6px gaussian blur (integrates with photo grain)
   - Applies a horizontal tint gradient matching the scene's rim-light direction
   - Sets alpha to ~0.88 so the tee weave shows through (embroidery feel)
   - Pastes at small left-chest (wearer's left = camera-right of torso, near collarbone height)
4. Zoom-verify at 4× — letterforms must be pixel-identical to `logo.svg`.

**Never** use `imagegen--edit_image` to "composite" the logo — it will redraw. Never use `/mnt/user-uploads/logo*` or any other logo file.

Placement: small left-chest for editorial / single-subject; centred chest for wide / group shots. Always pure white regardless of garment colour.

## Visual style (LOCKED — source of truth)

`src/assets/about/about-independence.jpg` is THE benchmark. Every trainer image must match:

- Cinematic editorial documentary photography
- Urban-industrial backdrop (warehouse / loading bay / exposed brick + raw steel / city skyline beyond)
- Golden-hour rim light, dawn or low sun
- Heather charcoal grey premium performance t-shirt
- Muted film palette, soft anamorphic grain, shallow DoF, creamy bokeh
- Premium athletic editorial mood (A24-meets-Lululemon)
- Photo-realistic, no text overlays, no extra logos

## About-page image set

- `about-independence.jpg` — solo trainer, dawn studio (BENCHMARK)
- `about-hero.jpg` — fitness pro, urban dawn, low golden rim
- `about-heritage.jpg` — solo female trainer, chalked hands, kit rack
- `about-professionals.jpg` — two trainers conferring at loading-bay doorway

Re-generate any image whose chest logo drifts from the actual `logo.svg`.
