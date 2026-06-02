# Make home-v2 world-class

Targeted upgrades to close the remaining 20% gap, scoped to `src/routes/home-v2.tsx` and tokens already defined in `src/styles.css`.

## 1. Hero visual impact
- Generate a premium lifestyle hero image (PT coaching a client, cinematic, brand-aligned dark palette) via `imagegen` at `standard` quality, save to `src/assets/hero/home-v2-hero.jpg`, upload as Lovable Asset.
- Restructure hero from single-column centered to a **split layout** at `lg+`: left = headline + sub + search; right = hero image in an 18px-radius frame with a subtle orange glow (`--gradient-primary`, `--shadow-elegant`). Stack vertically on mobile/tablet (image above text).
- Keep current search component intact.

## 2. Sharper copy
- Replace functional headline with outcome-led copy:
  - H1: **"Find your perfect trainer in under 60 seconds."**
  - Sub: **"Every REP is verified, qualified and ready to help you train smarter — wherever you are in the UK."**
- Tighten H1 tracking (`tracking-tight`), bump size on `lg+` for typographic drama (clamp-based).

## 3. Trust layer — testimonial
- Add a **single hero testimonial pill** directly under the search (above press strip): avatar + 1-line quote + 5-star rating + name/location. Uses existing card radius (18px) and muted surface. Hardcoded for Phase 1 (static mock), labeled as a real-style quote.

## 4. Motion & delight
- Add subtle entrance animation: hero text fades+slides up, image fades in with slight scale, staggered ~80ms. Use Tailwind `animate-in` utilities already present (no new dependency).
- Press logo strip: convert to **auto-scrolling marquee** (CSS keyframe, pause on hover), so logos feel alive rather than static.
- Card hover lift on "Browse" tiles: subtle `translateY(-2px)` + shadow already in tokens.

## 5. Out of scope
- No new sections, no nav changes, no other routes touched, no backend, no copy changes outside hero.

## Files
- `src/routes/home-v2.tsx` — hero JSX restructure, copy, testimonial, marquee CSS class, motion classes.
- `src/styles.css` — add `@keyframes marquee` + `.animate-marquee` utility (one small block).
- `src/assets/hero/home-v2-hero.jpg(.asset.json)` — new hero image.

## Quality bar
After implementing, screenshot at 1318px and mobile (390px) to verify layout balance, image quality, copy hierarchy, and that the marquee + entrance animations render correctly.
