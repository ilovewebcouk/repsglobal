## Restore mock-up price lockup on Service cards

Two-line layout matching the original mock-up:

- Line 1: `From £60` (single line, "From" before the price)
- Line 2: `per session` (or `per month`, `one-off plan`)

### Change

In `src/routes/pro.$slug.tsx` Services cards (lines 441-448), replace the current inline lockup with:

```
<div className="pt-1">
  <div className="font-display text-[22px] font-bold leading-none text-white">
    {s.price}  {/* already includes "From £60" */}
  </div>
  <div className="mt-1 text-[11px] uppercase tracking-wider text-white/55">
    {s.unit}
  </div>
</div>
```

`s.price` already starts with `From` so no string surgery is needed — drop the `.replace(/^From\s*/, "")`.

### Out of scope

No other changes to the Services card (image, icon badge, title, description, header link all stay). No changes to Specialisms, Location, or any other section.
