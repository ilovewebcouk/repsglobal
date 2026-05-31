# Tailwind Theme: Lock Orange Utilities & Focus Rings to --reps-orange Tokens

The token wiring is already mostly correct (`--ring`, `--primary`, `--chart-1`, `--sidebar-primary`, `--sidebar-ring` all reference `var(--reps-orange)`, and every shadcn component uses semantic utilities like `ring-ring`, `border-input`, `bg-primary`). This pass is a verification + small additive refactor so the new hover/soft/border tokens are reachable from utilities and there is zero ambiguity.

## 1. Expand `@theme inline` mappings in `src/styles.css`

Add semantic aliases so utilities resolve to the new tokens — purely additive, nothing renamed:

```css
/* Hover variant of primary (orange) — for non-opacity hovers */
--color-primary-hover: var(--reps-orange-hover);

/* Soft orange fill + border, for chips/badges/selected cards */
--color-primary-soft: var(--reps-orange-soft);
--color-primary-border: var(--reps-orange-border);
```

This makes `bg-primary-hover`, `bg-primary-soft`, `border-primary-border` available as Tailwind utilities, alongside the existing `bg-reps-orange*` family.

## 2. Wire the ring offset and focus tokens explicitly

Today `--color-ring-offset-background: var(--background)` is set, and `--ring` already maps to `--reps-orange` in both `:root` and `.dark`. Confirm that's still the case after this turn (no edit needed unless verification finds drift). All shadcn components already use `focus-visible:ring-ring` / `focus:ring-ring` / `ring-offset-background`, so focus rings will be REPs orange everywhere with no component changes.

## 3. Sweep for hardcoded oranges and raw Tailwind orange utilities

Run a final grep across `src/` for `#F28C38`, `#D87322`, `#F97316`, `#FF7A00` (outside `styles.css`), `bg-orange-`, `text-orange-`, `border-orange-`, `ring-orange-`, `outline-orange-`. Current sweep is clean — re-run after the edit to confirm and replace any stragglers with the token utility (`bg-primary`, `ring-primary`, `bg-reps-orange-soft`, etc.).

## 4. Documentation note

Append a one-line note to `mem://design/source-of-truth` listing the new utility aliases (`bg-primary-hover`, `bg-primary-soft`, `border-primary-border`) so future components reach for those instead of hand-rolled hex.

## Out of scope

- No edits to shadcn primitives — they already use semantic tokens.
- No changes to non-orange tokens (gold, green, red, blue, neutrals, shadows, radii, typography).
- No layout, spacing, or component-structure changes.
- Dark theme keeps the same orange — no dark-mode-specific orange variant.
