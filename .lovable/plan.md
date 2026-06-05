Add a black background override to every "Save" bookmark tooltip across the app.

The shadcn `TooltipContent` component renders with `bg-primary` (brand orange) by default. The user wants the "Save" tooltip specifically to appear black.

Scope — 4 `TooltipContent` instances to update:
- `src/routes/find-a-professional.tsx` — 2 save tooltips (featured card + list card)
- `src/routes/professions.$profession.tsx` — 1 save tooltip
- `src/routes/in.$location.tsx` — 1 save tooltip

Change: add `className="bg-reps-black text-white"` to each `<TooltipContent>` that wraps the Save bookmark button. This uses the existing `--color-reps-black` design token (`#050608`) with white text for contrast.