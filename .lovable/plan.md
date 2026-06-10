# Regen `/about` hero — coach mid-cue + pixel-perfect logo composite

Two distinct failures from the last attempt, fixed two distinct ways.

## Fix 1 — the scene (image-gen)

Same photographer, same lookbook, same hour as Independence / Heritage / Professionals. **No more doorway.** Move inside.

**Scene:** Inside a converted warehouse gym at dawn. Single male coach, early 30s, lean athletic build, plain charcoal heather grey premium performance crew-neck tee (blank chest — no logo in this pass). He's standing centre-frame, **mid-coaching cue**: feet planted, hands shaping the air in front of him as if showing a hip-hinge or a brace, mouth slightly open mid-word, eyes off-camera following an unseen athlete to camera-left. Quiet authority. Sleeves of the tee rolled fractionally; forearms slightly veined from work. Faint chalk dust on one hand.

**Setting:** Cavernous warehouse interior — exposed red brick back wall, raw galvanised steel column, polished concrete floor with a single chalk mark. Empty negative space behind him. No barbell, no rack, no rig, no second person. The room reads "training floor" through architecture alone, not through equipment.

**Light:** One single hard golden window-key from camera-left at ~20°, raking across his forearms, jaw, collarbone, the front of the tee, and a strip of the brick wall behind him. Shadow side of him near-black. Visible volumetric beam with floating dust motes only inside the beam. Everything outside the beam falls into deep architectural shadow.

**Finish:** Muted film palette, deep blacks, warm amber only on the rim and the floor patch the beam hits, cool desaturated charcoal everywhere else. Soft 35mm anamorphic grain, shallow DoF, creamy bokeh on the brick. Photorealistic — a still from a documentary film, A24 × Lululemon.

**Composition:** Wide 16:9, subject centre-right third, wide negative-space upper-left for the headline. Camera at chest height, slight low angle, 85mm prime feel.

**Hard rejects (regen if any apply):** any second person, smiling, facing camera, posing, any barbell/rack/plates/dumbbells/kettlebell, any text in frame, any doorway, any city skyline, any tablet/phone, even/diffuse light, lifted shadows, 3D-render look, stock-fitness pose, the subject standing passively with arms at sides (he must be mid-gesture).

## Fix 2 — the logo (deterministic, not AI)

The image model **cannot** reproduce exact letterforms — it always approximates. The only way to get the actual `src/assets/brand/logo.svg` on the tee is to composite it in post with Python/Pillow.

**Pipeline:**
1. Generate base photo with a **completely blank** charcoal tee — no logo of any kind on the chest. (Image-gen models occasionally hallucinate a faint mark anyway; that's fine, the composite covers it.)
2. Rasterize `src/assets/brand/logo.svg` to a high-res white-on-transparent PNG with `rsvg-convert` (target 3× the final on-tee size, so we can downsample crisply).
3. **PIL composite step** (`/tmp/compose-logo.py`):
   - Open the base photo.
   - Manually identify the small-left-chest target rectangle in pixel coords (eyeball + zoom-verify after a test run).
   - Paste the rasterized logo onto the target region with:
     - **Opacity ~85%** so the tee weave shows through (looks like actual embroidery, not a sticker).
     - **Multiply blend with a subtle radial gradient** that picks up the camera-left rim light: brighter on the left edge of the wordmark (where the light hits), darker on the right.
     - **Slight gaussian blur (0.6 px)** to match the photo's grain/focus rather than reading as a vector sticker.
     - **Light displacement** along the fabric fold direction (sub-pixel; a simple x-shear of ≤2px across the patch width based on tee shading).
   - Save to `/tmp/about-hero-v12.jpg` at JPEG q92.
4. Zoom-inspect with `image_tools--zoom_image` at 4× on the chest. Letterforms must be byte-identical to `logo.svg`. Reject + adjust composite params if not.

This guarantees the exact REPs logo letterforms — same R counter, curved S, custom E and P proportions — pixel-for-pixel from the brand SVG.

## Execution order

1. `imagegen--generate_image` (premium tier, 1792×1024) → `/tmp/about-hero-v12-base.jpg`. Full mid-cue scene prompt above, **blank chest mandatory**.
2. Zoom-inspect base for: hard rim light, near-black shadow side, mid-cue gesture, no clutter, no second person, no equipment. Reject + regen if any reject criterion fires.
3. `rsvg-convert --width 1200 src/assets/brand/logo.svg -o /tmp/reps-logo-white.png`.
4. Write `/tmp/compose-logo.py` (PIL pipeline above). Run it.
5. Zoom-verify final chest at 4× — letterforms identical to `logo.svg`.
6. `lovable-assets create --file /tmp/about-hero-v12.jpg --filename about-hero.jpg` → overwrite `src/assets/about/about-hero.jpg.asset.json`.
7. Update `alt` on `src/routes/about.tsx` line 135 to: *"A REPs-registered coach mid-cue inside a sunlit warehouse training floor."*
8. QA on `/about`: hero must read as the fourth frame from the same shoot as Independence + Heritage + Professionals AND clearly communicate "this person is a fitness professional at work".

## Memory updates after delivery

- Update `mem://design/trainer-imagery` to add a rule: **"REPS wordmark on garments must be deterministically composited from `src/assets/brand/logo.svg` via PIL in post — never generated from a text prompt or composited by the image model. Image models cannot reproduce exact letterforms."**

## Out of scope

- No `/about` layout, copy, section-order, or other image changes.
- Heritage, Independence, Professionals images stay as-is.
- Page remains LOCKED per `mem://design/locked-about`.
