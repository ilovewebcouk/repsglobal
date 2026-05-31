## Goal
Apply the corrected REPs radius system across tokens, components, and docs.

## Token scale (src/styles.css)
xs 6 / sm 8 / button 10 / input 12 / card 16 / card-lg 18 / panel 22 / hero 24 / pill full.
shadcn aliases remapped, default `--radius: 12px`. `--radius-3xl/4xl` recycled to 22/24.

## Component rules
- Buttons & filter chips → `rounded-[10px]`
- Inputs / selects / dropdowns / in-card thumbs → `rounded-[12px]`
- KPI/admin/standard dashboard cards → `rounded-[16px]`
- Directory/profile/service/featured pro cards → `rounded-[18px]`
- AI insight / search panel / signup card / large dashboard panel → `rounded-[22px]`
- Hero image panels → `rounded-[24px]`
- Badges / pills / avatars / icon circles → `rounded-full`
- Checkbox → `rounded-[6px]`

## Files touched
- `src/styles.css` — tokens + default radius
- `src/components/public/PublicHeader.tsx` — header buttons 12→10
- `src/routes/index.tsx` — CTA/buttons 12/14→10, stats panel 20→22, featured card 22→18, SearchField 14→12
- `src/routes/find-a-professional.tsx` — search/filters panels 20→22, hero search button 14→10, featured pro 20→18, SearchField 14→12, checkbox 4→6
- `src/routes/__root.tsx` — error/notfound buttons `rounded-md`→10
- `mem://design/source-of-truth`, `mem://index.md` — updated radius rules

## Out of scope
Colors, typography, spacing, content, routes, functionality. No UI redesign.
