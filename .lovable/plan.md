# Fix CPD hero framing on tablet & mobile

## Problem

The `/cpd` hero is a 10/10 on desktop (≥1024px): both subjects sit in the right third, headline reads cleanly on dark amber space at the left.

Below `lg`, the same image is cropped with `object-[75%_center]` and is letting the dark left-of-frame fill the viewport while the two subjects sit off-canvas to the right. Net result:
- **Tablet (768px):** only background rig + a sliver of the assessor's arm visible — no faces, no REPS wordmarks.
- **Mobile (390px):** essentially zero subject visible; just orange glow on equipment.

Headline + CTA layer fine, but the hero stops *being* a hero — it reads as a flat gradient panel.

## Fix (presentation-only, no image regen)

Single file: `src/routes/cpd.tsx`, `Hero()` component (around line 502–528).

1. **Reframe the image per breakpoint** on the `<img>` (line 513):
   - Mobile (default): `object-[78%_38%]` — pulls the two subjects into frame, biased slightly up so faces land in the upper portion above the headline.
   - Small / tablet (`sm:` and `md:`): `sm:object-[72%_42%] md:object-[68%_45%]` — progressively eases back toward centre as width grows so we keep both subjects framed.
   - Desktop unchanged: `lg:object-center`.
   - Also raise the mobile hero min-height so the subjects have room to breathe above the copy stack: add `min-h-[640px] sm:min-h-[680px]` to the `<section>` (currently only `lg:min-h-[680px]`).

2. **Rebalance the dark overlay for narrow widths** (lines 515 + 518):
   - Mobile/tablet currently uses `bg-reps-ink/55` plus a radial centred at `30% 45%` — that darkens the *subjects* on small screens. Switch the small-breakpoint scrim to a vertical gradient that darkens the **bottom half** (where the copy now sits) instead of the centre:
     - Base scrim: `bg-gradient-to-b from-reps-ink/30 via-reps-ink/55 to-reps-ink/80 lg:bg-reps-ink/35 lg:bg-none` (keep current desktop behaviour).
     - Remove the central radial below `lg` (wrap the current radial in `hidden lg:block` so it only applies on desktop).
   - Keep the warm top-left orange glow as-is — it's working at every width.

3. **Verify** by re-screenshotting at 390 / 768 / 1024 / 1440. Acceptance:
   - Both subjects visible at every breakpoint with at least one REPS wordmark legible.
   - Headline + body copy keep AA contrast on the new bottom-weighted scrim.
   - No layout shift or content reflow elsewhere on the page.

No image regeneration, no asset swap, no copy changes. Hero v5 stays the source image.
