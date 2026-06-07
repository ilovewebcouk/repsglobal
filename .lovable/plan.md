## Diagnosis

`StickyNav` (`src/routes/specialisms.tsx:672`) sets `bg-reps-ink/85` with a dim `border-b border-reps-border/60`. Both the header above and the next `SpecialismSection` below are also dark, so the bar's bottom edge is invisible. The chip text IS vertically centred inside `h-14`, but because you can't see where the bar ends, the eye reads it as "text at top, empty padding below". The previous `h-12 → h-14` bump didn't solve this — the problem is contrast, not height.

## Fix

Single edit to `src/routes/specialisms.tsx:674–688` (`StickyNav`):

1. Drop the faux-translucent `bg-reps-ink/85` + `backdrop-blur` and use a solid, slightly elevated panel: `bg-reps-panel` so the bar reads as a distinct strip against both the header and the dark sections.
2. Replace the dim borders with a brighter hairline on both sides: `border-y border-white/10`.
3. Reduce height to `h-12` (the bar feels chunky at `h-14` once it has visible edges); keep `items-center` so chips stay centred.
4. Keep `top-14`, chip styling, `overflow-x-auto`, and `SPECIALISMS.map` unchanged. No copy or order changes.

## Full QA pass (scope of this turn)

After the fix, walk `/specialisms` top-to-bottom at 1484px in the browser:
- Hero anchoring + LCP image render
- Sticky nav transition from non-stuck → stuck (clear edges, centred chips, 7 chips fit without horizontal scroll)
- Each of the 7 `SpecialismSection` blocks: eyebrow numbering, QualCard tooltips on hover, CTA buttons
- `RegistersBlock`, `VerifyStrip`, FAQ accordion
- Console + network for runtime errors

Any additional defects I find get reported back in the final message (not silently patched) so we can scope a follow-up.

## Out of scope

No changes to section content, hero copy, FAQ, RegistersBlock, PROFESSIONS data, or any other route. No new memory entry — locked-specialisms already covers the structure.