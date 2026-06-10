# Full rebuild: /about hero

## Goal

A hero photo that looks like the **same photographer, same day, same lens, same light** as `about-professionals.jpg` and `about-independence.jpg` — the two images you've already approved as the lookbook standard. Not a menswear ad. Not "guy in a doorway." A working coach, mid-moment, in a real warehouse training floor, with a real embroidered left-chest REPS mark.

## What "same lookbook" means (locked from the two reference shots)

- **Lens & framing**: 35mm full-frame equivalent, shallow DoF (~f/2), creamy bokeh. Subject 1/3 from frame edge, wide negative space on the opposite side for headline.
- **Light**: single hard golden window-key, low angle (~15–20°), raking from camera-left. Near-black shadow side. No fill. No softbox feel.
- **Palette**: muted film — warm amber highlights, cool teal-black shadows, slight desaturation, fine 35mm anamorphic grain.
- **Environment**: cavernous warehouse interior — exposed red brick, galvanised steel trusses, polished concrete, dust in the light shaft. No doorway. No street. No skyline. No barbells/racks/plates as the subject of the shot.
- **Wardrobe**: charcoal heather grey tee, completely blank chest at generation time (logo composited in post).
- **Subject**: solo male coach, early-30s, athletic but not bodybuilder, short dark hair, light stubble. Eyes off-camera, mouth mid-word, hands shaping a coaching cue. Never smiling-at-camera, never posing.
- **Format**: 1792×1024 (16:9), JPEG q92.

## Two-pass pipeline (deterministic logo, no model-generated wordmark)

### Pass 1 — Base photo (Gemini 3 Pro Image, premium)

Generate with both `about-professionals.jpg` and `about-independence.jpg` passed as **reference images** so the model matches photographer/lens/light/grade exactly. Prompt is built around: "match the photographer, lens, lighting, grade and grain of the reference images" + the scene spec above + the hard reject list (no second person, no smiling, no facing camera, no posing, no barbell/rack/plates as subject, no text, no chest graphic, no doorway, no street, no skyline, no tablet/phone, no even light, no lifted shadows, no 3D-render, no stock-fitness, no menswear-ad pose).

If pass-1 misses on any spec, regenerate up to 3 times before moving on — do not ship a near-miss.

### Pass 2 — Embroidered REPS mark (PIL composite, not AI)

Use `src/assets/brand/logo.svg` as the source — never a model-rendered wordmark. Script `/tmp/compose-logo-v2.py`:

1. `rsvg-convert` logo.svg → 256px-wide white PNG, transparent bg.
2. Resize to **~90–110px wide** (small left-chest, not centred billboard).
3. Position at **wearer's left chest** (camera-right of torso centre), ~3% down from collarbone, anchored to the tee fabric — not floating.
4. **Embroidery realism stack** (this is what was missing last pass):
   - Tint to off-white `#EDEAE3` (not pure white — pure white reads as a print/decal).
   - Apply a subtle bump/displacement map sampled from the underlying fabric pixels so the wordmark follows the tee's folds and weave.
   - Add a 1px dark inner-shadow (stitch-edge depression) + 1px warm highlight on the rim-light-facing side (thread catching the golden key).
   - Multiply blend at 88% opacity over the fabric (not normal blend).
   - 0.5px Gaussian blur to lose the SVG's vector crispness.
   - Add a faint stitch-noise texture at 6% opacity inside the letterforms.
5. Zoom-verify at 4× — letterforms still pixel-true to `logo.svg`, but the mark reads as **thread in fabric**, not a sticker.

### Pass 3 — QA before upload

Screenshot `/about` at 1536×864, zoom into chest at 4×. Reject and redo if any of:
- Logo reads as print/decal rather than embroidery
- Logo is centred, too large, or floating off the fabric
- Scene doesn't match the warmth/grade of the two reference images
- Any banned element from the reject list slipped in

Only then: `lovable-assets create` → overwrite `src/assets/about/about-hero.jpg.asset.json`.

## Other changes

- `src/routes/about.tsx` — update hero `alt` to match the final scene.
- `mem://design/trainer-imagery` — add the embroidery realism stack (tint, displacement, inner-shadow + rim-highlight, multiply blend, stitch noise) as the locked recipe so this can't regress.

## Out of scope

- No layout, copy, section-order changes on /about.
- No other images on the page.
- Page stays LOCKED per `mem://design/locked-about`.
