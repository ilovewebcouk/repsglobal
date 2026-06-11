# CTA image — bring to /about quality (10/10 pass)

The current `cta-band.jpg` clashes with the brand aesthetic established on `/about` and the homepage hero. Replace it with a single image built to the same visual grammar.

## The /about reference (the bar to hit)

- Near-black background, deep ink shadows.
- Single subject — either a face crop or an anonymous body crop (torso, arm, shoulder). Never a busy scene.
- Strong warm rim light from one side, golden-hour or "studio dusk" tone.
- Heavy negative space on one side — built deliberately so copy can sit on top.
- REPS wordmark: small, clean white, left-chest or upper-shoulder, real print/embroidery feel. Never a logo plate.
- Zero props. No phones. No chalkboards. No plates. No text inside the image.
- Painterly, cinematic, editorial — looks like a brand campaign, not stock photography.

The current CTA fails all of these.

## What's also wrong structurally

The CTA section in `src/routes/index.tsx` (lines 487–541) lays the image on the right and floods the left with a `linear-gradient(to right, #0B0D10 0% → transparent 50%)`. That means:

- Only the right ~50% of the image is ever seen on desktop.
- The subject must live in the **right third**, looking left (toward the copy).
- The left half of the image will be overlaid by ink — so it should *already* fall to near-black there, so the gradient doesn't look like a bolted-on tarp.
- On mobile the crop flips to `aspect-[5/4]` with `object-[100%_center]` — so the subject must still survive when only the right half is shown.

No code changes needed to the section — the wrapper, gradient, copy, buttons, radius (24px hero) are all correct and locked. Only the image swaps.

## New image brief — "Coach at dusk"

- **Subject:** Single male personal trainer, mid-30s, framed from mid-chest up, **on the right third** of a 16:9 frame, body angled slightly left, gaze off-camera to the left (toward where the copy will sit). Calm, focused, owner-of-his-work expression — not smiling, not hyped.
- **Wardrobe:** Charcoal/black fitted athletic polo. Small white embroidered **REPS** wordmark, ALL CAPS, left chest, real flat embroidery — same execution as `/about/about-professionals.jpg` and `/about/about-independence.jpg`.
- **Light:** Single warm key light from the right at golden hour / studio dusk. Strong rim on cheekbone, shoulder, polo edge. Background falls to deep ink on the left two-thirds.
- **Background:** Out-of-focus dark space. A *suggestion* of a training environment (soft hint of a rig silhouette, a column of warm window light far back) — never legible, never busy. No text, no chalkboard, no plates, no phone, no second person.
- **Lens / mood:** 50–85mm portrait look, shallow DoF, fine film grain, editorial. Matches the cinematic painterly tone of `about-hero.jpg`.
- **Composition for the slot:** Left 50% of the frame is already deep near-black so the dark gradient overlay extends the mood naturally instead of masking detail. Subject's torso + REPS wordmark sit safely inside the right-half safe zone so the mobile `object-[100%_center]` crop still reads.

## Files to change

- `src/assets/cta-band.jpg.asset.json` — regenerate via `imagegen` (16:9, premium tier for the embroidery + warm-skin tones), re-upload through `lovable-assets`, overwrite the pointer in place.
- No code changes. `src/routes/index.tsx` (line 31) and `src/lib/resources.ts` (line 1) already import the `.asset.json`, so the new URL flows through automatically.

## Verification

1. Take a desktop screenshot of `/` and zoom into the CTA band — confirm: face/torso lives on the right, dark gradient on the left blends seamlessly, copy is fully legible, no chalkboard or phone visible.
2. Take a mobile screenshot (`aspect-[5/4]`) and confirm the subject + REPS wordmark survive the `object-[100%_center]` crop.
3. Cross-compare side-by-side with the `/about` hero and `about-professionals.jpg` — the CTA image should feel like a sibling shot from the same campaign, not a different photographer.
4. If embroidery reads as "REPs" lowercase, or any chalkboard/prop sneaks back in, regenerate once with a tightened negative-prompt before declaring done.
