# /specialisms hero — visibility & composition fix

The hero copy works. The photo doesn't. Two issues:

1. **Overlay stack is too dense.** Base `bg-reps-ink/70` on mobile + `/55` on lg, plus a centered radial darkener at 72% opacity, plus a 56px floor-seal. The image (`hero-gym-bg.jpg`, already a low-light dumbbell rack) gets crushed to near-black.
2. **Right half is empty.** Unlike `/` (featured pro) and `/for-professionals` (HeroDeviceCluster), the right column has nothing — so the muted image has to carry the whole frame on its own and just looks like dark grey.

## Fix (visuals only — no copy or section changes)

### A. Let the image breathe
- Replace the centred radial "darken-everything" gradient with a **left-anchored** darken (`radial-gradient(60% 80% at 18% 50%, rgba(10,10,12,0.78), transparent 70%)`) so the copy column stays legible but the right two-thirds of the photo are visible.
- Drop the base wash from `/70 → /45` on mobile and `/55 → /35` on lg. Add a subtle left-to-right gradient (`from-reps-ink/75 via-reps-ink/35 to-reps-ink/15`) to keep contrast under the headline without flattening the photo.
- Soften the floor-seal from `h-32 → h-24` (mobile) / `h-56 → h-40` (lg) and ease the via-stop opacity so it fades into the PressMarquee instead of cutting hard.
- Keep brand-orange top glow as-is; it's working.

### B. Give the right side a hero device
Add a **specialism cluster card** anchored to the right column on `lg+` (hidden on mobile, where the existing single-column hero is already good):

- A `lg:grid-cols-[1fr_1.05fr]` two-column hero (matching `/for-professionals`).
- Right column = a stacked composition of 3 floating "specialism preview" cards (rounded-[18px], `bg-reps-panel`, `border-reps-border`):
  - Card 1 (back/top): "Strength Coach · UKSCA ASCC · Verified" with rate row.
  - Card 2 (mid, offset down/left, slight rotate): "Nutritionist · RNutr (AfN) · Verified" with rate row.
  - Card 3 (front, offset further, slight counter-rotate): "Yoga Teacher · YAP 500hr · Verified" with rate row.
- Each card uses the existing `BadgeCheck` + orange-soft accent + `Tooltip`-style acronym treatment we already use further down the page — so the hero is a **preview of what the page proves**.
- Soft `--brand-orange` radial glow behind the cluster (matching the for-pros mobile glow under PhoneFrame).

### C. Hero height + anchoring
- Keep top-anchored copy per `marketing-hero-template` (`lg:pt-24`). No change.
- Bump hero min-height on lg so the right-side cluster has room: `lg:min-h-[640px]`.

### D. Image position
- Change `object-center` → `object-[70%_center]` so the brighter right portion of the gym shot (windows / barbell rack) sits behind the new card cluster, and the darker left portion sits behind the copy column. That's the asset's natural strong side.

## Out of scope
- No new asset upload — sticking with `hero-gym-bg.jpg`. If the user wants a richer hero photo later (e.g. a coach mid-coaching shot with REPS wordmark on shirt) we'd do that as a separate pass.
- No copy changes, no section reordering, no nav changes.
- All other locked sections untouched.

## Acceptance
- Photo is clearly visible behind both halves of the hero, not just a dark blur.
- Copy column passes contrast (headline + sub + chips legible).
- Right-side cluster mirrors the `/for-professionals` hero balance — no more empty right column.
- Mobile hero unchanged (single-column, no cluster, no horizontal overflow).
- Audit still passes (no new banned hex/radii; cards use 18px).
