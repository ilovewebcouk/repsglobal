# Fix `/cpd` hero + lock white logo rule

## What's wrong with the current hero

1. **REPS wordmark on the T-shirt is orange.** Has to be white. Always. No exceptions.
2. **Subject (trainer studying) is on the left**, so he sits directly under the headline column and gets washed out by the left-anchored darken gradient. You can't actually read him.
3. **Background palette drifts warmer / muddier** than `/specialisms` (which is the gold standard — cool charcoal gym, clean rack, controlled orange rim light only from the top-left glow).

Hero copy, layout, gradients, and chrome are all good and stay locked. Only the **source image** changes.

## Plan

### 1. Update `mem://design/trainer-imagery` — lock white-only

Change the color rule from "white on dark, orange on light" to:

> Color: **white** wordmark, always. Never orange, never tonal, never on-brand-coloured. The garment colour can vary (charcoal, black, navy, heather grey, white) but the wordmark itself is always white. On a white/light garment use a subtle white embroidery / tonal white print so it still reads white, not orange.

Also add to mem://index.md Core: "Generated REPS wordmark on apparel is **always white** — never orange, regardless of garment colour."

### 2. Regenerate the hero image

Generate `src/assets/cpd-hero-v2.jpg` (premium tier, 1920×1088, matches existing aspect) with this brief:

- **Composition:** trainer/coach seated or leaning against a rack on the **right third** of the frame, reading an open textbook / making notes in a notebook. Left two-thirds is negative space — gym floor, rack, plates, dumbbell row, slight depth blur — so the headline column has room to breathe and the left-anchored darken gradient lands on environment, not on the subject.
- **Subject:** real-looking PT, charcoal/black technical polo, **small left-chest REPS wordmark in WHITE embroidery** (ALL CAPS, forward-reading, not mirrored). No other branding.
- **Palette:** match `/specialisms` hero — cool charcoal/graphite gym, matte black rack, clean steel plates, a single warm rim-light from the upper-left only. No warm orange wash across the whole scene, no sepia, no gym-bro yellow.
- **Lighting:** editorial / documentary, soft key from upper-left, controlled shadows, sharp on subject, gentle falloff into the room.
- **Mood:** quiet study, professional, "consultant reading their journals" — not action / not motivational poster.

Generate natively in that composition (do **not** flip a left-composed image, it mirrors the wordmark).

### 3. Wire up the new asset

- Upload via `lovable-assets create --file src/assets/cpd-hero-v2.jpg` → write `src/assets/cpd-hero-v2.jpg.asset.json`.
- In `src/routes/cpd.tsx`:
  - Swap the import to `cpd-hero-v2.jpg.asset.json` and read `.url` (mirrors how `/specialisms` does it via `heroSpecialismsAsset.url`).
  - Update `width`/`height` props if the new render differs.
  - Keep `object-[70%_center] lg:object-center` — that's correct now that the subject is on the right.
  - Update the preload `<link>` to the new URL.
- Delete the old `src/assets/cpd-hero-v1.jpg` (no longer referenced).

### 4. QA pass

- Screenshot `/cpd` at desktop (1440) and mobile (390) in the preview.
- Zoom the chest area to confirm the wordmark renders **WHITE**, ALL CAPS, forward.
- Compare side-by-side with `/specialisms` hero to confirm tonal/palette parity.
- Confirm headline + sub + 3 chips + Press marquee are all crisply readable over the left side.

If the wordmark comes back orange or mirrored, regenerate (don't post-edit — gen models drift when you ask them to "just change the colour").

## Out of scope

- Hero copy, gradients, chrome, sticky nav, all body sections — unchanged.
- Locking `/cpd` into `mem://design/locked-cpd` — comes after you sign off on this regen.
