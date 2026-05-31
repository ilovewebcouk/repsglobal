## Goal

Keep the trainers fully visible on the right while guaranteeing readable copy on the left, at every breakpoint.

## Problem with current implementation

Two overlays sit on top of the whole image:
1. A gradient that still leaves ~25–60% ink across the trainer area on desktop.
2. A flat `bg-reps-ink/25` "deepener" covering 100% of the image — this is what's darkening the trainers.

So yes — the overlay is currently on the whole image div, not shaped to the copy area. We need to shape it.

## Fix (CTA section only in `src/routes/index.tsx`, ~lines 515–528)

**Remove the flat 25% deepener.** It's the main culprit dimming the trainers.

**Reshape the gradient overlay per breakpoint** so ink is dense behind the copy and fully transparent over the trainers:

- **Desktop (≥ lg, trainers on right half):**
  `bg-gradient-to-r from-reps-ink via-reps-ink/85 from-0% via-45% to-transparent to-70%`
  → solid ink behind copy column (0–45%), clean fade out, fully transparent across the trainer half (70%+).

- **Tablet (md, trainers top, copy bottom):**
  `md:bg-gradient-to-b md:from-transparent md:via-reps-ink/40 md:to-reps-ink md:from-30% md:via-60% md:to-85%`
  → top 30% untouched (trainers' faces clear), ink ramps in over the copy band below.

- **Mobile (< md, stacked: image on top, copy below on solid ink):**
  No overlay needed on the image — copy sits on the solid `bg-reps-ink` panel below. Drop the overlay div on mobile (`hidden md:block` on the gradient layer), so the 4:3 hero image renders clean with no dimming.

## Copy-side contrast safety net

To compensate for removing the flat deepener, bump text contrast slightly on the copy:
- Body `text-white/75` → `text-white/85`
- Checklist items `text-white/90` → `text-white` (unchanged in weight)
- Add a soft text-shadow utility on the headline only as belt-and-braces against any bright pixels bleeding through (`drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]`).

## Why this answers your question directly

> "do we put the overlay on the image? Or is this what you've done?"

Current code puts the overlay on a wrapper that contains *only* the image, but it covers the image edge-to-edge — same visual effect as overlaying the trainers. The fix is to **shape the overlay** (gradient stops + breakpoint-specific direction) so it only covers the pixels under the copy, leaving the trainer pixels untouched. No flat full-cover layer.

## Out of scope

No new asset, no token changes, no other sections.
