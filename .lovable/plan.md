## What's changing

Today the dashboard has two parallel rows:

```text
Row 3:  [ Needs Attention      8 ] [ Completeness  4 ]
Row 4:  [ Recent Activity      8 ] [ Verification  4 ]
Row 5:  [ Education & CPD      8 ] [ Reviews       4 ]
```

Because Verification is intrinsically a short card (3 status rows + header + button ≈ 240px) and Activity is intrinsically tall (up to 10 events), forcing them to the same row height pads Verification with dead space and stretches Activity to feel sparse.

The fix merges rows 3 + 4 into a single 8/4 grid where the right column **stacks** two compact cards to match the combined height of the two tall left cards:

```text
Merged row:
┌──────────────────────────┬──────────────────┐
│  Needs Attention   (8)   │  Completeness    │
│                          │  (compact)       │
│                          ├──────────────────┤
│  Recent Activity   (8)   │  Verification    │
│                          │  (compact)       │
└──────────────────────────┴──────────────────┘

Row 5 (unchanged):
[ Education & CPD     8 ] [ Reviews       4 ]
```

This is the Linear / Vercel / Stripe pattern: the wide column carries the dense, scannable content; the narrow column stacks two natural-height status cards so nothing is artificially stretched.

## Behaviour

- **Right column** becomes a vertical flex stack (`flex flex-col gap-4`). Completeness and Verification size to their natural content — no min-heights, no dead space.
- **Left column** stays a vertical stack: Needs Attention on top, Recent Activity below, both with internal scroll when content overflows.
- **Row heights auto-balance**: the merged grid row stretches to whichever column is taller. In practice the two left cards together (~640px) will roughly match the two right cards stacked (~520px), and the leftover space is absorbed by Activity's flex-1, which keeps it pleasantly tall without looking padded.
- **No forced equal heights anywhere.** The previous `min-h-[320px]` / `min-h-[340px]` wrappers come off.
- Row 5 (CPD + Reviews) stays as-is — both cards have similar density so equal-height there still works; just drop the `min-h-[300px]` so it breathes naturally.

## Technical details

**File:** `src/routes/_authenticated/_professional/dashboard.tsx`

Replace rows 3 and 4 (lines ~207–242) with a single merged grid:

```tsx
{/* Merged row — Needs Attention + Activity (left) | Completeness + Verification (right) */}
<div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
  <div className="flex flex-col gap-4 xl:col-span-8">
    <NeedsAttention ... />
    {hub.enquiries.isLoading || hub.reviews.isLoading ? (
      <Skeleton className="h-[260px] w-full rounded-[22px]" />
    ) : (
      <ActivityTimeline ... />
    )}
  </div>
  <div className="flex flex-col gap-4 xl:col-span-4">
    <CompletenessCard ... />
    <VerificationStatusCard ... />
  </div>
</div>
```

Then for row 5, drop the `min-h-[300px]` wrappers:

```tsx
<div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
  <div className="xl:col-span-8"><CpdMini ... /></div>
  <div className="xl:col-span-4"><ReviewsSnapshot ... /></div>
</div>
```

**File:** `src/components/dashboard/hub/index.tsx`

The cards already have `flex h-full flex-col` and internal scroll regions from the last pass — no changes needed inside the cards themselves. They'll automatically size correctly inside the new stacked layout:

- `CompletenessCard` and `VerificationStatusCard` will collapse to natural height (the `min-h-0 flex-1 overflow-y-auto` on their inner lists becomes a no-op when content fits).
- `NeedsAttention` and `ActivityTimeline` will fill their column via `flex-1` inside the left stack, with internal scroll on overflow.

## Why this is 10/10

1. **No dead space.** Verification stops looking padded.
2. **No forced parity.** Cards size to their content density.
3. **Visual rhythm preserved.** The 8/4 grid still reads as one balanced row; the eye sees one block, not two.
4. **Scales with data.** If a trainer has 1 attention item and 2 activity events, the row collapses gracefully. If they have 10 of each, internal scroll kicks in. Verification and Completeness stay the same size either way.
5. **Matches what Linear / Vercel / Stripe ship.** Dense list on the wide side, stacked status cards on the narrow side, no fake equal-height.

## Out of scope

- KPI strip styling, Welcome banner, Services strip, Pro upsell — leave alone.
- Card internals (typography, padding, icons) — last pass already polished these.
- Row 5 (CPD / Reviews) layout — already balanced; just removing the min-h.
