## Fix Featured card image framing

Match the directory card pattern so faces are never cropped.

### Change

**`src/components/public/FeaturedProCard.tsx`** — the `<img>`:

- Before: `h-44 w-full object-cover` (wide banner, no object-position — heads get sliced)
- After: `aspect-square w-full object-cover object-top` (square headshot tile, top-anchored like directory cards)

No other changes. Pill, Save button, copy block, CTA all stay identical.

### Why

Directory cards already use square + `object-top` so faces center naturally. FeaturedProCard was the only outlier using a landscape banner crop, which is what's clipping foreheads on `/in/london` and `/professions/personal-trainer`.

### Verification

Screenshot `/professions/personal-trainer` and `/in/london` at desktop + mobile after the change — confirm no face is cropped on any of the 6 demo featured pros.
