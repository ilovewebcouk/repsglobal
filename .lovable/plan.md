## Plan: Cinematic client photos for homepage Outcomes

Replace the three trainer-style portraits in the "Outcomes" section on `/` with cinematic, editorial photos of the **clients** referenced in each testimonial. Keep all copy unchanged.

### Photo briefs

1. **Mark, 38 — "Down 12kg in 6 months"**
   Lean, post-transformation everyday man (late 30s, British, short hair) photographed mid-morning in a clean modern gym in fitted t-shirt and joggers, hands on hips, catching breath after a session. Soft directional window light, shallow depth of field, warm filmic grade. Confident but not posed — looks like a real client, not a model.

2. **Priya, 34 — "Back to running pain-free" (post-natal)**
   British-South-Asian woman, mid-30s, in running kit on a quiet UK park path at golden hour, mid-stride or paused with hands on knees smiling. Soft sun flare, blurred autumn trees behind, editorial running-magazine feel. Strong but warm — post-natal return-to-fitness energy.

3. **Tom, 29 — "Deadlift PB +40kg"**
   Late-20s British man, athletic build, chalked hands, setting up over a loaded barbell in a dim strength gym. Low-key dramatic lighting, rim light catching shoulders, focused expression looking down at the bar. Editorial strength-training feel — gritty, cinematic, not gym-bro.

### Execution

- Generate three 1024×1280 (4:5 portrait) images with `imagegen--generate_image` model `standard`, saved to `src/assets/outcomes/`:
  - `outcome-mark.jpg`
  - `outcome-priya.jpg`
  - `outcome-tom.jpg`
- These are **clients**, not REPS professionals — **no REPS wordmark** on clothing (the wordmark rule applies only to trainer/coach imagery).
- Wire into `src/routes/index.tsx` Outcomes section, replacing the current three image sources. Keep all text, badges, names, and "with [Trainer]" lines untouched.
- Keep existing card layout, radius, orange tag pill, and typography exactly as locked.

### Out of scope
- No copy changes.
- No layout / card-component changes.
- No changes to other sections.
