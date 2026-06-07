# /specialisms hero — make it actually 10/10

## What's wrong now (honest)

1. **Recycled image** — `hero-gym-bg.jpg` is already the bg on `/` and `/for-professionals`. Flagship pages don't share heroes.
2. **Image doesn't match the page promise** — a dim dumbbell rack says "strength gym," not "every specialism."
3. **The 3 SpecimenCards are weak.** They look like SaaS feature tiles, not editorial proof. They compete with the photo, add noise, and lower the page's premium read. They go.

## Fix — one cinematic custom photo, no chrome

The hero becomes a single full-bleed wide gym hall image with multiple disciplines visible in one frame, copy column anchored left, **no cards, no right-column device.** The photo is the device.

### 1. Generate the hero image (custom)

- **Aspect:** 21:9 (wide cinematic).
- **Composition:** Premium high-ceiling training space, late-afternoon light.
  - **Foreground (left third, in focus):** head coach in a REPS-branded polo (ALL CAPS "REPS" wordmark embroidered on left chest, per `mem://design/trainer-imagery`), mid-instruction, hand guiding a client's kettlebell goblet squat.
  - **Mid-ground (centre, soft focus):** second coach with a client on a barbell setup at a power rack.
  - **Background (right third, deeper bokeh):** visible Pilates reformer, rolled yoga mats stacked on an oak shelf, soft daylight from tall windows.
- **Lighting:** warm tungsten key from one direction, deep shadow falloff right-to-left, a faint brand-orange ambient bounce from off-camera. Cinematic, filmic grain. Never stock-bright.
- **Style:** editorial fitness photography — think Form Athletica / Equinox campaign / Whoop annual report — NOT gym stock site.
- **Saved to:** `src/assets/specialisms-hero.jpg` via `imagegen` (premium tier for human-figure quality), then externalised via `lovable-assets` because it's a large hero binary.
- **LCP wiring:** preload + `fetchpriority="high"` + `loading="eager"` (matches `marketing-hero-template`).

### 2. Restructure the hero section

- **Remove entirely:** the `lg:grid-cols-[1fr_1.05fr]` split, the right-column container, the orange glow div, all 3 `SpecimenCard` instances, and the `SpecimenCard` component itself (dead code).
- **Layout:** revert to single-column copy stack, max-width ~720px, anchored top-left per `mem://design/hero-anchoring` (`lg:pt-24`).
- **Hero height:** `lg:min-h-[680px]` so the wide photo has room to breathe.
- **Image position:** `object-cover object-center` on lg, `object-[35%_center]` on mobile so the coach stays in frame when cropped.

### 3. One editorial gesture (not cards) to convey breadth

Above the eyebrow chip OR just under the trust chips — a single tracked-out typographic strip:

> `PT · STRENGTH · ONLINE · NUTRITION · YOGA · PILATES — ALL VERIFIED`

- `text-[11px] tracking-[0.22em] uppercase font-semibold text-white/55`
- Bullets in `text-reps-orange/70`
- One line, no wrap on lg, scrolls horizontally on mobile (no overflow on container).

That single line replaces three cards. Editorial, premium, doesn't compete with the photo.

### 4. Overlay stack (lighter, photo-first)

- Base wash: `bg-reps-ink/35` (lg) / `/50` (mobile).
- Left-anchored darken behind copy: `radial-gradient(55% 80% at 22% 50%, rgba(10,10,12,0.78), transparent 72%)`.
- Soft horizontal gradient: `from-reps-ink/75 via-reps-ink/20 to-transparent` (lg only).
- Orange top glow + bottom floor seal: keep as currently tuned.

### 5. Keep as-is
- Eyebrow chip, headline, sub, CTA pair, 3 trust chips (with stagger timings).
- All locked sections below the hero.

## Out of scope
- No section reordering, no nav changes, no copy rewrites beyond the new specialism strip.
- Mobile composition simplifies naturally (single column already).
- Card removal is the only structural cut; everything else just gets a better photo and lighter overlays.

## Files touched
- `src/routes/specialisms.tsx` (Hero function + delete `SpecimenCard`)
- `src/assets/specialisms-hero.jpg(.asset.json)` (new)
- Lock memory `mem://design/locked-specialisms` updated to reflect the new hero composition.

## Acceptance
- New, unique custom photo. Multiple disciplines visibly present in one frame. REPS wordmark visible on the foreground coach's polo.
- Zero cards in the hero.
- Copy column legible, photo clearly readable across the full width.
- Audit passes (no banned hex/radii, no button shadows).
- Looks at-or-above Whoop / Form / Future hero quality on a side-by-side.
