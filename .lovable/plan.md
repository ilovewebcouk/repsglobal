## Goal
Replace the current `For Professionals` CTA image on `/` with a single, 10/10 editorial image that speaks to the *operator* (coach as business owner), so it's visually distinct from the hero portrait and reinforces the four CTA bullets (profile, bookings, CRM, CPD).

## Concept — "Coach in command"
- Single verified REPs personal trainer, mid-30s, in their own working environment (small private studio corner or daylit gym; soft warm fill + cool background, charcoal-to-amber palette).
- 3/4 body framing, subject anchored **right of centre** so the left third stays quiet for the dark wash + copy.
- Calm, in-control body language. Not posed, not mid-rep — the working pro between sessions.
- Phone in hand, screen tilted just enough to read a single REPs booking notification line ("New booking · Tue 7:30am · Sarah K.") in REPs UI styling — small, legible, not a full screenshot. This is the operator cue.
- **REPS wordmark** embroidered white (ALL CAPS) on left chest of a charcoal polo, per `mem://design/trainer-imagery`.
- 35–50mm lens feel, shallow depth of field, film grain, no HDR, no lens flare.

## Asset production
- Generate at premium tier (legible wordmark + legible phone-screen microtext is the hard part).
- 1920×1200 JPG (16:10) to match current slot aspect.
- Save to `/tmp/cta-coach-in-command.jpg`, upload via `lovable-assets create --file ... --filename cta-band.jpg`, overwrite `src/assets/cta-band.jpg.asset.json` pointer.
- Keep import name `ctaTrainers` and the existing `<img>` markup intact.

## QA bar (must pass before declaring done)
1. REPS wordmark: ALL CAPS, white, embroidered look, readable on left chest.
2. Phone screen: REPs notification line is legible (or at minimum convincingly REPs-branded) — not garbled glyphs.
3. Subject sits in right third; left third is quiet enough for the existing dark wash to carry the copy at md and lg.
4. No second person, no gym clutter dominating the frame, no logos other than REPs.

## Code touch
- Only file edited: `src/assets/cta-band.jpg.asset.json` (pointer rewrite).
- No JSX, layout, gradient, copy, or component changes. The locked homepage rule stays intact.
- If the new crop fights the existing `object-position` (`object-[100%_center] md:object-[100%_top] lg:object-center` on line 491), I will adjust **only those percentages** to re-anchor the subject — gradient stops and section structure stay locked.

## Out of scope
- No changes to H1, bullets, buttons, or the surrounding section.
- No changes to the hero image or any other page asset.
- No new components, no animation changes.
- No real photo shoot — this is the AI-generated launch asset, same posture as the hero pick.

## Verification
- Load `/` at 1464px and at desktop large, confirm subject in right third, copy readable, wordmark visible, phone notification legible.
- Spot-check md (~900px) so the vertical gradient still hides the bottom of the image cleanly.
