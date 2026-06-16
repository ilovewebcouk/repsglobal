## Goal
Rebuild the mobile (≤ md) results header on `/find-a-professional` to match the chosen "Modern professional" direction. Desktop layout stays untouched.

## Target structure (mobile only)
Stacked, in this order, edge-to-edge inside the existing dark chrome:

1. **Dark search block** (`bg-reps-bg-deep`, p-4 pb-6)
   - Two stacked inputs (full-width, dark `bg-zinc-800/reps-panel`, rounded-12, 44px tap target)
   - Row 1: search term — magnifier icon left
   - Row 2: location — pin icon left
   - Brand orange focus ring (not teal — swap `#00A88F` → existing `--reps-orange` token)
2. **Filters / Sort split bar** (white-on-dark inverted: keep dark bg with `border-t border-white/10`)
   - Two equal-width buttons separated by a 1px vertical divider
   - "Filters" with sliders icon + count badge when active
   - "Sort: Nearest" with sort icon (label reflects current sort)
3. **Active filter chips row** — horizontal scroll, orange-tinted pills with `×`, includes Verified-only when on
4. **Result count strip** — `text-[11px] uppercase tracking-wider` "{N} results found" + subtle separator

## Scope
- Only `/find-a-professional` mobile breakpoint (`md:hidden` block; existing `md:` layout untouched)
- Reuse existing handlers, URL state, sort options, Verified toggle, filter sheet — purely a presentational restructure
- Tokens only — map prototype's teal `#00A88F` to brand orange; use `reps-panel`, `reps-border`, `reps-bg-deep` from `src/styles.css`
- Radii per system: input 12px, pill full, buttons 10px
- Use shadcn primitives: `Input`, `Button`, `Badge`, `Separator`, `ScrollArea` for chip rail

## Files to touch
- `src/routes/find-a-professional.tsx` — render new `<ResultsHeaderMobile />` inside the existing mobile branch; keep desktop branch as-is
- `src/components/directory/ResultsSearchBar.tsx` — extract/add mobile variant OR
- New: `src/components/directory/ResultsHeaderMobile.tsx` (preferred — keeps the desktop component clean)

## Out of scope
- Desktop header
- Result cards
- Filter sheet contents
- Any business logic / data wiring

## Verification
- Screenshot at 375×812 after build
- Confirm: 3-stack collapse → 1 search block + 1 split bar + 1 chip row + 1 count strip; Verified chip appears when `?verified=1`; Sort label updates with URL sort param