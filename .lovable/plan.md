# Hero + CTA images — 10/10 pass (shipped 2026-06-11)

Both replaced with premium-tier editorial shots that match the `/about` brand campaign aesthetic.

## Shipped

- `src/assets/home-hero-coaching.jpg.asset.json` — Black male trainer, right-third of 16:9, warm golden-hour key from camera-right, REPS embroidery (ALL CAPS, white) clean on left chest, OOF warehouse interior with tungsten window glow, deep ink-black left two-thirds for headline copy. Subject's face clears the 88-column hero copy at all breakpoints (verified 1920, 820).
- `src/assets/cta-band.jpg.asset.json` — Female trainer, right-third of 16:9, single warm dusk key, charcoal polo with white REPS embroidery, OOF dusk training environment. Left half falls to near-black so the dark gradient overlay blends seamlessly.

## Code change

- `src/routes/index.tsx:492` — `object-position` swapped from `lg:object-center` (was cropping her face out of frame) to `object-[100%_20%] md:object-[100%_15%] lg:object-[100%_20%]` so her face stays fully visible across breakpoints.

No other code changes. Wrappers, gradients, copy, buttons, radius (24px hero) all unchanged.

## Verified

- Desktop 1920: hero face clears headline, CTA shows female trainer face full + golden rim light, copy fully legible.
- Tablet 820: hero portrait crop visible, REPS embroidery readable.
- Mobile crop (`aspect-[5/4]` with `object-[100%_20%]`): subject's face top-right of frame.
