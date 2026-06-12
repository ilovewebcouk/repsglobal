# Fix AI avatar regeneration — match the directory demo look

## Problem

`regenerateAvatar` (`src/lib/profile/avatar-ai.functions.ts`) prompts Gemini for a "clean studio headshot, neutral charcoal background, plain T-shirt or polo with embroidered REPS wordmark on the chest." Output is exactly that: a flat school-portrait against a grey sweep, wearing a fake REPS tee.

Target look = `src/assets/pro-james.jpg`, `pro-sophie.jpg`, `pro-daniel.jpg`, `pro-laura.jpg` (the demo pros on `/find-a-professional`, `/in/$location`, `/c/$slug`): square, head-and-shoulders, face square to camera, soft directional key + subtle rim, **heavily blurred dark gym/training-floor backdrop**, muted film palette, subject in their own training kit.

## Fix (prompt rewrite only, one file)

Rewrite the prompt string inside `regenerateAvatar.handler` so it asks for the demo-pro aesthetic:

1. **Identity lock** — keep same face, age, ethnicity, gender presentation, hair, skin tone, build. Do not restyle the person.
2. **Framing** — square, tight head-and-shoulders, subject facing camera straight on, calm confident expression, eyes to lens.
3. **Lighting** — soft directional key on the face + subtle rim light; cinematic, editorial, photoreal. No flat studio softbox, no ring-light look, no yearbook lighting.
4. **Background** — **dark, heavily blurred gym/training-floor scene** (racks, plates, turf, brick, low-key tones), shallow depth of field, creamy bokeh. Explicitly negative: "no neutral grey sweep, no charcoal studio backdrop, no plain wall."
5. **Clothing** — **keep the subject's own clothing from the source photo**. Do not add a REPS T-shirt, polo, jersey, or any branded garment. Negatives: "no logos, no wordmarks, no text on clothing, no embroidered REPS lettering, no added branding."
6. **Negatives against current failure mode** — "no school-portrait, no yearbook, no flat backdrop, no studio sweep, no 1990s portrait lighting, no added branded clothing."

No other code changes. `validateAvatar`, `processAvatar`, `commitAvatar`, the storage bucket, signed-URL TTL, and the dashboard UI all stay as-is. Stay on `google/gemini-3.1-flash-image-preview`.

## Scope note re: trainer-imagery memory

The `mem://design/trainer-imagery` rule ("any generated trainer image must carry a stitched REPS wordmark") was written for marketing assets generated into `src/assets/`. It conflicts with this avatar fix. I will treat **user-uploaded avatar regeneration as a separate surface** that does not carry the wordmark, and tighten the memory to scope the wordmark rule to marketing assets only. The marketing rule stays unchanged.

## Out of scope

- Re-running AI against existing avatars already in the DB.
- Switching image model.
- Validation / crop / commit pipeline.
- Any marketing image in `src/assets/`.

## Files touched

- `src/lib/profile/avatar-ai.functions.ts` — `regenerateAvatar` prompt string only.
- `.lovable/mem/design/trainer-imagery.md` — add one line scoping the wordmark rule to marketing assets; avatars exempt.

## Verification

On `/dashboard/profile`, upload a clear photo and hit "Regenerate with AI". Confirm output is square, face-on, dark blurred gym backdrop, subject in their own clothing, no REPS tee. Compare side-by-side with `src/assets/pro-james.jpg` for vibe match.