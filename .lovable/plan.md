## Option 1 — resize and reposition the trainer cutout

Single change to the cutout's `<img>` block in `src/routes/index.tsx` (currently lines 170–175).

### New markup

```tsx
{/* Layer B — trainers cutout, sized to fit between headline and Why REPs card */}
<div className="pointer-events-none absolute bottom-[150px] right-[24%] hidden lg:block">
  {/* Soft elliptical ground shadow */}
  <div
    aria-hidden="true"
    className="absolute -bottom-4 left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/60 blur-2xl"
  />
  <img
    src={heroTrainersCutout}
    alt=""
    aria-hidden="true"
    className="relative h-auto w-[340px] select-none drop-shadow-[0_25px_35px_rgba(0,0,0,0.55)]"
  />
</div>
```

### Why these numbers

- `w-[340px]` — at the native ~425×375 cutout aspect, this renders trainers at roughly the mockup scale (about 26% of the 1320px hero container)
- `right-[24%]` — sits them between the copy column and the Why REPs card, so the card overlaps the male trainer's shoulder the same way it does in the mockup
- `bottom-[150px]` — anchors them just above the search panel so head + full torso + hips are visible (no more cropping at neck/face)
- `drop-shadow-…` + soft elliptical ground shadow — grounds them in the room so they don't look pasted on
- `pointer-events-none` — keeps the headline/CTA fully interactive underneath

### Out of scope

No changes to the gym backdrop, gradients, copy, Why REPs card, search panel, or any tokens. Mobile still uses the gym backdrop alone (no cutout).
