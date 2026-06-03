## Swap text wordmark for SVG logos in header & footer

Replace the text "REPs" wordmark in the public header (desktop + mobile drawer) and the "REPs | The Register of Exercise Professionals" text block in the public footer with the two uploaded SVG logos.

### Assets

Upload both SVGs to Lovable Assets (CDN) and import the `.asset.json` pointers — keeps SVGs out of the repo and avoids inlining ~64 lines of path data.

- `user-uploads://logo_white.svg` → `src/assets/logos/reps-wordmark-white.svg.asset.json` (used in header)
- `user-uploads://footer_logo.svg` → `src/assets/logos/reps-footer-lockup.svg.asset.json` (used in footer)

Native viewBox sizes:
- `logo_white.svg` — 83 × 22 (REPs wordmark only)
- `footer_logo.svg` — 221 × 30 (REPs + divider + "The Register of Exercise Professionals")

### Header changes — `src/components/public/PublicHeader.tsx`

1. Desktop logo (~line 197–201): replace the `<span>REPs</span>` with `<img src={repsWordmark.url} alt="REPs" className="h-7 w-auto" />` (height ≈ 28px to match current 30px text optical weight).
2. Mobile drawer logo (~line 836–840): same swap at `h-6` (~24px) to match the smaller drawer header.
3. Keep the surrounding `<Link to="/" aria-label="REPs home">` and flex layout untouched. Drop the now-unused `font-display`/`text-[30px]` span classes.

### Footer changes — `src/components/public/PublicFooter.tsx`

1. Replace the entire flex block at lines 57–66 (the "REPs" span + divider + "The Register of / Exercise Professionals" subtitle) with a single `<img src={repsFooterLockup.url} alt="REPs — The Register of Exercise Professionals" className="h-7 w-auto" />` (≈28px tall; native artwork is 30px so this preserves proportions).
2. Wrap it in the existing `<Link to="/" aria-label="REPs home">` pattern for consistency with the header (currently the footer wordmark isn't a link — we'll make it one since it's now a logo).
3. Leave the descriptive paragraph below (`"The global professional standard for fitness…"`) and the legal line at line 95 (`"© … REPs. The Register of Exercise Professionals."`) unchanged.

### Out of scope

- No changes to nav copy that mentions "REPs" as text (menu items, CTAs, body copy).
- No changes to the favicon, OG images, or any other surface.
- No changes to colors, spacing, or other header/footer layout.
- No new design tokens.
