# Homepage hero — new cinematic coaching shot

Bring the homepage hero up to the same bar as `/features/coaching`. Same grade, same REPS branding rules, same "trainer + client in a REPS gym" energy — but a **fresh composition** so the homepage and the Coaching pillar don't share an identical photo.

## 1. Generate `src/assets/home-hero-coaching.jpg`

Premium tier, **2400×1350** (16:9, sharper than the pillar heroes because the homepage crops aggressively on desktop and the image sits behind a full-width gradient wash).

Same cinematic grade as the pillar heroes: cool blue-grey shadows, warm tungsten/amber highlights, dusk light through gym windows, shallow DoF, 35mm f/2, Men's Health / GQ editorial quality.

**Subject — REPS trainer coaching a real client mid-set, in a REPS-branded boutique gym:**
- **Trainer:** Black female coach, early 30s, calm authority, mid-cue — one hand lightly on the client's mid-back, the other gesturing the bar path. Charcoal performance polo with **"REPS"** ALL CAPS white embroidered wordmark on the left chest (matches site header logo).
- **Client:** mixed-race / Latina woman, late 20s, mid-rep on a kettlebell goblet squat or trap-bar deadlift set-up — focused, working, not posing. Plain charcoal/heather training kit, no other brand marks.
- **Environment:** premium boutech gym floor — black rubber tiles, brushed steel rig, warm tungsten downlights, a large defocused **"REPS"** frosted-vinyl wall mark on the back wall (ALL CAPS, softly out of focus, reads as gym signage not a logo overlay). Faint warm orange spill from the rig lighting.

**Composition:** wide 16:9, subjects anchored **right of centre** with the trainer slightly forward of the client. Left third = quiet negative space (defocused gym depth, warm bokeh) so the homepage H1 / sub / CTAs sit cleanly over the left side at desktop. On mobile the image is hidden (the existing hero already drops to solid black under `lg`), so we only need to nail the desktop crop.

**Narrative cue:** "this is what a REPS session actually looks like" — coaching in progress, not a stock posed shot. No phones, no on-screen UI, no chart props.

Upload via `lovable-assets create` → write `src/assets/home-hero-coaching.jpg.asset.json`. Up to 2× regenerate if framing or **REPS** spelling drifts.

## 2. Wire it into `src/routes/index.tsx`

Surgical swap, no layout changes:

- Replace the import at line 29:
  - `import heroCoaching from "@/assets/hero-coaching-moment.jpg";`
  - →
  - `import heroCoaching from "@/assets/home-hero-coaching.jpg.asset.json";`
- Update the two `<img src={heroCoaching} … />` usages (lines 153 and 531) to `src={heroCoaching.url}`.
- Leave the existing transforms, gradients, vignette, and the secondary `opacity-30` band at line 531 untouched — those are tuned to the current crop and the new image is being shot to the same composition rules.

## 3. Delete the old asset

Once the new hero is in place and QA'd, remove `src/assets/hero-coaching-moment.jpg` from the repo. (It was a raw binary, not an asset pointer — safe to delete; nothing else references it.)

## 4. QA

Screenshot `/` at desktop:
- New hero visible behind the H1, copy column fully legible against the left wash.
- Trainer + client read as "coaching in progress", not stock posing.
- **"REPS"** ALL CAPS legible on the polo AND on the back wall.
- Trainer is a Black woman (continues the diversity rotation across the pillars: white male, white male, Black female (pillar), South-Asian male, Latina female — homepage repeats Black female intentionally as the "flagship" shot).
- Grade matches `/features/coaching` and the other pillar heroes.
- Mobile/tablet still drops to solid black hero — no regression.
- Secondary usage at line 531 (the band that uses the same image at 30% opacity) still reads correctly.

## Out of scope

- Any homepage copy, layout, CTA, or section changes below the hero.
- Pillar heroes (already done).
- Mobile hero treatment (intentionally stays solid black).

## Files touched

- `src/assets/home-hero-coaching.jpg.asset.json` — new
- `src/routes/index.tsx` — swap import + two `src` references
- `src/assets/hero-coaching-moment.jpg` — delete
