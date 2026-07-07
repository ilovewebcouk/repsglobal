## Goal
The provider "Request a review" dialog currently renders in the shadcn light theme (`bg-background` = cream) against the dark REPS dashboard. Repaint just this dialog in the dark REPS palette so it matches every other panel on `/dashboard/reviews`. Trainer dialog is not touched.

## What's wrong now
- `DialogContent` inherits `bg-background` + light text.
- The CSV drop-zone reads as a grey slab because `bg-reps-panel-soft/40` on a cream sheet looks washed out.
- Tab strip uses the default light shadcn `TabsList`.

## Changes (single file)

**`src/components/dashboard/organisation/ReviewsPage.tsx` — `RequestReviewDialog` only**

1. `DialogContent`
   - Add classes: `bg-reps-panel text-white border-reps-border sm:max-w-lg`.
   - Also style the close (X) button state via a scoped tweak: keep default position, ensure the icon reads on dark — no code change to `dialog.tsx`, just visual test.

2. `DialogHeader` copy
   - `DialogTitle`: `text-white font-display text-[18px]`.
   - `DialogDescription`: `text-white/65 text-[13px] leading-relaxed`.

3. `TabsList` (Single / CSV upload)
   - `bg-reps-ink/60 p-1 h-10 rounded-[10px]`
   - `TabsTrigger`: `h-8 rounded-[8px] text-[12.5px] font-semibold text-white/65 data-[state=active]:bg-reps-panel data-[state=active]:text-white data-[state=active]:shadow-none`

4. Single-tab form
   - `Label`: add `text-white/70 text-[12px] font-semibold` (matches other dashboard forms).
   - `Input`: rely on existing shadcn input dark styling (already used elsewhere on this page in the search field).
   - Cancel `Button variant="outline"`: `border-reps-border bg-transparent text-white/80 hover:text-white`.

5. CSV-tab
   - Info row: `text-white/70` on the meta line, keep `Template` button styles.
   - Dropzone label: replace current classes with
     `flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-reps-border bg-reps-ink/50 hover:bg-reps-ink/70 px-4 py-8 text-center` (dark, not the grey slab).
   - Preview panel: `bg-reps-ink/60 border-reps-border` (already there — keep) but ensure row text is `text-white` / `text-white/60`.
   - Cancel button same treatment as (4).

6. No changes to:
   - Trainer file `src/routes/_authenticated/_professional/dashboard_.reviews.tsx`
   - `src/components/ui/dialog.tsx` (base primitive stays theme-neutral)
   - Server functions or CSV parsing logic
   - Trainer-side styling anywhere

## Verification
1. Open `/dashboard/reviews` as a training provider → click "Request a review" → dialog renders dark (matches the KPI cards / Sent-requests panel).
2. Both tabs are legible; CSV drop-zone is a dashed dark tile, not a grey block.
3. Trainer `/dashboard/reviews` dialog is visually unchanged.
4. Typecheck passes.
