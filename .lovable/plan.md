## Accreditations block — 10/10 polish

Keep pills on the qualification row (they belong to the qual, not the awarding body). Reserve the header-right slot for the future awarding-body badge so nothing has to re-lay out later.

### Changes (single file: `src/routes/t.$slug.index.tsx`, lines ~574–605)

1. **Body header row — reserve badge slot**
   - Wrap `<p>Active IQ</p>` in a flex row: `<div className="flex items-center justify-between gap-3">` with `<p className="text-[13.5px] font-semibold ...">Active IQ</p>` on the left and an empty `<div />` placeholder on the right. When the badge lands later it drops in without touching layout.

2. **Qualification title — stronger hierarchy**
   - Bump title from `font-medium` at inherited 13px to `text-[13.5px] font-semibold text-black` so it visually outweighs the pills.

3. **Pill row — breathing room**
   - Change the qual row from `gap-x-2 gap-y-1` to `gap-x-2 gap-y-1.5` so wrapped pills don't crowd.

4. **Pill micro-cap labels — cleaner emerald**
   - Change the "Ofqual" and "REPS" inner `<span>` from `text-emerald-700/70` to `text-emerald-700 font-semibold` (drop from `font-bold`), so the label reads crisp against the mono ref number instead of washed out.

### Explicitly NOT changing
- Pill position (stays on qual row, not header row).
- REPS-QUAL 4-digit format.
- Level chip, order of elements, or any color tokens outside the two micro-caps.
- Any other section on the page.

### Why this is the right call
- Awarding bodies can hold multiple quals; pills glued to the body name break the moment a second qual is added.
- Header-right reservation means the future "Active IQ endorsed" / approved-centre badge lands with zero re-layout.
- Title-weight bump restores the intended read order: body → qual → reference IDs.