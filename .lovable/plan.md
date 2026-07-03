## Problem
The "AI draft" buttons on Tagline and About currently fire blind — the model has no context about the trainer's style, niche, or clients, so drafts are generic.

## Fix: Add a lightweight prompt dialog before drafting

When the user clicks **AI draft**, open a small shadcn `Dialog` that asks 1–2 quick questions. Answers get passed into the existing `aiDraftTagline` / `aiDraftAbout` server functions as extra context, then the returned text populates the field (user can still edit).

### Tagline dialog
One field only — keep it fast:
- **"Who do you help and how?"** (Textarea, 1–2 lines, placeholder: *"Busy professionals in Manchester get lean and strong in 3 sessions a week — at home or online."*)

Optional chips above the textarea for quick-fill: `Fat loss`, `Strength`, `Postnatal`, `Over 50s`, `Athletes`, `Rehab` (multi-select, appended as context).

### About dialog
Two fields:
- **"Who do you help and how?"** (Textarea — same as above, prefilled from tagline answer if given)
- **"What makes your coaching different?"** (Textarea, 1–2 lines, placeholder: *"20 years in the game, ex-Team GB S&C, no fluff, results tracked weekly."*)
- Tone chips (single-select): `Warm`, `Direct`, `Professional`, `Playful` — default `Warm`.

### Server function changes
Extend `aiDraftTagline` and `aiDraftAbout` in `src/lib/shop-front/website-content.functions.ts`:
- Add optional `context: { audience?: string; differentiator?: string; specialisms?: string[]; tone?: string }` to the input validator.
- Inject that context into the Gemini prompt. Keep the existing deterministic fallback if context is empty (so backfill / silent calls still work).

### UI wiring
In `src/routes/_authenticated/_professional/dashboard_.website.tsx`:
- Replace the direct `onClick` handler on each **AI draft** button with `setDialogOpen(true)`.
- Add `<TaglineDraftDialog />` and `<AboutDraftDialog />` components (co-located in the same file or `src/components/dashboard/website/`).
- On dialog submit: call the server fn with the context, show inline loading state inside the dialog, insert result into the form field, close the dialog. Toast on error.
- Remember the last answers in component state so re-opening the dialog is faster; do not persist to DB.

### Backfill script
No change — the one-off backfill keeps calling the functions with no context and uses the deterministic fallback path.

## Files touched
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — add dialogs, rewire buttons
- `src/lib/shop-front/website-content.functions.ts` — accept optional context, thread into prompt
- (optional) `src/components/dashboard/website/AiDraftDialogs.tsx` — extract dialogs if the route file gets long

No schema, no migrations, no changes to `/c/$slug`.
