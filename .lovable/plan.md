# /in/$city — Unify + QA + Lock

Bring `/in/$location` up to parity with the locked `/professions/$profession` page, run the same QA pass, then formally lock it.

## Scope

Page: `src/routes/in.$location.tsx` (489 lines). All 4 mapped slugs verified: `london`, `manchester`, `birmingham`, `edinburgh`, plus the fallback path.

## Changes

### 1. Swap card system → vertical FeaturedCard
- Replace the horizontal `LocationCard` (140px image left, no tags) with the same vertical `FeaturedCard` pattern used on `/professions/$profession`: image-top (h-44), Verified pill top-left, Save Tooltip top-right, name + role + rating row, city + mode row, 2 tag chips, full-width "View Profile" CTA.
- Grid: `sm:grid-cols-2 lg:grid-cols-4` (matches professions).
- Add `tags` and `city` (= area) to the `Pro` type. Featured pros already have `tags` arrays — wire them in.

### 2. Add missing structural sections (to mirror professions)
Insert after the Featured grid, before footer:

- **FAQ** — shadcn `Accordion` (`type="single"`, collapsible) inside an `rounded-[18px]` border panel. 5 city-flavoured Qs: how verification works, in-person vs online, pricing range in {city}, what to ask on first session, how to report a concern.
- **Related cities** — pill row identical to professions' "Related professions": `Link` chips to the other 3 cities in `LOCATIONS`, `rounded-full border` style.

Keep existing sections in this order: Breadcrumb → Hero + at-a-glance → By profession → Featured → Areas → FAQ (new) → Trust band → Related cities (new) → Footer.

### 3. Global-platform copy sweep
- `region:` strings: drop country qualifier. `"Greater London, England"` → `"Greater London"`; `"West Midlands, England"` → `"West Midlands"`; `"Scotland"` → keep (it's a region, not a country qualifier on a place name) but verify reads naturally; or drop to just the city tagline.
- Hero blurbs: remove any "UK"/"United Kingdom" if present (audit confirms none currently, but re-check after edits).
- Fallback blurb stays neutral.

### 4. Radius + shadcn audit
- Confirm every radius is on the 9-step scale (no `rounded-xl/2xl/3xl`, no 14/20/28/32px).
- Bookmark button → wrap in `Tooltip` (already done on FeaturedCard pattern — inherited via card swap).
- Search input row: already `rounded-[18px]` panel + `rounded-[12px]` inputs + `rounded-[10px]` button ✓.
- Trust band: matches professions ✓.
- No `space-y-*` introduced; use `flex flex-col gap-*` or `mt-*` like professions does.
- Icons in buttons: `data-icon` where applicable.

### 5. Counts honesty
Leave the static counts as-is (Phase 1 placeholder data, consistent with professions which does the same). No changes needed — flagged for transparency only.

### 6. QA pass
- Visual + copy QA on all 4 mapped slugs (`/in/london`, `/in/manchester`, `/in/birmingham`, `/in/edinburgh`) + fallback (`/in/leeds`).
- Verify desktop (1366) and mobile (390) layouts.
- Run the `reps-build-compliance` audit script — must exit 0.

### 7. Lock
- Create `mem://design/locked-cities` memory file with the layout contract.
- Add Core entry to `mem://index.md`: "City landing pages `/in/$location` are LOCKED — see `mem://design/locked-cities`."
- Update `docs/07_phase1_build_status.md`: flip `/in/$location` row to **Locked — Phase 1 approved** with QA notes, add a 2026-06-05 lock log entry.

## Out of scope (Phase 1 boundary)

No real search/filter logic, no DB-backed counts, no map embed, no auth — purely static high-fidelity screen work, consistent with the locked professions and homepage passes.

## Technical notes

- Extract `FeaturedCard` into `src/components/public/FeaturedProCard.tsx` so both `professions.$profession.tsx` and `in.$location.tsx` can import the same component. This removes duplication and means future card tweaks land in one place. (Light, surgical refactor — does not redesign the locked professions page, just deduplicates its card.)
- Featured pros stay local to each route (different fixture arrays).
- Use shadcn `Accordion` (already used on professions page) for the FAQ.

Files touched:
- `src/routes/in.$location.tsx` — card swap, new sections, copy sweep
- `src/components/public/FeaturedProCard.tsx` — new shared card
- `src/routes/professions.$profession.tsx` — replace inline `FeaturedCard` with shared import
- `mem://design/locked-cities` — new
- `mem://index.md` — add Core entry
- `docs/07_phase1_build_status.md` — lock log
