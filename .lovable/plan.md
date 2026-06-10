## Goal

Regenerate the 3 remaining About-page images (`about-hero.jpg`, `about-heritage.jpg`, `about-professionals.jpg`) at cinematic-editorial quality, with the **exact correct REPS wordmark** rendered as real apparel detail on the trainer.

`about-independence.jpg` (Section 8) is the locked benchmark and is NOT regenerated.

## Step 1 — Lock the canonical logo (before any image work)

Single source of truth for every future REPS apparel render:

- **`src/assets/brand/logo.svg`** — verified to match `src/components/brand/RepsWordmark.tsx` (`viewBox 0 0 267.34 48.17`, R/E/P/S paths identical, fill `#fff`).
- Rasterise it once at high resolution to a PNG (`/tmp/reps-wordmark-reference.png`, ~1600px wide, transparent background, pure white fill) so it can be passed directly into `imagegen--edit_image` as a visual reference alongside the benchmark photo.
- Update `mem://design/trainer-imagery` so the reference assets section points ONLY to `src/assets/brand/logo.svg` + the rasterised PNG. Remove the stale `/mnt/user-uploads/logo.png`, `logo.svg`, `logo-4.svg` references — those are not the locked file.

No image is generated until this step is complete and verified.

## Step 2 — Section-by-section brief (only sections that carry photography)

The About page has 10 sections; only 4 use editorial imagery. The brief for each:

### Section 1 — Cinematic hero (`about-hero.jpg`)
- **Role on page:** Wide background behind the H1 "The professional platform for the modern fitness industry." Copy sits left under a `HeroOverlay copySide="left"` wash, so the right two-thirds of the frame must carry the visual.
- **Aspect / framing:** 16:9, wide cinematic. Subject right-of-centre; left third intentionally negative/atmospheric so headline + lede + 2 CTAs read cleanly over the wash.
- **Subject:** One REPS-registered coach mid-session with one client (e.g. spotting a barbell back squat, or coaching a single-arm row). Coach front-facing, eye-line into the room — not at camera.
- **Wardrobe:** Coach in heather charcoal premium performance tee with a **small left-chest REPS wordmark** (white, ALL CAPS, exact `logo.svg` geometry). Client in plain dark training kit, no logo.
- **Environment:** Urban-industrial warehouse gym — exposed brick, raw steel rig, polished concrete, large factory windows. City skyline visible through windows in deep background, soft and out of focus.
- **Light:** Golden-hour low side-light from the windows, strong rim on the coach's shoulder, soft fill on the client.
- **Treatment:** A24-meets-Lululemon. Anamorphic grain, shallow DoF, creamy bokeh, muted film palette. Photoreal, no text overlays, no signage.

### Section 4 — Heritage bridge (`about-heritage.jpg`)
- **Role on page:** 4:5 portrait in a `rounded-[22px]` frame next to the "Heritage in the name. Modern in everything else." copy. Subject's gaze and energy should feel calm, considered, expert — the visual embodiment of "rebuilt for the modern industry".
- **Aspect / framing:** 4:5 portrait. Single subject. Mid-shot (waist up), slight low angle to feel authoritative without being heroic.
- **Subject:** One female head coach in a quiet moment — chalked hands resting on a kettlebell handle, or wrapping wrists at a kit rack. Looking off-camera, three-quarter face.
- **Wardrobe:** Same heather charcoal premium tee, **small left-chest REPS wordmark** (white, exact geometry).
- **Environment:** Same urban-industrial warehouse / studio as Section 1. Background: exposed brick, kit rack with neat row of kettlebells, golden window light just behind her shoulder.
- **Light / treatment:** Identical golden-hour rim-light language as `about-independence.jpg`. Same grain, palette, DoF.

### Section 7 — System behind the listing (`about-professionals.jpg`)
- **Role on page:** 4:5 portrait beside the 6-pillar text link list. Should read as "the people building real careers in fitness" — collaborative, professional, not solo-influencer.
- **Aspect / framing:** 4:5 portrait. Two coaches mid-conversation in a doorway or loading-bay opening — a brief debrief, one holding a coaching notebook / tablet, the other gesturing toward the gym floor.
- **Subjects:** Two coaches, mixed (e.g. one male / one female). Both in **heather charcoal tees with small left-chest REPS wordmark** (white, exact geometry — both shirts identical wordmark).
- **Environment:** Industrial loading-bay doorway of the same warehouse gym. Golden-hour rim light spilling in from outside, training floor blurred behind them.
- **Light / treatment:** Match `about-independence.jpg` exactly — grain, palette, DoF, mood.

### Section 8 — Built for independence (`about-independence.jpg`) — **NOT REGENERATED**
This is the locked benchmark every other shot is being matched against.

### Sections 2, 3, 5, 6, 9, 10 — no photography
Stat strip, manifesto, FeaturedProCard grid, "More than a directory" 50/50, horizon close, FinalCta. Out of scope for this pass.

## Step 3 — Generation method

For each of the 3 images:

1. Call `imagegen--edit_image` (not `generate_image`) with **two reference inputs**:
   - `src/assets/about/about-independence.jpg` (locked tone / light / wardrobe benchmark)
   - `/tmp/reps-wordmark-reference.png` (locked wordmark geometry — rasterised from `src/assets/brand/logo.svg`)
2. Prompt re-states the exact section brief from Step 2 plus the geometry rules from `mem://design/trainer-imagery` (R chamfer, stepped E corner, etc.) and the white-on-charcoal rule.
3. Output written to a temp path, then uploaded via `lovable-assets create` and the existing `.asset.json` pointer overwritten.
4. After each upload, use `image_tools--zoom_image` on the chest area to verify the wordmark reads as **REPS** in the correct geometry (4 letters, ALL CAPS, white, no drift). If it drifts, regenerate before moving on.

## Step 4 — Memory update

Update `mem://design/trainer-imagery`:
- Replace the "Reference assets" block to point exclusively to `src/assets/brand/logo.svg` (+ rasterised PNG at `/tmp/reps-wordmark-reference.png`).
- Remove all `/mnt/user-uploads/logo*.{svg,png}` references.
- Add a one-line rule: "Always pass `src/assets/brand/logo.svg` (or its rasterised PNG) into `imagegen--edit_image` as a reference input — never describe the wordmark from prose alone."

## Out of scope

- Section structure, copy, type scale (page is locked per `mem://design/locked-about`).
- New images for sections 2/3/5/6/9/10.
- Touching `about-independence.jpg`.
- Replacing `RepsWordmark.tsx`, header, footer or any logo render in the UI — only on-apparel renders in the 3 photos change.
