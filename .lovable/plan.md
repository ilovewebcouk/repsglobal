# New CTA image — "Coach + client, post-session"

Replace the current `cta-band` image used in the bottom "For professionals" CTA on `/` (and referenced from `src/lib/resources.ts`).

## Composition (final pick)

- **Scene:** Wide environmental two-shot inside the coach's own studio, late morning after a 1:1 session has just finished.
- **Coach:** Mid-30s, REPs polo (charcoal or deep slate — NOT same as hero), white embroidered REPS wordmark small left-chest, ALL CAPS, real embroidery look. Mid-conversation, relaxed, half-smile, weight on back foot.
- **Client:** Mostly silhouetted from behind / over-shoulder — gym kit, towel over shoulder, no face visible. Falls slightly out of focus.
- **Light:** Soft daylight from a large window left-of-frame. Left third of the image is naturally brighter / airier — deliberate contrast vs the all-charcoal hero. Warm highlights on the coach's shoulder and the client's back.
- **In hand:** Coach holds phone low between them, screen catching a sliver of light. Faint, half-readable REPs booking confirmation visible ("Booked · Thu 7:30am" style) — implied, not hero'd.
- **Lens / framing:** ~35mm equivalent, shallow DoF on the coach, client and background fall off. Subject sits in the right two-thirds so the bright window side reads first; the slot crop survives because the coach's torso + face is centred in the safe zone.
- **Background:** Honest small studio — rig, plates, a chalkboard with session notes, plant. Lived-in, not staged showroom. No logos other than REPS on the polo.
- **Mood:** Quiet, professional, "the work is done, the relationship is real." Not hype, not lonely.

## Why this is the 10/10 vs the current 6/10

1. Different scene grammar from the hero (two people, daylight) — page stops feeling like one photoshoot stretched twice.
2. Shows the outcome a pro actually wants — a paying client in the room — which is what the CTA bullets promise.
3. Survives the narrow crop: coach's face + REPS chest mark sit dead-centre; phone is inside the safe zone; window light gives the left edge something to look at even when cropped.
4. White REPS wordmark renders as crisp embroidery, not a mushy emboss.
5. No IP risk — client is silhouetted from behind.

## Files to change

- `src/assets/cta-band.jpg.asset.json` — regenerated via `imagegen` (16:9, premium tier for embroidery legibility), re-uploaded through `lovable-assets`, pointer overwritten in place.
- No code changes. `src/routes/index.tsx` and `src/lib/resources.ts` already import the `.asset.json` pointer, so the new URL flows through automatically.

## Verification

1. Take a fresh preview screenshot of the `/` CTA band.
2. Zoom into the coach's chest to confirm "REPS" reads correctly in ALL CAPS white.
3. Confirm the phone + booking detail are visible in the rendered slot (not cropped off).
4. If the embroidery or crop fails, regenerate once with a tightened prompt before declaring done.
