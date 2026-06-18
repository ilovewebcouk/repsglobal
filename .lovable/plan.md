### Problem
The role label under each Featured card on `/in/$location` and `/professions/$profession` falls back to "Professional" because the local `PROFESSION_LABEL` / `PROFESSION_ROLE_LABEL` maps in each route are stale. They include legacy slugs (`online-coach`, `group-exercise-instructor`) and miss the canonical ones in `src/lib/professions.ts` — notably `fitness-instructor` and `group-fitness-instructor`. Any pro whose `primary_profession` is one of those (or any future slug) renders as the generic "Professional".

### Fix
Use the single source of truth — `getProfessionLabel` from `src/lib/professions.ts` — instead of the local maps.

1. **`src/routes/in.$location.tsx`**
   - Import `getProfessionLabel` from `@/lib/professions`.
   - Delete the local `PROFESSION_LABEL` constant (lines 33-41).
   - In `rowToFeaturedPro` and `featuredRowToFeaturedPro`, replace the `role` line with:
     `const role = getProfessionLabel(r.primary_profession) ?? "Personal Trainer";`
     (Personal Trainer is the safest default for the city directory; "Professional" only appears if the slug is genuinely unknown — which it won't be once the canonical map is used.)

2. **`src/routes/professions.$profession.tsx`**
   - Same swap: import `getProfessionLabel`, delete local `PROFESSION_ROLE_LABEL` (lines 40-48), and use `getProfessionLabel(r.primary_profession) ?? meta.label` so the fallback is the current profession page's own label (e.g. "Fitness Instructor" on `/professions/fitness-instructor`).

### Out of scope
- No card UI changes (no monogram, no "New on REPs", no quality-score gate, no Verified-badge logic) — explicitly per your message.
- No backend changes.
- Backfill rules in `featured.functions.ts` stay as-is.

### Verification
Reload `/in/london` and `/professions/fitness-instructor`; every Featured card should show a real role (Personal Trainer, Fitness Instructor, etc.) instead of "Professional".