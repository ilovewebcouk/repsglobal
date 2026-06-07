## Goal
Make the `/specialisms` hero genuinely world-class. The current image is composed backwards (REPS-polo coach + reformer on the right, generic shirtless kettlebell guy stealing the left third where the H1 lives). Fix it at the image level, not just with darker overlays.

## What changes

### 1. New hero image
Regenerate `src/assets/specialisms-hero.jpg` (21:9, 1920×832) via `imagegen` premium tier.

Brief:
- Cinematic wide of a premium training space, late afternoon, warm tungsten + soft window bounce, shallow filmic depth, subtle grain.
- **Left ~38%**: intentional dark negative space — shadowed brick / charcoal acoustic panelling / blacked-out steel. **No human, no equipment, no text** in this zone. This is where the headline lives.
- **Centre ~32%**: ONE coaching moment — female client mid-goblet-squat with a kettlebell, male coach beside her cueing, hand near her ribcage. Coach wears a charcoal polo with an embroidered **"REPS"** wordmark, ALL CAPS, small left-chest (matches the brand rule in `mem://design/trainer-imagery`).
- **Right ~30%**: visible Pilates reformer with leather straps, a rolled yoga mat on oak shelving, a small olive plant, soft window light behind. Reads as "other disciplines live here too" without competing with the centre.
- **No** shirtless model, no kettlebell-bro foreground, no gym selfie energy, no logos other than the REPS polo, no text overlay baked in.
- Mood reference: Whoop editorial / Form Athletica / Equinox brand campaigns. Premium, quiet, expert.

Save → upload via `lovable-assets` → overwrite `src/assets/specialisms-hero.jpg.asset.json` (existing asset_id gets replaced with a new one; that's fine).

### 2. Retune overlay and chrome on top
File: `src/routes/specialisms.tsx`, Hero function only.

- **Mobile** (`object-position`): `object-[60%_center]` (push the coaching moment into frame; left negative space matters less on narrow widths because copy stacks over a full wash).
- **Desktop**: `object-center`.
- **Overlay stack** (rebuilt left→right, not radial):
  1. Base wash: `bg-reps-ink/45 lg:bg-reps-ink/25`
  2. Left linear seal (lg only): `bg-gradient-to-r from-reps-ink/90 via-reps-ink/55 to-transparent`, covers ~58% width. This is the headline's backdrop.
  3. Bottom seal: keep current `from-reps-ink via-reps-ink/70 to-transparent` for the specialism strip.
  4. Top orange glow + footer floor seal: keep as-is.
- **Trust chips**: change wrap to `flex-nowrap lg:gap-x-5 gap-y-2` on lg so the three chips sit on one line; allow stacked wrap below lg. Drop one redundant word in chip #3 if needed to fit ("Reviewed publicly" instead of "Reviews on the public record").
- **Specialism strip**: move OFF the photo. Render as its own `<div>` flush below the hero photo block, full-bleed, `bg-reps-ink` solid, `h-11`, centred row, type stays the same tracking but bumps to `white/70` and orange/85 bullets so it's legible.

### 3. Out of scope
- No section re-order, no nav changes, no copy rewrites beyond the one chip tweak above.
- No new components. `SpecimenCard` stays deleted.
- No changes to the rest of `/specialisms` (sticky nav, 6 SpecialismSection blocks, RegistersBlock, VerifyStrip, FAQ).
- No memory change — `mem://design/locked-specialisms` already covers this page.

## Files touched
- `src/assets/specialisms-hero.jpg` (regenerated)
- `src/assets/specialisms-hero.jpg.asset.json` (re-uploaded via `lovable-assets`)
- `src/routes/specialisms.tsx` (Hero function only)

## Verify before declaring done
1. `browser--view_preview /specialisms` at 1440×900 → screenshot → confirm H1 sits on near-black, no face/skin tone behind it, REPS polo readable, reformer visible right.
2. `browser--view_preview /specialisms` at 390×844 → screenshot → confirm coaching moment is in frame, copy legible, chips stack cleanly, specialism bar reads.
3. Audit: no banned radii (`rounded-xl/2xl/3xl`, 20/28/32px) introduced; semantic tokens only.
