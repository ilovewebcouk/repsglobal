## Featured card → "card version of the directory profile"

Anchor the Featured card to the directory `ProCard` system (`src/routes/find-a-professional.tsx`, ~L810) so the two feel like one product. Featured stays vertical (locked in `mem://design/locked-cities`), but every token, control and pattern is borrowed from the directory row.

### What changes in `src/components/public/FeaturedProCard.tsx`

**Image — square, not portrait, with directory-style framing**
- `aspect-[4/5]` → `aspect-square`, `object-cover object-[center_15%]`.
- Photo gets its own `rounded-[16px]` inner radius inside the card (directory pattern: photo is a 16px tile, card is 18px), with `p-4 sm:p-5` padding around it — image no longer bleeds to card edges.
- Remove the absolute pill overlay on the image (next bullet).

**Name + pills row — borrowed verbatim from directory desktop layout**
- Below the photo: `<div className="flex flex-wrap items-center gap-2">` with `<h3 className="font-display text-[17px] font-bold leading-tight text-reps-charcoal">{name}</h3>` and the `VerificationPill` inline beside it (NOT on the image).
- Drop the `variant="onImage"` usage entirely. Featured now uses the default emerald `REPs Verified` + orange `Pro/Studio` chips, exactly like the directory row.
- Role on a second line: `text-[12.5px] text-reps-muted-light`.

**Meta row — mirror directory exactly**
- Replace the current `gap-3` row with directory's: `flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-reps-muted-light`.
- Icons: `MapPin h-3.5 w-3.5` (city), `Star h-3.5 w-3.5 fill-reps-orange text-reps-orange` + rating (`font-semibold text-reps-orange`) + `(reviews)`, `Laptop h-3.5 w-3.5` + mode.
- Shorten "In-person & Online" → "In-person + Online" so it never wraps.

**Save button — directory styling**
- Move from the image to the card's top-right corner OR keep top-right of card body next to the name, matching directory's mobile-inline pattern.
- Replace the white-circle-on-image with: `rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light transition-colors hover:border-reps-orange hover:text-reps-orange` + `Bookmark className="h-4 w-4"`. Add local saved state that toggles to `fill-reps-orange text-reps-orange border-reps-orange` (no backend wiring this turn).

**Tag chips — humanised**
- Add `formatSpecialismLabel(slug)` in `src/lib/format.ts` (verify the file; if absent, create it). Use the existing specialism dictionary if `src/lib/specialisms.ts` has one; otherwise title-case + replacement map: `pre-post-natal` → "Pre/Post-Natal", `rehab-return-to-training` → "Rehab & Return", `over-50s` → "Over-50s", `hybrid-training` → "Hybrid Training", `fat-loss` → "Fat Loss", `strength-training` → "Strength Training".
- Render two chips with the directory tag style if directory has one; otherwise keep the existing pill but feed it human labels.

**CTA + height lock**
- Keep the full-width orange "View Profile" button (`h-9 rounded-[10px] bg-reps-orange text-white`, no shadow per token rules).
- Add `min-h-[40px]` to the tag-chip row so cards with chunkier chips don't push CTAs out of horizontal alignment across the grid.

### `src/components/directory/VerificationPill.tsx`
- Remove the `variant="onImage"` branch (now unused). Featured uses the default emerald pill — one source of truth.

### Files touched
- `src/components/public/FeaturedProCard.tsx` — restructure: padded card, square photo with inner radius, name + inline pills, directory meta row, directory-style Save, humanised chips, min-h on chip row.
- `src/components/directory/VerificationPill.tsx` — delete onImage variant + the `variant` prop.
- `src/lib/format.ts` (or `src/lib/specialisms.ts` if a catalogue already lives there) — add `formatSpecialismLabel`.

### Verification
- Side-by-side: `/find-a-professional` (directory row) vs `/professions/personal-trainer` Featured grid. Verified pill, save button, meta row, type sizes, icon sizes must all match — only the orientation differs.
- Test at 1366×900 and 390×844: no wrap on "Covent Garden + In-person + Online", all 4 CTAs aligned, all 4 chips human-readable.
- Token audit (REPs build compliance): orange tokens only, radii from the 9-step scale (18 card / 16 photo / 10 button / 12 input), no button shadows.

### Out of scope (explicit)
- Demo avatar regen (square + REPS embroidery + visibly different James/Daniel) — separate job per your direction.
- Wiring real reviews / rating data.
