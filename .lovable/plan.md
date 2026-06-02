## Goal
Replace the empty black mobile hero with a cinematic portrait-oriented training photo + layered scrim, matching the approved "Cinematic vignette" direction. Desktop hero stays untouched.

## What's already done
- Generated `src/assets/hero-coaching-mobile.jpg` — moody portrait of a trainer with rim lighting, lower third naturally falls to black so the search card sits clean over it.

## Changes to `src/routes/index.tsx`

1. **Import the new asset** (line 28):
   ```ts
   import heroCoachingMobile from "@/assets/hero-coaching-mobile.jpg";
   ```

2. **Restructure the hero background block (lines 162–188)** so mobile and desktop each get their own dedicated image + scrim, instead of a single desktop-cropped image with a mobile gradient bolted on:

   - **Mobile (`< lg`):** render `<img src={heroCoachingMobile}>` full-bleed, `object-cover object-center`, then layer the v2 three-stop scrim:
     - `bg-gradient-to-b from-reps-black/80 via-reps-black/40 to-reps-black opacity-90`
     - bottom-half `bg-gradient-to-t from-reps-black via-transparent to-transparent`
     - flat `bg-black/20` mood layer
   - **Desktop (`lg+`):** keep the existing `heroCoaching` image, parallax, right-side fade, and bottom dissolve exactly as they are — wrap them in a `hidden lg:block` container.

3. **Parallax ref:** keep the existing `heroImgRef` bound to the *desktop* image only. The mobile image stays static (matches the prototype; no parallax surprises on iOS).

4. **No changes** to: headline, body copy, search form, goal chips, social proof row, header, footer, or any below-hero section.

## Verification
- Take mobile screenshot at 390×844 — confirm: photo visible behind headline, headline white and crisp, search card legible, orange CTA punchy, no banding at the card's top edge.
- Take desktop screenshot at 1366×768 — confirm pixel-identical to current desktop hero (parallax still works, right-side trainer cluster still visible).
- Verify no horizontal scroll on mobile.

## Out of scope
Header chrome, search behavior, copy, tag pill set, trust line, any other section. This is hero background only.
