# Expand professions, add delivery modes, replace secondary-professions with curated specialisms

## Final profession list (7) — replaces current 6

REPs scope = Level 2–4 only. Each slug maps to a clean qualification path:

| Slug | Label | Qual |
|---|---|---|
| `personal-trainer` | Personal Trainer | L3 |
| `fitness-instructor` | Fitness Instructor | L2 — **new** |
| `group-fitness-instructor` | Group Fitness Instructor | L2 — **new** |
| `strength-coach` | Strength Coach | L3/L4 |
| `nutritionist` | Nutritionist | L4 |
| `pilates-instructor` | Pilates Instructor | L3 |
| `yoga-teacher` | Yoga Teacher | L3 |

**Removed:** `online-coach` (it's a delivery mode, not a profession).

## Specialisms — curated dropdown, max 3, replaces "secondary professions"

Drop `secondary_professions` entirely. Use the existing `specialisms TEXT[]` column with a curated allow-list (16). Pros pick up to **3** in the dashboard. Already rendered on directory cards and profile.

Canonical list (slug → label):

```
fat-loss              Fat Loss
muscle-gain           Muscle Gain
strength              Strength
hybrid-functional     Hybrid / Functional Fitness
endurance-running     Endurance & Running
sports-performance    Sports Performance
pre-post-natal        Pre & Post-Natal
over-50s              Over-50s
youth                 Youth (under-18s)
rehab-injury          Rehab & Injury
mobility              Mobility
posture-back-pain     Posture & Back Pain
weight-management     Weight Management
habit-lifestyle       Habit & Lifestyle
nutrition-coaching    Nutrition Coaching
online-coaching       Online Coaching
```

## Delivery modes — new field, same pass

Reuse the existing `online_available` + `in_person_available` booleans on `professionals` (already in the schema, already true by default). No new column needed. Surface them in the dashboard as a `ToggleGroup` (multi, min 1): **In person**, **Online**, with a derived "Hybrid" badge on the directory card when both are true.

This is the cleanest path — leverages columns that already exist instead of adding a third array we'd have to keep in sync.

## Database migration

1. **Drop `secondary_professions`** column from `public.professionals`.
2. **Rewrite trigger** `validate_professional_professions`:
   - Allow-list updated to the 7-slug list above (no `online-coach`, adds `fitness-instructor`, `group-fitness-instructor`).
   - Add validation for `specialisms`: every entry must be in the 16-slug allow-list, max 3, no duplicates.
   - Remove all secondary-profession branches.
3. **Data migration (same migration, after schema changes):**
   - `UPDATE professionals SET primary_profession = NULL, is_published = false WHERE primary_profession = 'online-coach'` — forces re-pick; their card disappears until they choose a valid profession. They keep tagline, services, photos.
   - `UPDATE professionals SET specialisms = '{}'` — wipe the 3 existing free-text values so the new validation never fails on legacy data.

Existing `online_available` / `in_person_available` booleans need no migration.

## Code changes

- `src/lib/professions.ts` — replace 6-slug list with 7-slug list above.
- `src/lib/specialisms.ts` — **new** canonical 16-slug list + label helper + `MAX_SPECIALISMS = 3`.
- `src/lib/profile/dashboard-profile.functions.ts`
  - Drop `secondary_professions` from select + Zod schema + return shape.
  - Add `specialisms: z.array(specialismSlugEnum).max(3)` (replaces current free-text `max(20)`).
  - Keep `online_available`, `in_person_available` (already there or add to schema if missing).
- `src/lib/profile/public-profile.functions.ts` — drop `secondary_professions` from select; keep `specialisms`, `online_available`, `in_person_available`.
- `src/lib/profile/profile.functions.ts` — update Zod `specialisms` cap to 3, enum-validated.
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
  - **Remove** secondary-profession picker (the `Badge`-chip "Add secondary" UI from the previous pass).
  - **Replace** with a curated **Specialisms** `ToggleGroup` (multi, max 3) using the 16-slug list. Disable further selection at 3, show "3/3 selected".
  - **Add** delivery-mode `ToggleGroup` (multi, min 1) under Profession: In person / Online → writes to `in_person_available` / `online_available`.
  - Update preview to show: primary profession, specialism chips, delivery hint.
- `src/routes/find-a-professional.tsx`
  - Card already shows specialisms — switch to label-resolved values from canonical map.
  - Append delivery suffix to the profession line: "Personal Trainer · Online & In person" / "· Online" / "· In person".
- `src/routes/pro.$slug.index.tsx`
  - Drop any secondary-profession rendering from the previous pass.
  - Show specialisms (already rendered, just ensure resolved labels).
  - Show delivery modes in the hero meta row.
- `src/integrations/supabase/types.ts` — regenerated after migration runs.

## Out of scope

- Directory filter UI for specialism or delivery mode (data only this pass).
- Profession-based filtering on `/find-a-professional` (still pending from earlier pass).
- Onboarding signup-flow change.
- Editorial pages at `/specialisms` (separate locked page, different concept).

## Brutal-truth recap

Folding secondary-professions into specialisms is the right call — the previous design had two fields doing almost the same job (a "secondary profession" of Strength Coach is functionally identical to a "specialism" of Strength). One curated list, capped at 3, is sharper for the pro, sharper for the searcher, and sharper for SEO. Dropping `online-coach` and using the existing `online_available` boolean closes the loop cleanly without adding a third array to keep in sync.
