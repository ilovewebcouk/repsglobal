---
name: Trainer imagery
description: Locked visual style + logo source for any generated trainer/coach image across the app
type: design
---

# Trainer imagery

Any generated image of a trainer/coach MUST carry the REPS logo on the garment and match the Built For Independence visual style.

## Logo source (LOCKED — single source of truth)

The ONLY canonical REPS logo file is `src/assets/brand/logo.svg`. Always composite the real file onto the garment — never describe it in prose.

Workflow for every apparel render:
1. Rasterise `src/assets/brand/logo.svg` to a high-res white-on-transparent PNG:
   `nix run nixpkgs#librsvg -- --width=1600 --keep-aspect-ratio src/assets/brand/logo.svg -o /tmp/reps-logo.png`
2. ALWAYS use `imagegen--edit_image` (never `generate_image` alone) and pass BOTH `src/assets/about/about-independence.jpg` (style benchmark) AND the rasterised logo PNG as references.
3. Render the logo as real embroidery / print on fabric — follows folds, picks up rim light, **always pure white** regardless of garment colour.
4. Placement: small left-chest for editorial / single-subject; centred chest for wide / group shots.

Do NOT use `/mnt/user-uploads/logo*` or any other logo file.

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
