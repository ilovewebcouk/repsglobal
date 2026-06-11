## Goal

Replace the homepage hero image with a world-class editorial portrait that makes the REPs hero read as a register of trusted professionals, not a fitness marketplace. **Layout, gradient stops, animations and copy stay exactly as they are** (per locked homepage memory). Image only.

## What changes

1. **Generate one new hero image** at premium tier and swap `src/assets/home-hero-coaching.jpg.asset.json` for the new asset.
2. **Keep everything else in `src/routes/index.tsx` hero block untouched** — including the `object-[88%_30%] lg:object-[78%_30%]` crop, the two-stop dark wash, the H1/lede/form/trust chips, and animation delays.

That's the entire scope.

## The image brief

**Direction:** Single editorial portrait of one verified REPs personal trainer.

**Subject**
- Personal trainer, mid-30s, calm authority. Real working coach, not a fitness model or bodybuilder.
- Direct eye contact with camera. Subtle, settled expression — not smiling, not stern.
- 3/4 body framing, turned slightly off-axis so the gaze meets the lens.

**Wardrobe (locked brand rule)**
- Charcoal or black short-sleeve technical polo or T-shirt.
- **REPS** wordmark, ALL CAPS, **white**, embroidered small on the left chest. Looks like real embroidery, not an overlay.

**Lighting + background**
- Deep charcoal seamless background (~`#0E0E10`) so it composites onto `bg-reps-black` cleanly.
- Single key light camera-right + a low-intensity warm rim, no fill. Sculpted, editorial — *Monocle / FT Weekend Magazine*, not Men's Health.
- Subtle film grain. Zero HDR look. No lens flares, no glow.

**Composition for the locked crop**
- The locked CSS crops to `object-[88%_30%]` desktop and `[78%_30%]` large-desktop, so the subject must sit in the **right third** of the frame with their head around 30% from the top.
- The **left two-thirds must be quiet, mostly negative space** (background only) — that's where the dark wash and H1 + lede + search form land.
- No props, no equipment in frame.

**Output**
- 1920×1200 JPG (16:10), generated via `imagegen --model premium`.
- No overlay graphics, no verified card baked into the image (per the user's pick — overlay-free, let the photo carry it).
- Save to `/tmp/hero-coaching-v2.jpg`, then upload via `lovable-assets` and write to `src/assets/home-hero-coaching.jpg.asset.json` (overwrite, same import path → zero code change needed beyond the pointer file).

## Production steps

1. Generate the image with `imagegen` at `premium` quality, prompt built from the brief above, written to `src/assets/home-hero-coaching-v2.jpg`.
2. **QA pass:** open the generated image and check (a) REPS wordmark reads ALL CAPS, white, left-chest, looks embroidered; (b) subject is in the right third; (c) left two-thirds is quiet enough for copy; (d) background tone is dark enough to composite onto `bg-reps-black`. If any check fails, regenerate with a tightened prompt before continuing.
3. Upload via `lovable-assets create --file ... --filename home-hero-coaching.jpg` and overwrite `src/assets/home-hero-coaching.jpg.asset.json`. Delete the temp JPG.
4. **Verify in preview:** load `/` at desktop and large-desktop widths, confirm the subject lands in the right third and the H1/lede/form remain perfectly readable on the left. If the crop fights the new image, the *only* allowed change is the `object-position` percentages on lines 143 — adjust those, leave gradient and everything else untouched. (This is a Phase 1-acceptable nudge; gradient stops stay locked.)

## Out of scope

- No changes to H1, lede, form, trust chips, animation delays, or any other section of the homepage.
- No new components, no new images elsewhere on the page.
- No real photoshoot — flagged separately later if you want to upgrade beyond AI.
- No overlay/verified card on the image itself (you picked option 3).

## Technical notes

- `imagegen --model premium` is required because the REPS wordmark must render as legible embroidered text — `fast` and `standard` tiers produce garbled letterforms on garments.
- The asset is consumed by an existing `<img src={heroCoaching.url}>` so overwriting the `.asset.json` pointer is enough — no route file edits, no build changes.
- Locked homepage memory permits asset swaps; only structural changes are forbidden. This change is a like-for-like image replacement.
