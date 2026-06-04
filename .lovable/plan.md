## What's wrong

The marquee's `overflow-hidden` + mask gradient currently spans the full viewport, so the fade-to-ink sits at the screen edges. You want the fade to line up with the inner content column (the same width the headline / Act 1 cards use), so the logos fade in/out where the section's content begins and ends — not at the page edges.

## Change

In `src/components/marketing/PressMarquee.tsx`:

1. Keep the `<section>` full-bleed (`bg-reps-ink` continues edge-to-edge so it blends with hero + Act 1).
2. Wrap the masked track in a centred container matching the rest of the page (`mx-auto max-w-7xl px-6 lg:px-8` — same width tokens used by the hero/Act 1 above and below).
3. Move `overflow-hidden` + the `mask-image` gradient onto that container so the fade endpoints align with the container's left/right edges.
4. Tighten the gradient stops (e.g. `black 6%, black 94%`) so the fade reads as a soft edge on the container, not a huge bleed.

The eyebrow ("As featured in") stays where it is; only the scrolling track gets constrained.

## Out of scope

No changes to animation speed, logo list, typography, section padding, or hero/Act 1.