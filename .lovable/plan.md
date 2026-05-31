## Problem

Two issues with the current hero:
1. **Skin tone shifted** — re-running `imagegen--edit_image` on a photo of real people warped her complexion. Every AI re-edit will keep doing this; the only safe path is to stop touching the figures and composite them as a layer.
2. **Trainers too small / too low** — in the locked mockup they fill the hero vertically (head near the top of the section, body extending down past the search bar). Current asset has them centered mid-frame and small.

## Fix — layer the cutout instead of baking it into the photo

Two-layer hero background:

**Layer A — gym backdrop only (no people).** Generate `src/assets/hero-gym-bg.jpg` (21:9) with the same dark cinematic squat rack / kettlebells / rubber flooring environment, but empty. This becomes the full-bleed `<img>` behind the headline.

**Layer B — trainers cutout (user-uploaded PNG).** Save the attached transparent PNG to `src/assets/hero-trainers-cutout.png`. Render as a separate `<img>` absolutely positioned inside the hero's background container, anchored to the **bottom-right** with their head clearing the top of the hero section — matching the mockup's vertical fill.

## Layout details

In `src/routes/index.tsx`, the `<div className="absolute inset-0 -z-10">` block becomes:

```
<img src={gymBg} class="absolute inset-0 h-full w-full object-cover" />     // empty gym
<div class="absolute inset-0 ... gradient overlays" />                       // existing gradients
<img src={trainersCutout}                                                    // NEW layer, on top of gradient
     class="absolute bottom-0 right-[6%] hidden h-[110%] w-auto select-none lg:block"
     style={{ objectPosition: 'bottom right' }} />
```

Key positioning:
- `h-[110%]` so the figures fill the hero vertically (head reaches the top band where header/badges sit, feet anchored at bottom — matches mockup proportions)
- `right-[6%]` puts them between the headline column and the Why REPs card, slightly off the right edge so the card overlaps the male trainer's shoulder/arm the way it does in the mockup
- `hidden lg:block` — only on desktop. Mobile still uses the gym backdrop alone, which already reads cleanly.

## Gradient tuning

Because the trainers now sit **on top of** the gradient (not under it), the gradient only ever darkens the gym backdrop. I'll simplify the desktop ramp back to a clean left-weighted ink with no center-clear gymnastics:

```
linear-gradient(to right, #0B0D10 0%, rgba(11,13,16,0.9) 25%, rgba(11,13,16,0.55) 40%, rgba(11,13,16,0.15) 60%, rgba(11,13,16,0) 75%)
```

Trainers' true skin tones are preserved because nothing covers them.

## Steps

1. Copy `user-uploads://image-2.png` → `src/assets/hero-trainers-cutout.png`
2. Generate empty gym backdrop → `src/assets/hero-gym-bg.jpg` (21:9, same lighting/dressing, no people)
3. Edit `src/routes/index.tsx` hero background block: swap to two-layer structure, add cutout `<img>`, retune desktop gradient stops
4. Update import (`heroImg` → `gymBg` + new `trainersCutout`)

## Out of scope

No copy, layout grid, Why REPs card, search panel, or token changes. Mobile/tablet gradients untouched.
