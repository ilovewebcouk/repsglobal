## Fix

Single targeted change in `src/components/pricing/PricingPlans.tsx`: add `group` to the `ToggleGroupItem` `className` so the inner "Save 2 months" `Badge`'s `group-data-[state=on]:bg-white/20 group-data-[state=on]:text-white` modifiers actually fire when the parent toggle is active.

### Before
```tsx
<ToggleGroupItem
  ...
  className="flex h-9 items-center gap-2 rounded-full bg-transparent px-5 text-[13px] font-semibold text-white/65 hover:bg-transparent hover:text-white data-[state=on]:bg-reps-orange data-[state=on]:text-white"
>
```

### After
```tsx
<ToggleGroupItem
  ...
  className="group flex h-9 items-center gap-2 rounded-full bg-transparent px-5 text-[13px] font-semibold text-white/65 hover:bg-transparent hover:text-white data-[state=on]:bg-reps-orange data-[state=on]:text-white"
>
```

## Verification

- `/pricing` with Annual selected: "Save 2 months" pill visible inside the orange Annual button with white text on white/20 background (matches original).
- Click Monthly: badge stays only on Annual (still only rendered when `b === "annual"`).
- No other regressions; other QA passes already clean (founding banner, tier cards, signup checkout-entry card).
