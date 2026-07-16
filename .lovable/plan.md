
# Training Academy redesign — light directory listing

Rebuild `/training-academy` to match `/find-a-professional`: ivory background, horizontal course rows, left-sticky filter rail. Same content and mock data as the current version — only visual/layout system changes. Uses shadcn primitives throughout.

## Design lock (from screenshot + existing directory)

Token / pattern | Value
--- | ---
Page background | `bg-reps-ivory`
Card surface | `bg-white` with `border border-reps-stone`, `rounded-[18px]`
Text | `text-reps-charcoal` (headings) / `text-reps-muted-light` (meta)
Primary accent | `bg-reps-orange` / `text-reps-orange`
"REPs Endorsed" pill | Emerald status token — mint fill, `rounded-full`, matches the "REPS VERIFIED" pill in the reference
Layout | 12-col: **left-sticky filter rail (280px)** + right column of full-width horizontal cards
Radii | Cards 18px, buttons 10px, inputs 12px, pills full (LOCKED radius map)
Shadows | None on buttons; subtle hover lift on rows (`hover:-translate-y-0.5`, no shadow escalation)

## Layout structure

```text
┌───── PublicHeader (unchanged) ─────────────────────────────────────┐
├───── Hero band (short, ivory bg) ──────────────────────────────────┤
│  Eyebrow · H1 · lede · 3 trust chips                                │
├───── Search bar (full-width, sticky under header) ─────────────────┤
│  [🔍 Search courses…]  [Sort ▾]  [22 endorsed courses]              │
├─────────────────────────────────────────────────────────────────────┤
│ ┌── Filter rail (sticky, 280px) ──┐ ┌── Course rows (flex-1) ────┐  │
│ │ Profession   (radio group)      │ │ ┌── Row: Origym · L2 ────┐│  │
│ │ Level        (radio group)      │ │ │ [logo] Title           ││  │
│ │ Delivery     (radio group)      │ │ │ Provider · meta chips  ││  │
│ │ CPD points   (radio group)      │ │ │ Summary                ││  │
│ │ Ofqual only  (checkbox)         │ │ │ [Endorsed] £599 → View ││  │
│ │ Provider     (checkbox list)    │ │ └────────────────────────┘│  │
│ │ [Reset filters]                 │ │ … 21 more rows            │  │
│ └─────────────────────────────────┘ └───────────────────────────┘  │
├───── What "REPs Endorsed" means (3-col explainer) ─────────────────┤
├───── FAQ (MarketingFaq, dark strip)                               │
├───── FinalCta (shared)                                             │
└───── PublicFooter                                                  ┘
```

On mobile (`< lg`) the left rail collapses into a shadcn `Sheet` opened by a "Filters" button on the search bar, matching the reference screenshot's "Filters" pill.

## Files

**Edit**
- `src/routes/training-academy.tsx` — swap dark shell for ivory, replace filter/grid section with the new 2-column layout, keep hero copy but retune for ivory (charcoal text, orange accent line stays), keep the existing endorsement explainer + FAQ + FinalCta blocks (they remain dark for section rhythm, same as `/find-a-professional`).

**New**
- `src/components/academy/AcademyFilterRail.tsx` — sticky left rail using shadcn `RadioGroup`, `Checkbox`, `Label`, `Separator`, `ScrollArea`. Groups: Profession, Level, Delivery, CPD points, Ofqual only, Provider.
- `src/components/academy/AcademyFilterSheet.tsx` — mobile wrapper (`Sheet` + trigger button) that reuses `AcademyFilterRail` inside.
- `src/components/academy/CourseRow.tsx` — horizontal card row (replaces `CourseCard`). Mirrors the reference's ResultRow: logo tile (56×56) left, title + provider + meta on the right, endorsement pill top-right, price + "View course →" bottom-right, meta chips row below title, trailing "Trains at / Delivery · Duration" footer line.
- `src/components/academy/AcademySearchBar.tsx` — sticky top bar: shadcn `Input` (with `Search` icon leading), `Sort` `Select`, count label, mobile "Filters" button.

**Delete**
- `src/components/academy/CourseCard.tsx` (replaced by `CourseRow`)
- `src/components/academy/AcademyFilters.tsx` (replaced by rail + sheet + search bar)

## Filter behaviour

- All filter state stays in a single `useState<AcademyFilterState>` in the route (same shape as today, plus a new `ofqualOnly: boolean`).
- Filter rail uses shadcn `RadioGroup` for single-select facets (Profession, Level, Delivery, CPD points), `Checkbox` for Ofqual toggle, `Checkbox` list for Provider (multi-select).
- `AcademyFilterState.provider` becomes `string[]` (mock list from `ACADEMY_PROVIDERS`) instead of a single value.
- Sort options: Recommended (default), CPD points (high→low), Price (low→high), Level (L2→L4).
- Reset button clears everything back to defaults.
- Empty state (shadcn `Empty`) replaces the row list when filtered = 0.

## Shadcn usage (per shadcn skill)

- **Directory search bar** — `Input` inside `InputGroup` with `InputGroupAddon` for the search icon; `Select` for sort; `Sheet` for the mobile filter drawer; `Button` variants for triggers.
- **Filter rail** — `RadioGroup` + `RadioGroupItem` inside `FieldSet` + `FieldLegend` + `FieldGroup`, plus `Checkbox` + `Label`. `ScrollArea` wraps the whole rail on lg+ so long provider lists don't blow the sticky column.
- **Row card** — `Badge` for meta chips, `Separator` for the trailing footer split, shared `EndorsementPill` styled to match reference "REPS VERIFIED" pill (emerald status tokens).
- **Empty state** — `Empty` + `EmptyHeader` + `EmptyTitle` + `EmptyDescription` + `EmptyContent` with a Reset `Button`.
- No `space-y-*` on new markup — `flex flex-col gap-*` only. No hardcoded hex; radii from the locked map only.

## Copy & compliance

- No banned phrases; no "UK" qualifier; no CIMSPA reference.
- Emerald reserved for the endorsement pill (status semantics).
- Ofqual badge kept on cards where `ofqualRegulated: true`.
- Cards link OUT to each provider's course URL (unchanged), `target="_blank" rel="noopener noreferrer"`.
- Nav entry ("For Professionals → Training Academy") unchanged.

## Out of scope

- Backend, real provider data, real URLs, course detail pages, saved / bookmark actions on rows (reference has a bookmark icon — noting deliberately omitted this pass unless you want it added).
- The endorsement explainer, FAQ and FinalCta sections keep their current dark styling for rhythm; only the hero + directory band flip to ivory.

## Verification

- Playwright screenshot at desktop and mobile widths.
- Confirm ivory bg reads with charcoal text; endorsement pill emerald matches the reference "REPS VERIFIED" pill visually.
- Run `bash /tmp/audit.sh` (REPs build-compliance).
