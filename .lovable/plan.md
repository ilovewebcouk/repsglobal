## Goal

Swap the plain-text "As featured in" row on `/home-v2` for real publication logos (Men's Health, Women's Fitness, Runner's World, BBC Sport, The Times, GQ), rendered in a uniform greyscale style that matches the rest of the page.

## Approach

1. **Source official SVG wordmarks** for each of the six publications (preferring SVG over PNG so they stay crisp and we can recolor via CSS).
   - Men's Health (Hearst)
   - Women's Fitness (DHP)
   - Runner's World (Hearst)
   - BBC Sport (BBC)
   - The Times (News UK)
   - GQ (Condé Nast)

2. **Upload them as Lovable Assets** (one `lovable-assets create` per SVG) so they're CDN-hosted and don't bloat the repo. Each gets a `src/assets/press/<slug>.svg.asset.json` pointer file.

3. **Refactor the PRESS array** in `src/routes/home-v2.tsx` from `string[]` to `{ name, src, height }[]`. Per-logo height lets us optically balance heavy wordmarks (The Times, GQ) against tall ones (BBC Sport, Runner's World) — they should all read at roughly the same visual weight.

4. **Update the render** in the press strip section (~lines 261–277):
   - Replace the `<span>` text with `<img>` (with proper `alt` for accessibility/SEO).
   - Apply a uniform greyscale + reduced-opacity treatment that lifts to full on hover: `opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0` — keeps the strip subtle and visually consistent across very different brand styles.
   - Maintain current flex-wrap layout, spacing (`gap-x-10 gap-y-3`), and the "As featured in" eyebrow.

5. **Responsive check**: ensure logos wrap cleanly at narrow viewports (the strip already uses `flex-wrap`).

## Technical notes

- Files touched:
  - `src/routes/home-v2.tsx` — array shape + JSX in the press strip only. No other sections touched.
  - `src/assets/press/*.svg.asset.json` — 6 new pointer files.
- No new dependencies, no token changes, no layout/section changes elsewhere on the page.
- Greyscale treatment is applied via Tailwind utilities, not by editing the SVGs, so we can switch to full-color later with a one-line change if you prefer.

## Out of scope

- Linking each logo to an actual press article (can add `<a href>` wrappers in a follow-up once you have URLs).
- Changing the section copy ("As featured in") or position on the page.
- Touching other pages that may also reference press logos (e.g. `/press` route in the footer).
