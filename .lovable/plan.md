# Avatar regeneration — preserve real background, editorial retouch

## Why

Mode B (invent a dark-bokeh gym scene) was the wrong call. Two problems:

1. **Face quality regressed.** The model spent its attention budget inventing an environment instead of locking the face. The earlier grey-seamless version gave a better likeness because the prompt was simpler.
2. **Homogenisation.** Every avatar coming back as "dark gym bokeh" makes the directory look AI-generated and erases the trainer's personal context.

The right approach: keep the user's actual background from their original photo, but treat it the way a high-end retoucher would — re-light, re-grade, clean up, push subject/background separation, add depth. The model is already running in image-edit mode (`gemini-3-pro-image-preview` with the source image attached), so it has the original pixels to anchor to. We just need to stop telling it to invent a scene.

## What changes

**Prompt-only change** in `src/lib/profile/avatar-ai.functions.ts` (`EDITORIAL_PROMPT_BASE`, lines ~306–349). No pipeline, no models, no UI wiring changes.

### Rewrite the Background section to:

- **Preserve the source background.** Same location, same elements, same general composition. Do NOT invent a new scene, do NOT replace the environment, do NOT relocate the subject.
- **Heavy editorial retouch (per user's choice).** Treat the existing background as raw input for a top-tier retoucher:
  - Deepen shadows, lift mids on the subject only, regrade for a cohesive cinematic palette.
  - Push depth of field — strong but believable defocus on the background, subject razor-sharp.
  - Add atmospheric separation (subtle haze, falloff, rim light) so the subject lifts off the plate.
  - Clean distractions: remove visible third-party logos/text, stray people in the deep background, blown highlights, lens flare, clutter.
  - Match light direction and colour temperature to whatever the source already has — don't override it.
- **Fallback clause** for unusable source backgrounds (selfie against a blank wall, tight crop with no environment, white room, blown-out window): replace with a clean, neutral dark gradient backdrop (deep charcoal → near-black, soft vignette). No invented gym scene, no bokeh fakery — honest, consistent fallback. Model decides per-image whether the source background is usable.

### Keep unchanged

- Identity lock section (face preservation rules).
- Clothing section (keep their garment, no logos).
- Lighting / Framing / Expression / Output quality sections.
- Identity scoring gate (`scoreIdentity`) — still runs.
- Modal copy in `dashboard_.profile.tsx`: update the one-line subhead to match the new behaviour ("editorial retouch of your photo — same person, same place, properly shot").

## Out of scope

- Per-tier background modes (Verified vs Pro). Single pipeline for everyone.
- New UI controls (background picker, before/after toggle).
- Model swap or pipeline rewiring.
- Touching the validation prompt or commit flow.

## Risk

Low. Prompt-only change inside an already-working pipeline. Worst case: a specific source photo regrades oddly and the user re-runs. The fallback gradient clause handles the previous failure mode (no usable background) without inventing a scene.
