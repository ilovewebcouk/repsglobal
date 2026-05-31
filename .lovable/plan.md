## Blend the trainers image into the CTA panel

Keep the CTA section's existing `bg-reps-panel` background — no token or design-system changes.

Single change in `src/routes/index.tsx`, CTA section only:

**Blend the trainers image** — leave the image asset untouched. Make it feel embedded in the dark panel rather than placed on top of it by applying a CSS `mask-image` radial-gradient on the `<img>` so its edges feather to transparent into the `reps-panel` background:

```
mask-image: radial-gradient(ellipse at center, black 55%, transparent 85%);
-webkit-mask-image: radial-gradient(ellipse at center, black 55%, transparent 85%);
```

No changes to the image file, layout grid, copy, button, checklist, or background color.
