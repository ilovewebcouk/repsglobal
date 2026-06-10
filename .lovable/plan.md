# Replace 2 of 4 images on `/about`

Keeping (unchanged): `about-professionals.jpg`, `about-independence.jpg`.
Replacing: `about-hero.jpg` (full-bleed 16:9 hero) and `about-heritage.jpg` (4:5 portrait beside "Heritage in the name").

## Source-of-truth references (locked memory)
- `mem://design/trainer-imagery` — wordmark spec
- `mem://design/locked-about` — page is cinematic, brand-pillar, REPS-wordmark compliant
- Canonical wordmark SVG: `src/assets/brand/logo.svg` (white, ALL CAPS "REPS")

## Workflow (per image)
1. Rasterise `src/assets/brand/logo.svg` → temp PNG.
2. `imagegen--generate_image` (model: `premium`) with the brief below to a temp jpg.
3. `imagegen--edit_image` — pass `[generated.jpg, logo.png]`, instruct the model to print the white REPS wordmark on the trainer's garment as real embroidery/print (correct geometry, ALL CAPS, white) at the correct chest position.
4. QA the chest wordmark via `image_tools--zoom_image`. If wrong shape/colour/case, redo step 3.
5. `lovable-assets create --file …` → overwrite the existing `.asset.json` pointer. Delete old CDN asset via `assets--delete_asset` after the new pointer is in place. No code changes — filenames stay identical so `about.tsx` imports keep working.

## Image 1 — HERO (replaces `about-hero.jpg`)
**Role:** full-bleed background under left-side copy ("The professional platform for the modern fitness industry"). Copy + dark `HeroOverlay copySide="left"` sits on the left third, so the **focal subject must live in the right 55-60% of the frame** with breathing room and depth on the left for the wash to read.

**Brief:**
- Aspect 16:9, 1920×1080, cinematic editorial photography, shot on medium-format, shallow but not blurred depth of field.
- Setting: a premium modern training space at golden hour — exposed brick + matte-black rig in the background, soft volumetric light raking in from a tall warehouse window on the right.
- Subject: a confident, in-his-prime male coach (mid-30s, athletic, short hair, neutral expression — purposeful, not smiling at camera) mid-cue beside a female client performing a controlled trap-bar deadlift. Both in focus, both clearly skilled. No gym-bro clichés, no over-flexed posing.
- Wardrobe: coach in a charcoal short-sleeve technical polo with a **small left-chest white "REPS" wordmark** (real embroidery, ALL CAPS, matches `src/assets/brand/logo.svg` exactly). Client in clean black training kit (no logo required).
- Colour: warm amber key + cool steel ambient, deep blacks, controlled highlights. Leaves the left ~40% as a softer mid-tone area suitable for dark overlay + white type.
- Mood: serious craft, mentorship, calm intensity. Reads "industry standard," not "Instagram fitness."
- Forbidden: stock-photo grin, neon gym lighting, motivational poster vibes, blurry motion, watermark anywhere, multiple logos.

## Image 2 — HERITAGE (replaces `about-heritage.jpg`)
**Role:** 4:5 portrait card in the "Heritage in the name. Modern in everything else." 50/50 section. Should feel like a documentary moment — coach + client in conversation, not training.

**Brief:**
- Aspect 4:5 (1024×1280 or similar), editorial documentary photography, natural window light.
- Setting: clean studio/consultation corner of the same warehouse gym — exposed brick or warm-grey panelled wall, a single rubber plant or framed certificate softly out of focus behind them. Not a desk-and-laptop trope.
- Subject: a female REPs-registered coach (early 30s, professional, hair tied back) seated at a 3/4 angle in calm conversation with a female client. Coach gesturing mid-explanation with an open hand; client listening, slight forward lean. Both faces visible, both engaged.
- Wardrobe: coach in a clean white short-sleeve technical tee with **small left-chest white "REPS" wordmark** (real print, ALL CAPS, matches the SVG). Client in a soft heather-grey tee.
- Colour: warm neutral palette (camel, off-white, charcoal) with a single quiet amber highlight — visually adjacent to the orange radial glow already behind the card.
- Mood: trust, professionalism, listening. Reads "consultation," not "sales pitch."
- Forbidden: clipboards, stethoscope/clinical vibe, fake laughter, branded water bottles, any wordmark colour other than white.

## QA checklist before pointer swap
- Wordmark reads as **"REPS"** (ALL CAPS), white, correctly positioned, real fabric integration — not an overlay.
- Hero: subject sits right-of-centre; left third is dark/soft enough that white H1 + lede over `HeroOverlay` will be fully legible.
- Heritage: 4:5 crop, faces unclipped, warm palette compatible with the orange radial glow behind the card.
- No country/UK signage, no banned brand marks, no visible third-party logos.

## Out of scope
- No copy changes, no layout changes, no other images touched, no memory updates (existing memory already covers the rules).
