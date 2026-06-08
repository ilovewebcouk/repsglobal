## Scope
Replace the "As featured in" press marquee on **`/cpd` only** with a new "Where you'll find our trainers" marquee using the 10 uploaded gym brand logos. Keep the existing PressMarquee (editorial wordmarks) everywhere else — it's part of the locked marketing-hero template.

## Changes

### 1. Upload the 10 gym SVGs as CDN assets
Run `lovable-assets create` for each of: anytime_fitness, david_lloyd, energie_fitness, everyone_active, fitness_first, nuffield_health, puregym, the_gym_group, third_space, virgin_active. Write pointers to `src/assets/venues/<name>.svg.asset.json`.

### 2. New component `src/components/marketing/VenueMarquee.tsx`
- Same structure, bg, padding, mask fade, scroll animation, reduced-motion behaviour and height scaling (`h-6 sm:h-7 lg:h-8`) as `PressMarquee`.
- Eyebrow label text: **"Where you'll find our trainers"** (same `text-[10.5px] font-semibold uppercase tracking-[0.32em] text-white/45`).
- Logos rendered as `<img src={asset.url}>` with `filter: brightness(0) invert(1)` + `opacity-55` so the coloured brand SVGs render as the same white/55 silhouettes the press marks use. Each logo carries an `alt` attribute (gym name).
- Per-logo `widthClass` (e.g. `w-24`, `w-32`) tuned so visual heights/weights look balanced across the 10 marks, mirroring the press treatment.

### 3. Swap on `/cpd`
In `src/routes/cpd.tsx`:
- Replace `import { PressMarquee } from "@/components/marketing/PressMarquee";` with `VenueMarquee`.
- Replace `<PressMarquee />` (line 464) with `<VenueMarquee />`.

## Out of scope
- No change to the shared `PressMarquee` component or any other page that uses it.
- No layout, copy, animation-timing or section-position changes — only the eyebrow text + the logo set swap, as requested.
- The two stale runtime ENOENT errors (`puregym.svg`, `the_times.svg`) reference legacy file-system paths unrelated to this work; not touched here.
