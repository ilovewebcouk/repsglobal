## Remove partial-cell icon from CompetitorCompare

### Problem
The partial-indicator `<span class="mt-1 h-1.5 w-3 shrink-0 rounded-full bg-reps-gold" />` in `CellIcon` renders as an awkward tiny oval that looks unintentional.

### Change
In `src/components/marketing/CompetitorCompare.tsx`, update the `partial` branch of `CellIcon` so it returns only the note text — no icon.

### No other changes
- No edits to `no` or `yes` branches.
- No edits to data, layout, or other components.