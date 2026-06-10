# Regen `/about` hero to match the locked editorial standard

You're right. Independence is the source of truth. The current hero doesn't sit at that bar — the lighting is too even, the casting reads commercial, and the wordmark on the tee is not the real `logo.svg` letterforms. This plan resets the hero against the standard you set, with the brand logo wired in properly.

## The standard (re-stated, for compliance)

From Independence / Professionals / Heritage:
- Cinematic editorial **documentary** photography. A24 × Lululemon.
- **Urban industrial**: warehouse interior or loading bay, exposed brick, raw steel, concrete. If outside, city skyline beyond.
- **Light**: single hard rim — dawn or low golden sun — raking across the subject. Near-black shadow side. One light source, no fill.
- **Wardrobe**: charcoal heather premium performance tee, white **REPS** wordmark (real embroidery, ALL CAPS, exact `src/assets/brand/logo.svg` letterforms).
- **Finish**: muted film palette, soft 35mm anamorphic grain, shallow DoF, creamy bokeh, deep blacks.
- **Subject**: one person, between moments, unaware of camera. Quiet, not posed.
- **No** text overlays, **no** graphics, **no** second light, **no** rig clutter, **no** second equipment piece, **no** stock fitness pose.

## Scene for the new hero — solo coach, loading-bay doorway, dawn

Single male coach, early-30s, charcoal heather REPS performance tee. He's standing in the open roller-door of a converted warehouse / loading bay, **half-silhouetted against a low orange dawn sky** with a faint city skyline behind. Raw steel door frame, exposed brick to one side, concrete loading ramp. Kit bag at his feet. He's looking out at the street, mid-breath before walking out — not at the camera. Hard golden rim light from the dawn sun catches the edge of his shoulder, jaw, the door frame, the steam from his breath in cold air. Interior of the warehouse falls to near-black on the right. Wide 16:9, subject centre-right, full negative-space upper-left and left for headlines.

This is a literal sibling to Independence — same photographer, same lookbook, same hour. Different subject, different beat.

## Why this scene (not the warehouse two-shot)

- One subject, one light, one moment — the rule that makes the other three work.
- Loading-bay doorway gives both **industrial interior** (brick/steel/concrete) and **city beyond** in one frame — the brief's "or" becomes an "and".
- Dawn + breath + kit bag tells the story without props or models. Pure between-moments.
- Avoids the second-solo-coach-walking-out problem (option 2 from last turn) by keeping him **inside** the threshold, not on the street.

## Logo fix (this is the real fix)

Stop asking the image model to render "REPS" from a text description. It will always invent letterforms.

Two-pass with the **actual SVG** as a reference image:
1. **Pass 1 — base scene**, plain charcoal tee, blank left chest, no wordmark at all.
2. **Pass 2 — embroidery composite**: `imagegen--edit_image` with **two inputs** — the base from pass 1 AND `src/assets/brand/logo.svg` (rasterized to white-on-transparent PNG first). Prompt: *"Composite the supplied REPS wordmark exactly as shown — same letterforms, same proportions, ALL CAPS — as small white embroidered thread on the coach's left chest. Follow fabric folds. Pick up the dawn rim light. Do not redraw the letters."*

Then zoom in with `image_tools--zoom_image` on the chest crop. If the letterforms aren't a 1:1 match to `logo.svg` (R-E-P-S, with that specific R counter and S curve), reject and re-composite. No deliverable until the wordmark passes a side-by-side with the SVG.

## Execution order

1. Rasterize `src/assets/brand/logo.svg` → `/tmp/reps-logo-white.png` (white fill on transparent, 2× source resolution).
2. `imagegen--edit_image` with **two style refs**: `src/assets/about/about-independence.jpg` + `src/assets/about/about-professionals.jpg`. 16:9. Full scene prompt above. Output `/tmp/about-hero-v11-base.jpg`. Blank chest.
3. Zoom-inspect: lighting hardness, shadow depth, subject behaviour, no clutter. If any reject criterion (see below) fires, regen base before logo pass.
4. `imagegen--edit_image` with `[/tmp/about-hero-v11-base.jpg, /tmp/reps-logo-white.png]` → `/tmp/about-hero-v11.jpg`. Embroidery prompt above.
5. Zoom-inspect chest at 4× — letterforms must match `logo.svg`. Reject + redo composite if not.
6. `lovable-assets create --file /tmp/about-hero-v11.jpg --filename about-hero.jpg` → overwrite `src/assets/about/about-hero.jpg.asset.json`.
7. Update alt on `src/routes/about.tsx` line 135 to: *"A REPs-registered coach in the doorway of a warehouse gym at dawn."*
8. QA `/about` against Independence + Heritage + Professionals stacked. Must read as the **fourth frame from the same shoot**, not a different photographer.

## Hard reject criteria (regen, do not deliver)

- Two people in frame
- Subject facing or looking at camera
- Smiling, posing, "model" energy
- Even/diffuse light, lifted shadows, multiple light sources
- Barbell, rack, plates, dumbbells, or any equipment in frame (this is a doorway shot, not a gym-floor shot)
- Wordmark letterforms not matching `logo.svg` at 4× zoom
- Wordmark in orange, grey, or any colour other than white
- Wordmark centred chest (must be small left chest)
- Cartoonish / 3D-render / overly polished commercial look
- Missing dawn warmth or missing city/skyline beyond the doorway
- Anything that doesn't read as the same shoot as Independence

## Out of scope

- No `/about` layout, copy, section-order, or other image changes.
- Heritage, Independence, Professionals images stay as-is.
- No restructuring (page is LOCKED per `mem://design/locked-about`).
