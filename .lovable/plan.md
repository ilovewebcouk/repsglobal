# Roll back to "studio retouch" AI portrait

## Goal
Stop trying to make every user look like a REPs marketing model. Make their existing photo look like a competent photographer took it — same person, same clothes, same hair, better lighting and background.

## Scope
Single file: `src/lib/profile/avatar-ai.functions.ts`. No UI changes. No memory rule changes (the REPS-wordmark rule already only applies to project-owned marketing assets, not user uploads).

## Changes

### 1. Kill the two-pass chain
Replace with a single `gemini-3-pro-image-preview` call. Faster, cheaper, less identity drift, and easier to reason about when a user complains.

### 2. New prompt recipe (identity-first, not vibe-first)
Hard locks:
- **Identity**: exact same face, age, skin texture, wrinkles, facial hair, hair colour, hair length, hair style, eye colour, expression. Do not de-age. Do not restyle hair. Do not slim or reshape the face.
- **Wardrobe**: keep the subject's original garment, original colour, original logos/branding intact (North Face fleece stays a North Face fleece; coral top stays coral). Do not recolour to black. Do not swap garment type.
- **Background**: replace with a soft neutral studio gradient — deep charcoal falling to warm grey, very subtle vignette. No gym. No rack silhouettes. No cage lights. No orange wash.
- **Lighting**: soft large key from camera-left ~45°, gentle fill, subtle hair light. Natural skin tones. No heavy orange rim. No split/Rembrandt drama.
- **Crop**: square 1:1, head-and-shoulders, eyeline ~38% from top, ~12% headroom.

Negative prompt: no industrial gym, no warehouse, no orange rim light, no wardrobe change, no age change, no hair restyle, no logos/text added, no beauty-retouch plastic skin.

### 3. "Try again" varies backdrop tone only
Five locked backdrop variants (identity + wardrobe + lighting stay constant):
1. Deep charcoal → warm grey gradient (default)
2. Cool slate → soft graphite
3. Warm taupe → deep brown
4. Neutral mid-grey seamless
5. Soft black with subtle radial falloff

No lighting register variants. No environment variants. The whole point is consistency-across-users on lighting + production value, variety within each user's "Try again" only on backdrop temperature.

### 4. Remove all REPs-vibe references from the prompt
Drop every mention of "industrial", "warm orange rim", "rack silhouette", "cage light", "dark technical fabric", "deep charcoal/black recolour", "match pro-james.jpg". This was the wrong benchmark.

## What stays the same
- Dialog UI ("Choose your photo", side-by-side, Keep / Try again / Use AI version)
- Avatar upload pipeline, storage, cropping
- Avatar corner-radius work from earlier in this loop
- The `mem://design/trainer-imagery` rule for project-owned marketing assets (pro-*.jpg, hero composites) — unchanged

## Verify
1. Regenerate the two sample uploads (the North Face man, the coral-top woman).
2. Confirm: wardrobe preserved, age preserved, hair preserved, background is neutral studio (not industrial gym), no orange wash.
3. Confirm a third upload with a brightly-coloured top also keeps its colour.
4. Only mark done when all three pass.

## Technical details
- File: `src/lib/profile/avatar-ai.functions.ts`
- Model: `google/gemini-3-pro-image-preview` (single call, not chained)
- Inputs: source data URL + new prompt + variant index
- Output shape unchanged (same `{ rawArr, mime }` contract to the caller)
- No new dependencies, no new env vars, no schema changes