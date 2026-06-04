# Proof band: strip the container, commit to one dark continuum

## The problem

The proof band currently sits on `bg-reps-panel-soft` (lighter) with a `bg-reps-panel` card + ring on top. Hero and Act 1 are both `bg-reps-ink` (deep dark). Result: a lighter strip with a darker card in the middle of two dark chapters — the container reads before the content, and the section looks like it belongs to a different page.

## What changes

In `src/routes/for-professionals.tsx`, the proof band (currently lines ~144–197):

1. **Section background**: `bg-reps-panel-soft` → `bg-reps-ink`. Same ink as hero and Act 1.
2. **Remove the card entirely**: drop the `<div className="relative overflow-hidden rounded-[22px] bg-reps-panel ring-1 ring-reps-border/60">` wrapper. Content goes directly on the section.
3. **Keep the orange radial glow** behind "Trusted since 2009." — it's the one focal anchor and it's working. Re-centre it on the section, not the (removed) card.
4. **Keep the shield icon, eyebrow, headline, sub** exactly as-is — content is good, only the container is wrong.
5. **Hairline divider**: keep one between the heritage block and the press row (not both top and bottom). Tighten to `border-reps-border/40` so it's a whisper, not a frame edge.
6. **Vertical rhythm**: bump padding to `py-20 lg:py-24` so the band has confident air around it now that there's no card holding it in.
7. **Press row weight**: bump the wordmarks from `text-white/55` → `text-white/65` and from `font-semibold` tracking `0.18em` → keep — but allow a touch more weight at hover. Without a frame they need to carry themselves.
8. **Chapter separators**: with hero → proof band → Act 1 all on the same ink, the separation comes from spacing alone. Remove Act 1's `border-b border-reps-border` top boundary too if it now reads as a stray line (verify in screenshot first — may still need it for the bottom of Act 1).

## What stays out

- No new tokens.
- No copy changes.
- No changes to hero or Act 1 (other than the optional Act 1 border check noted above).
- No changes to the press logos, links, or order.

## Verification

- Screenshot at 1440px: hero → proof band → Act 1 should read as one continuous dark surface with three distinct content moments separated by air and the orange glow, not by surface color.
- Screenshot at 390px (mobile): same continuity, copy legible, press wordmarks wrap cleanly.
- Sanity check: does the "Trusted since 2009" moment still feel like a *moment*, or does it disappear into the page? If it disappears, the fix is more vertical padding and a touch more glow intensity — not putting the card back.

## Honest risk

Stripping the container is the right move, but it raises the execution bar. If the padding or glow is undercooked, it'll look like the band lost its frame rather than gained confidence. I'll screenshot after and tune if needed before claiming done.
