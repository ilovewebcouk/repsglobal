## Remove the line beside the logo

### What to change
In `src/components/public/PublicHeader.tsx`, delete the separator `<span>` element at line 216:

```tsx
<span aria-hidden className="hidden h-6 w-px bg-white/15 lg:block" />
```

This is the thin vertical line that appears between the REPs wordmark logo and the "London" location pin on desktop viewports. No other files need to change.
