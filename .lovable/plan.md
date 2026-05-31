# Standardise REPs Orange to #FF7A00

A pure colour-token correction. No layout, typography, or component-structure changes.

## 1. Update design tokens (`src/styles.css`)

Replace the two hardcoded orange values (lines 113–114) and add the new hover / soft / border tokens so the whole app inherits the brighter, more saturated brand orange.

```css
/* REPs accents */
--reps-orange: #FF7A00;          /* was #F28C38 */
--reps-orange-hover: #E96F00;    /* new */
--reps-orange-dark: #CC6200;     /* was #D87322 */
--reps-orange-soft: rgba(255, 122, 0, 0.12);    /* new */
--reps-orange-border: rgba(255, 122, 0, 0.35);  /* new */
```

Also expose the new tokens to Tailwind v4 in the `@theme` block at the top of the file so they can be used as utility classes (`bg-reps-orange-hover`, `bg-reps-orange-soft`, `border-reps-orange-border`):

```css
--color-reps-orange: var(--reps-orange);
--color-reps-orange-hover: var(--reps-orange-hover);
--color-reps-orange-dark: var(--reps-orange-dark);
--color-reps-orange-soft: var(--reps-orange-soft);
--color-reps-orange-border: var(--reps-orange-border);
```

Because `--primary`, `--ring`, `--chart-1`, `--sidebar-primary`, and `--sidebar-ring` all reference `var(--reps-orange)`, every primary CTA, focus ring, active nav state, selected card highlight, chart-1 series, dashboard action button, and badge accent will pick up #FF7A00 automatically. No component edits required for those.

## 2. Sweep for stray hardcoded oranges

Grep across `src/` for `#F28C38`, `#D87322`, `#F97316`, and `orange-(400|500|600|700)` utility classes. Current sweep finds zero outside `src/styles.css`, but re-run after the edit to confirm. Any straggler gets swapped to the token (`bg-reps-orange`, `hover:bg-reps-orange-hover`, `ring-reps-orange`, etc.).

## 3. Update internal documentation

- `mem://design/source-of-truth` — set Primary REPs orange to `#FF7A00`, hover `#E96F00`, dark/pressed `#CC6200`, soft `rgba(255,122,0,0.12)`, border `rgba(255,122,0,0.35)`. Reaffirm the six full-page mock-ups as the locked visual source of truth and mark older 16:9 crops as archive-only.
- `mem://index.md` Core — refresh any orange hex if mentioned (currently none — leave as-is).
- `.lovable/plan.md` — append a short note that brand orange is now `#FF7A00` and prior `#F28C38` references are superseded.

No separate Visual Design System / Build Prompt Pack / Page-by-Page Spec files exist in the repo today; the memory file above is the canonical project doc, so it's where the colour standard lives.

## Out of scope

No changes to layout, spacing, typography, sidebar structure, card styling, page hierarchy, or any non-orange palette token (ivory, stone, charcoal, gold, green, red, blue, shadows). No new themes, no component refactors.
