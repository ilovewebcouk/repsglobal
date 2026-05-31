# Remove Shadows from All Buttons

The shadcn `Button` (`src/components/ui/button.tsx`) carries `shadow` on `default` and `shadow-sm` on `destructive`, `outline`, and `secondary`. The locked mock-ups render buttons flat, so the shadows are off-spec.

## Change

In `src/components/ui/button.tsx`, drop the shadow utility from each affected variant:

- `default`: `bg-primary text-primary-foreground shadow hover:bg-primary/90` → `bg-primary text-primary-foreground hover:bg-primary/90`
- `destructive`: remove `shadow-sm`
- `outline`: remove `shadow-sm`
- `secondary`: remove `shadow-sm`
- `ghost`, `link`: unchanged (already no shadow)

Single-file edit. All buttons across the app inherit the change automatically.

## Out of scope

- No changes to colors, sizes, radius, focus rings, or hover behavior.
- No edits to other components (cards, inputs, dialogs) — only the Button primitive.
- One-off buttons that opt into a shadow via `className="shadow-..."` (none found at a glance) would still keep their override.
