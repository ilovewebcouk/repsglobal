## Goal
Replace the footer's lockup (REPs wordmark + vertical divider + two-line descriptor) with a single combined outlined-path SVG. No font dependency, single colour-controllable element via `currentColor` so it can sit on any background.

## Output
A new `<RepsLockup />` component at `src/components/brand/RepsLockup.tsx` rendering one inline `<svg>` containing:
- The existing Inter ExtraBold "REPs" outlines (reuse the four `<path>`s from `RepsWordmark`).
- A 1-px vertical divider line (drawn as a `<line>`, opacity ~0.15 to match the current `white/15`).
- "The Register of" / "Exercise Professionals" set in Inter Regular weight 400, both lines converted to outlined paths, opacity ~0.6 to match `white/60`.

All elements use `fill="currentColor"` (and the divider `stroke="currentColor"` + low opacity), so a single `text-white` class on the SVG tints the whole lockup.

## How the SVG is generated
Same toolchain as the wordmark:
1. Download Inter Regular TTF from Google Fonts CDN to `/tmp/`.
2. Python script (`/tmp/make_lockup.py`) using `fontTools`:
   - Reuse the wordmark glyph extraction (R, E, P, s at Inter ExtraBold, UPEM 2048, +25/1000 tracking).
   - Extract glyph paths for "The Register of" and "Exercise Professionals" at Inter Regular, default tracking, set to match the existing 11 px line at the 28 px wordmark cap height — so the descriptor x-height visually mirrors today's footer.
   - Compose into one viewBox: wordmark on the left, 12-unit gap, vertical divider, 12-unit gap, two descriptor lines stacked with leading matching today's `leading-tight`.
   - Vertically centre the divider + descriptor block on the wordmark's cap height.
3. Save outlined SVG to `src/assets/brand/reps-lockup.svg` (kept for reference) AND inline the resulting `viewBox` + paths into `RepsLockup.tsx` so `currentColor` works without an SVG loader.

## Footer swap
Edit `src/components/public/PublicFooter.tsx` lines ~30–41:
- Replace the entire `<div className="flex items-center gap-3">…</div>` containing the `<span>REPs</span>` and the descriptor `<span>` with `<RepsLockup className="h-7 text-white" />` (height chosen to roughly match the current ~28 px wordmark; will fine-tune after first render).
- Leave the paragraph beneath ("The global professional standard for fitness…") untouched.

## Out of scope
- AuthShell wordmark, signup card wordmark, and any other REPs chrome — still on Inter Tight, untouched until you ask.
- Header lockup — already swapped in the previous turn, not re-touched.

## QA
- View the rendered SVG against the current footer at 1318 px and at mobile width; confirm wordmark cap height, divider opacity, descriptor weight and line spacing read like the current footer (only the wordmark itself should look heavier — that's the ExtraBold upgrade).
- Confirm no new font weight requests in the network tab (descriptor is outlined, so Inter 400 is not newly loaded for this purpose).
- Confirm the lockup tints correctly when `text-white` is swapped for `text-reps-charcoal`, so it's reusable on light surfaces later.