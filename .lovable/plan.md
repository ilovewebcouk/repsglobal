
## Brutal honest take

You're right — the current dashboard reads as a stack of cards floating on a dark background, not a SaaS surface. Three concrete reasons:

1. **Rows don't equalise height.** Each `grid` row lets its two children size to content, so "Needs your attention" finishes early while "Profile completeness" keeps going — the gap is just exposed page background. Dribbble dashboards lock the row to the tallest sibling and let the shorter card breathe with internal padding (or scroll).
2. **No internal scroll regions.** `Needs your attention` and `Recent activity` truncate by hard-coding 5/10 items into the DOM. There's nowhere for "more rows than fit" to live.
3. **Rhythm is broken.** Row 5 (CPD + Reviews) is a different grid ratio (50/50) than rows 3–4 (66/33). The eye sees three different columns systems on one page.

## What to change

Scope is presentational only — no data, no business logic. All work in `src/components/dashboard/hub/index.tsx` and `src/routes/_authenticated/_professional/dashboard.tsx`.

### 1. Equal-height rows (the headline fix)

Add `h-full` to every `PPanel` / `PCard` used inside a row, and `items-stretch` on the row grids. Wrap each grid cell so the card fills the cell:

```text
Row 3 ─ Needs attention (8 cols) ──── Profile completeness (4 cols)  ← same height
Row 4 ─ Recent activity  (8 cols) ──── Verification         (4 cols)  ← same height
Row 5 ─ Education & CPD  (6 cols) ──── Reviews snapshot     (6 cols)  ← same height
```

Each card becomes `flex flex-col` so the header sits at top, body fills, footer (if any) pins to bottom.

### 2. Internal scroll for list bodies

Inside `NeedsAttention`, `ActivityTimeline`, and `CpdMini`:
- Header (icon + title + meta) stays fixed at top.
- Body becomes `flex-1 min-h-0 overflow-y-auto pr-1` with a subtle scrollbar.
- This is the answer to your CPD-vs-Reviews concern: if a trainer adds a 4th qualification, the CPD body scrolls inside its card — Reviews stays the same shape.

### 3. Unify the row system

Promote row 5 from `lg:grid-cols-2` to the same `xl:grid-cols-12` 6/6 split so all three two-column rows share one column grid. The KPI strip stays full-width 4-up.

### 4. Minimum heights so empty cards don't collapse

Set `min-h-[320px]` on rows 3 and 4, `min-h-[260px]` on row 5. Stops a brand-new account (no activity, no qualifications) from looking like a series of header strips.

### 5. Card-level polish (small but compounding)

- Bump `PPanel` inner padding from `p-5` to `p-6` to match the breathing room you see in the Panze reference.
- Add a subtle 1px inner highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`) so cards lift off the panel background — currently they're flat on flat.
- Tighten `SectionHeader` line-height and add a hairline divider under it (`border-b border-reps-border/40 pb-3 mb-4`) so header and body read as distinct zones.
- "Recent activity" footer (timestamp + chevron) sits on its own row with a top divider, not floating mid-card.
- "Needs your attention" empty state: when there's nothing to do, show a single confident "You're all caught up" Empty primitive, not a blank panel.

### 6. Hierarchy fixes spotted in QA

- KPI tiles have no separator between value and delta — add `text-xs text-muted-foreground mt-1` so "0 unread" doesn't look like part of the number.
- "Your services" empty state currently dominates a full-width card; reduce to `min-h-[180px]` and move "Manage services" into the empty state itself, not the header.
- "Grow your business inside REPS" CTA: contain it to the column grid width (currently breaks the rhythm by spanning edge-to-edge) and reduce vertical padding by ~30%.

### Technical notes

- Equal-height via `h-full` on cards plus default `items-stretch` on CSS grid — no JS measuring, no `ResizeObserver`.
- Scroll regions use `min-h-0` on the flex parent (required for `overflow-y-auto` inside flex column to actually clip).
- All tokens stay semantic — no hardcoded colours added. Shadow uses an existing rgba pattern already in the file.
- shadcn primitives used: `Empty` for caught-up state, `Separator` for in-card dividers, `ScrollArea` is intentionally **not** used (native overflow is lighter and matches the dark theme better here).

### Out of scope (flag for separate pass)

- Sidebar density and the empty `Account / Deliver` section labels — separate IA pass.
- KPI tile redesign with sparklines — needs design directions.
- Mobile breakpoints below `lg` — current request is desktop polish; mobile already stacks correctly.
