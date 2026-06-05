## Decision recap

- **Mobile**: tight on the pair, rack ignored, pair dead-centered.
- **Tablet (md)**: re-pick `object-position` to suit the new pair-centered comp, and audit contrast on every element overlaid on the image.

## Mobile + sm fix

In `src/routes/index.tsx` (line 489), change the image classes so the displayed crop scales the trainers larger and centres them.

The source image (1584×672) has the pair spanning source-x 730–1535 with the centroid at ~73%. To centre the pair and crop the rack out, I need the pair to fill more of the frame — so a slightly taller aspect (5:4 instead of 4:3) plus `object-[100%_center]`. Math:

- 5:4 mobile (frame 358×286): image scales to 0.426, scaled width 675, excess 317. Pair centroid lands at display ~50%. Visible source 735–1575 — pair fits perfectly, rack (ends ≈740) drops out of frame.

## Tablet (md) fix

At `md+` the image becomes an absolutely-positioned full-bleed background (`md:absolute md:inset-0`). Card is ~720×~500 px. The current `md:object-[60%_top]` is left-biased — pair drifts off-centre. Switch to **`md:object-[100%_top]`** so the pair is near-centred horizontally and anchored to the top, clearing the bottom-fade gradient where the text sits.

## Desktop (lg) — unchanged

At `lg`, container is ~1240 wide and the image scales to fit horizontally with negligible excess. `lg:object-center` already shows the full composition with the left-to-right ink fade. No change.

## Final class string

```
aspect-[5/4] w-full object-cover object-[100%_center]
  sm:object-[100%_center]
  md:aspect-auto md:h-full md:object-[100%_top]
  lg:object-center
```

(`sm` listed for clarity even though it's a no-op vs mobile; can be dropped.)

## Tablet contrast audit

Vertical gradient currently in `src/routes/index.tsx` line 492:

```
linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(11,13,16,0.45) 60%, #0B0D10 88%)
```

At md the text block (chip + H2 + body + 4 bullets + 2 buttons) renders inside the card on top of this gradient. I'll:

1. Measure roughly where each element sits vertically relative to the 360–500px card height to know the gradient opacity at that y.
2. Sample the underlying image colour in that band (dark grey gym / mid-grey skin tones / dark T-shirt).
3. Compute WCAG AA contrast against the foreground for:
   - `FOR PROFESSIONALS` chip (orange on dark)
   - `Are you a fitness professional?` H2 (white)
   - body copy (white/70)
   - 4 bulleted lines (white)
   - primary CTA orange button (white text on orange)
   - `See plans` ghost button (white border + white text)
4. If anything fails AA, tighten the gradient: push the 0.45 stop up to ~0.65 and start the fade earlier (e.g. transparent 20% → 0.55 at 45% → 0.85 at 70% → ink at 90%). Will only change values, not the technique.

## Verification

After edit:
- Re-screenshot at 390 px in the lovable mobile preview to confirm pair is dead-centred and the rack is gone.
- Read the rendered card structure to lock the gradient stop math for tablet contrast.
- (lovable preview iframe is locked to the user's chosen device, so for tablet/desktop I'll reason from code + source image + computed contrast rather than promise pixel screenshots I can't reliably capture.)

Single file touched: `src/routes/index.tsx`.
