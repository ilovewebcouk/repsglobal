## Fix

Rebuild `LanguagePicker` as **four inline slots**, not a popover dropdown.

### Behaviour
- Up to 4 slots, rendered left-to-right, wrapping on narrow widths.
- Filled slot = compact pill showing the language with an `×` to clear (returns slot to ghost).
- Empty slot = ghost pill with **dashed border**, plus icon, label "Add language" (or "Add another" after the first). Same height as a filled slot.
- Clicking a ghost slot turns it into a small shadcn `<Select>` inline (same pill footprint). Choosing a language fills the slot; the next ghost slot remains.
- After 4 are filled, no more ghost slots render.
- `<Select>` options exclude languages already picked in other slots.
- Same curated list from `src/lib/languages.ts`. Cap stays at 4.

### Why this fixes it
- No popover — answers "I can't see the writing / don't want a big dropdown".
- Mirrors the multi-input ghost-slot pattern the user remembers (settings page uses `border border-dashed` chip-add at `dashboard_.settings.tsx:172`).
- Native shadcn Select renders inline on top of the slot, so the menu is compact and readable on dark theme.

### Files
- `src/components/forms/LanguagePicker.tsx` — full rewrite, same exported API (`values`, `onChange`).

### Out of scope
- No change to server fn, schema, or the field surrounding it. Same cap (4), same data.

### Verification
1. Reload `/dashboard/profile` → Contact section shows one filled pill (if any) + ghost slots up to 4.
2. Click a ghost slot → inline Select opens; dark, readable, scoped to remaining languages.
3. Pick "Spanish" → slot fills; next ghost slot appears.
4. Click `×` on a filled slot → returns to ghost.
5. Fill all 4 → ghost row disappears.
6. Save → reload → state restores correctly.
