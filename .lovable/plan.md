## Goal
Replace the current composited hero image with a single world-class "coaching moment" shot that fits the dark gym aesthetic and the existing design system, without touching any other hero element.

## Steps

### 1. Generate the image
- Tool: `imagegen--generate_image`, standard quality, 1920×1080.
- Save to `src/assets/hero-coaching-moment.jpg`.
- Brief: cinematic editorial gym photo, single certified trainer mid-coaching (spotting a barbell back squat), client soft-blurred in foreground, shallow depth-of-field, warm tungsten key + cool teal rim, polished concrete, matte black power rack, atmospheric haze, deep blacks (#0B0D10) with warm amber highlights, negative space on the left third for the headline.

### 2. Swap the import in `src/routes/index.tsx`
- Replace `heroComposite` import + usage with `heroCoaching` from the new file.
- Keep both gradient overlays, the bottom fade, the Why REPs card, the headline, sub-copy, CTA, search panel, and `object-cover` framing identical.

### 3. Verify and tune framing only
- Take a preview screenshot after the swap.
- Adjust only the `object-position` (`object-[x%_center]`) if the subject collides with the Why REPs card.

### 4. Keep old assets
Leave `hero-composite.jpg`, `hero-gym-bg.jpg`, `hero-trainers-cutout.png` in place for instant revert.

## Out of scope
Headline, sub-copy, CTA, Why REPs card, search panel, header, mobile layout, design tokens, any other section of the page.
