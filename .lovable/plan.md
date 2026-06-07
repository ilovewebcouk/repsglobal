## Objective
Regenerate the `/cpd` hero image so it visually belongs to the same series as `/specialisms`, `/for-professionals`, and homepage heroes — warm tones, orange ambient glow, sunlit/tanned subjects, premium editorial feel — instead of the current flat, cold, pale-skinned shot.

## Approach

1. **Generate a new hero** at 1536×1024 (`fast → standard` tier) with a prompt tuned to match the existing series:
   - Editorial wide shot inside a premium fitness/education environment (e.g. a sunlit private studio with a coach mid-flow with one client, or a senior coach reviewing a programme on a tablet with another trainer — i.e. on-brand for a CPD/education page).
   - Warm late-afternoon backlight, deep amber/orange rim light, soft golden haze, shallow depth of field.
   - Subjects: realistic, healthy, sun-kissed/tanned skin tones, athletic build, calm and competent expressions.
   - Visible **white "REPS"** wordmark on coach's t-shirt/polo (left-chest, embroidered look — per locked brand rule).
   - Cinematic colour grade: deep charcoal blacks, warm midtones, orange highlights — same palette as `/specialisms` hero.
   - No text, no UI overlays, no logos other than the REPS chest mark.
   - Save to `src/assets/cpd-hero-v3.jpg`, upload via `lovable-assets`, write `cpd-hero-v3.jpg.asset.json`.

2. **Swap the asset** in `src/routes/cpd.tsx`:
   - Change the import from `cpd-hero-v2.jpg.asset.json` → `cpd-hero-v3.jpg.asset.json`.
   - Leave all hero markup, overlays, gradients, and copy untouched.

3. **Delete the old v2 asset** (`cpd-hero-v2.jpg.asset.json`) once the swap is in place.

4. **QA**: screenshot `/cpd` and compare side-by-side against `/specialisms` to confirm the warm/orange tonal match. If it still reads cold or the subject looks pale, iterate the prompt once more (single re-gen) before declaring done.

## Out of scope
- No layout, overlay, gradient, or copy changes to the hero section.
- No changes to other pages.
- No new memory rule unless you want to lock this image afterwards.