## Goal
Replace the "REPs" wordmark in the public header with a true vector SVG built from Inter ExtraBold (weight 800), matching the Illustrator artwork: 28 pt size, 42 pt line-height, 25 tracking. Header only for now — footer / auth / other wordmarks stay on the current Inter Tight bold treatment until a follow-up pass.

## Approach

1. **Generate the outlined SVG locally**, not by hand.
   - Use `fonttools` (`pyftsubset` + a small Python script with `fontTools.pens.svgPathPen`) against the actual Inter ExtraBold TTF (downloaded once from rsms/inter or Google Fonts) so the glyphs `R`, `E`, `P`, `s` are mathematically identical to the Illustrator output.
   - Bake Illustrator's metrics into the SVG `viewBox`:
     - Letter advance widths from the font's `hmtx` table at 28 pt.
     - Tracking 25 → +25/1000 em = +0.7 pt extra advance after every glyph except the last.
     - Line-height 42 pt only affects vertical box; for a single-line wordmark it just sets the SVG height so the visual baseline sits where Illustrator placed it.
   - Output a single optimised path-based SVG (`currentColor` fill, no embedded font), saved as `src/assets/brand/reps-wordmark.svg`.

2. **Create a `<RepsWordmark />` component** at `src/components/brand/RepsWordmark.tsx` that imports the SVG as a React component (via `?react` or inline JSX) and accepts `className` so colour comes from Tailwind (`text-white` in the dark header). Default render uses `currentColor` and scales by height — width is derived from the viewBox so the Illustrator proportions are preserved at any size.

3. **Swap the two header instances** in `src/components/public/PublicHeader.tsx`:
   - Desktop header logo around line 197–201 — replace the `<span class="font-display …">REPs</span>` with `<RepsWordmark className="h-7 text-white" />` (height chosen to visually match the current 30 px cap height; will fine-tune after first render).
   - Mobile sheet header logo around line 836–839 — same swap, slightly smaller (`h-6`).
   - Keep the `Link to="/"` wrapper, `aria-label="REPs home"`, and the divider/LocationPin layout untouched.

4. **Do NOT touch**: footer wordmark, auth shell wordmark, signup card wordmark, any in-body prose mentioning "REPs", the Google Fonts `<link>` (no need to load weight 800 since the SVG is outlined), or the `--font-display` token.

## QA
- Visually compare against the existing wordmark at 1318 px viewport (current preview) and at the mobile breakpoint, confirming cap height, weight, and spacing read as the Illustrator version.
- Confirm the SVG inherits `text-white` (and would flip with `text-reps-charcoal` on a light surface) so future light-header use is free.
- Confirm no new font weight requests appear in the network tab.

## Out of scope (next pass)
Footer wordmark, AuthShell wordmark, and any other `REPs` chrome — will be swapped to `<RepsWordmark />` once you've signed off on the header rendering.