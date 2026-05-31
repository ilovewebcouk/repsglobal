## Convert Services & Pricing cards to horizontal layout

### Goal
Stop squeezing 3 vertical cards into the narrow middle column. Stack them vertically as full-width horizontal cards so the image, title, description and price all have room to breathe.

### Layout (per card)

```text
┌───────────────────────────────────────────────────────────┐
│ ┌───────┐  Personal Training                     From £60 │
│ │       │  1-to-1 in-person sessions tailored…  per session│
│ │ img ◐ │                                                  │
│ └───────┘                                                  │
└───────────────────────────────────────────────────────────┘
```

- Three columns inside each card: image (left) · title + description (center, grows) · price + unit (right, fixed).
- Three cards stacked vertically inside the Services & Pricing panel, separated by `gap-3`.

### Changes (`src/routes/pro.$slug.tsx`, services block lines ~417–451)

1. **Grid → vertical stack**: replace `mt-4 grid items-stretch gap-3 sm:grid-cols-3` with `mt-4 flex flex-col gap-3`.
2. **Article**: change to a 3-column flex row — image · content · price. Keep dark `bg-reps-panel` body, `rounded-[18px]`, white text.
3. **Image**: fixed square, ~96px (`h-24 w-24` or `h-28 w-28`), `aspect-square`, `overflow-hidden`, `rounded-[12px]`, `object-cover`. No more `aspect-[5/4]` stretching landscape sources.
4. **Icon**: move to bottom-left **inside** the image (no seam straddle). `absolute bottom-2 left-2`, smaller (`h-7 w-7`), no ring needed.
5. **Content column**: title on one line (drop `min-h-[2.4em]` and `line-clamp-2`), description on 1–2 lines, slightly larger sizes now that there's room (title `text-[16px]`, desc `text-[13px]`).
6. **Price column**: right-aligned, fixed-width-ish, price `text-[16px] font-bold`, unit `text-[12px] text-white/60`.
7. **Padding**: card uses `p-3` so the image sits flush-ish; content column gets `px-3` for spacing.

### Out of scope
- Data in `pro.services` — unchanged.
- Other cards/sections — unchanged.
- The middle column width in the outer `1fr_1.4fr_1fr` grid — unchanged (horizontal cards now use that width well, so no need to rebalance).
- Icon mapping per service — unchanged.

### Risk / verification
- After change, screenshot `/pro/james-carter` at 1469px and confirm:
  - All 3 cards same height, prices right-aligned, no text clipping.
  - Hero landscape image on Personal Training crops cleanly to a square.
  - Services panel height now feels closer to the About panel beside it (may end up slightly taller — acceptable, fixable by tightening padding if needed).
