# Pathways → shadcn Tabs (line variant)

Replace the 4 stacked pathway blocks in `Qualifications()` (`src/routes/cpd.tsx`) with a single shadcn `Tabs` component using an underline/line variant, so users switch between **Fitness · Nutrition · Pilates · Yoga** instead of scrolling four full sections.

## Scope (only `Qualifications()` in src/routes/cpd.tsx)

Keep above unchanged:
- Eyebrow "Qualifications, decoded"
- H2 "Every accredited pathway, in plain English."
- Intro paragraph (4 pathways)

Replace below the intro:
- The 4 sibling blocks (Fitness / Nutrition / Pilates / Yoga grids + their headings/intros) become one `Tabs` block.

## Tabs structure

```text
<Tabs defaultValue="fitness">
  <TabsList> (line / underline variant, full-width, left-aligned, sticky-feeling chrome)
    [Activity] Fitness   [Heart] Nutrition   [Disc] Pilates   [Flower2] Yoga
  ─────────────────────────────────────────── (1px reps-border baseline)

  <TabsContent value="fitness">    → intro line + 3-col LadderCard grid (FITNESS_LADDER)
  <TabsContent value="nutrition">  → intro line + 3-col Nutrition cards + "Plain English" callout
  <TabsContent value="pilates">    → intro line + 3-col LadderCard grid (PILATES_LADDER)
  <TabsContent value="yoga">       → intro line + 3-col LadderCard grid (YOGA_LADDER)
</Tabs>
```

Each `TabsContent` opens with the small per-pathway intro paragraph that currently sits under the H3 (e.g. "Pilates runs on hours-based teacher training…"), then the existing grid — no card markup changes.

## Line-variant styling

shadcn's default `TabsList` is a filled pill. For a line variant we override via `className` on `TabsList` / `TabsTrigger` (no new shadcn component needed):

- `TabsList`: `h-auto bg-transparent p-0 gap-6 border-b border-reps-border rounded-none justify-start w-full`
- `TabsTrigger`:
  - base: `rounded-none bg-transparent px-1 pb-3 pt-2 text-[14px] font-semibold text-white/55 data-[state=active]:text-white data-[state=active]:shadow-none`
  - underline: `relative after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-transparent data-[state=active]:after:bg-reps-orange`
  - icon: lucide icon with `data-icon="inline-start"` (no manual sizing)
- Horizontal scroll on small screens: wrap `TabsList` in `<div className="overflow-x-auto">`.

This keeps everything in semantic tokens (`reps-border`, `reps-orange`, `white/55`) and uses shadcn primitive — no custom Tabs component file.

## Out of scope

- No copy changes, no LadderCard/NUTRITION card redesign, no icon swaps.
- Eyebrow + H2 + intro paragraph stay as-is.
- Other `/cpd` sections untouched.
