# Profession-scoped specialisms

Replace the flat 16-slug specialism list with a profession-scoped catalogue. Each profession unlocks its own dedicated list. Max-3 stays. Online/in-person/hybrid stays out (already covered by the delivery section on the profile).

---

## 1. New taxonomy (single source of truth)

**`src/lib/specialisms.ts`** is rewritten:

- Drop the flat `SPECIALISMS` array.
- Export `SPECIALISMS_BY_PROFESSION: Record<ProfessionSlug, Specialism[]>`.
- Each `Specialism` = `{ slug, label, professions: ProfessionSlug[] }`. A slug listed under more than one profession is intentional (e.g. `pre-post-natal` for PT + Pilates + Yoga).
- Derive a flat `ALL_SPECIALISM_SLUGS` for the DB trigger allow-list (union of every list).
- Helpers: `getSpecialismsForProfession(slug)`, `getSpecialismLabel(slug)`, `isSpecialismValidForProfession(spec, prof)`, `isSpecialismSlug(s)`.

### Proposed lists (expanded, all editable later)

**Personal Trainer** — `fat-loss`, `muscle-gain`, `strength-training`, `functional-fitness`, `hybrid-training`, `endurance-running`, `triathlon-prep`, `hyrox-prep`, `marathon-prep`, `body-recomposition`, `pre-post-natal`, `menopause`, `over-50s`, `youth-training`, `rehab-return-to-training`, `mobility`, `posture-back-pain`, `weight-management`, `habit-lifestyle`, `home-gym-coaching`, `corporate-wellness`, `online-coaching`

**Group Fitness Instructor** — `indoor-cycling-spin`, `bodypump-barbell`, `hiit`, `bootcamp`, `circuits`, `les-mills-bodycombat`, `les-mills-bodyattack`, `les-mills-bodybalance`, `les-mills-grit`, `step`, `aqua-aerobics`, `dance-fitness-zumba`, `kettlebells-class`, `barre`, `senior-fitness-class`, `chair-based-class`, `box-fit`, `metcon-class`, `mobility-class`, `pre-post-natal-class`

**Strength Coach** — `powerlifting`, `olympic-weightlifting`, `hypertrophy`, `athletic-performance`, `speed-power`, `return-to-sport`, `youth-athlete-development`, `tactical-first-responder`, `combat-sports-sc`, `endurance-athlete-sc`, `team-sport-sc`, `field-sport-sc`, `court-sport-sc`, `rugby-sc`, `football-sc`, `running-sc`, `cycling-sc`, `masters-athlete`, `pre-post-natal-strength`, `competition-prep`

**Pilates Instructor** — `mat-pilates`, `reformer-pilates`, `clinical-rehab-pilates`, `pre-post-natal-pilates`, `over-50s-pilates`, `back-care`, `contemporary-pilates`, `classical-pilates`, `pilates-for-runners`, `pilates-for-athletes`, `chair-pilates`, `cadillac-tower`, `barre-pilates`, `mens-pilates`, `youth-pilates`, `pelvic-floor-pilates`

**Yoga Teacher** — `vinyasa-flow`, `hatha`, `yin`, `ashtanga`, `iyengar`, `kundalini`, `restorative`, `pregnancy-yoga`, `postnatal-yoga`, `yoga-for-back-pain`, `meditation-breathwork`, `power-yoga`, `rocket-yoga`, `hot-yoga`, `chair-yoga`, `yoga-for-athletes`, `yoga-for-runners`, `kids-yoga`, `mens-yoga`, `trauma-informed-yoga`, `yoga-nidra`, `sound-healing`

**Nutritionist** — `weight-management`, `sports-nutrition`, `endurance-nutrition`, `physique-nutrition`, `gut-health`, `plant-based`, `female-hormones`, `menopause-nutrition`, `pre-post-natal-nutrition`, `clinical-conditions`, `diabetes-prediabetes`, `cardiovascular-nutrition`, `habit-behaviour-change`, `intuitive-eating`, `disordered-eating-recovery`, `child-family-nutrition`, `youth-athlete-nutrition`, `vegan-vegetarian`, `corporate-nutrition`, `online-nutrition-coaching`

**Fitness Instructor** — `gym-floor-instruction`, `inductions-programme-cards`, `circuits`, `older-adults`, `youth-gym`, `functional-zone`, `accessible-inclusive-fitness`, `gp-referral`, `cardio-machines-coaching`, `resistance-machines-coaching`, `free-weights-intro`, `studio-cycling-intro`, `corporate-gym-floor`

(Final wording can be tweaked freely later — only slugs are load-bearing.)

---

## 2. DB trigger allow-list

Single migration that replaces the hard-coded 16-slug `allowed_spec` array inside `validate_professional_professions()` with the new union (≈110 slugs). Trigger still enforces: max 3, uniqueness, valid profession. Pairing rule (spec must be valid for the pro's profession) is enforced in app code — keeps the trigger simple and avoids cross-table lookups.

No schema columns change. No new tables.

---

## 3. Auto-map existing data

Same migration runs a one-off UPDATE that rewrites each pro's `specialisms` array based on `primary_profession` using this lookup:

| old slug | PT | Group Fit | Strength | Pilates | Yoga | Nutritionist | Fitness Inst |
|---|---|---|---|---|---|---|---|
| `fat-loss` | `fat-loss` | drop | drop | drop | drop | `weight-management` | drop |
| `muscle-gain` | `muscle-gain` | drop | `hypertrophy` | drop | drop | drop | drop |
| `strength` | `strength-training` | drop | `powerlifting` | drop | drop | drop | drop |
| `hybrid-functional` | `hybrid-training` | `circuits` | drop | drop | drop | drop | `functional-zone` |
| `endurance-running` | `endurance-running` | drop | `endurance-athlete-sc` | `pilates-for-runners` | `yoga-for-runners` | `endurance-nutrition` | drop |
| `sports-performance` | drop | drop | `athletic-performance` | `pilates-for-athletes` | `yoga-for-athletes` | `sports-nutrition` | drop |
| `pre-post-natal` | `pre-post-natal` | `pre-post-natal-class` | `pre-post-natal-strength` | `pre-post-natal-pilates` | `pregnancy-yoga` | `pre-post-natal-nutrition` | drop |
| `over-50s` | `over-50s` | `senior-fitness-class` | `masters-athlete` | `over-50s-pilates` | `chair-yoga` | drop | `older-adults` |
| `youth` | `youth-training` | drop | `youth-athlete-development` | `youth-pilates` | `kids-yoga` | `child-family-nutrition` | `youth-gym` |
| `rehab-injury` | `rehab-return-to-training` | drop | `return-to-sport` | `clinical-rehab-pilates` | `yoga-for-back-pain` | drop | `gp-referral` |
| `mobility` | `mobility` | `mobility-class` | drop | `mat-pilates` | `yin` | drop | drop |
| `posture-back-pain` | `posture-back-pain` | drop | drop | `back-care` | `yoga-for-back-pain` | drop | drop |
| `weight-management` | `weight-management` | drop | drop | drop | drop | `weight-management` | drop |
| `habit-lifestyle` | `habit-lifestyle` | drop | drop | drop | drop | `habit-behaviour-change` | drop |
| `nutrition-coaching` | drop | drop | drop | drop | drop | `online-nutrition-coaching` | drop |
| `online-coaching` | `online-coaching` | drop | drop | drop | drop | `online-nutrition-coaching` | drop |

Dedupe, cap at 3, write back. Pros with no `primary_profession` keep the empty array (their old values are dropped since they can't be validated against any profession). One-time banner on `/dashboard/profile`: "We've updated specialisms to match your profession — review your picks." Banner dismisses on next save.

---

## 4. Profile picker

**`src/components/profile/SpecialismsPicker.tsx`**
- New required prop `profession: ProfessionSlug | null`.
- When `null` → empty state: "Set your profession above to unlock specialisms."
- When set → render `getSpecialismsForProfession(profession)` grouped as a single chip grid (no categories — the list is the category).
- Max-3 cap unchanged. Disabled state on chips when at max.

**`src/routes/_authenticated/_professional/dashboard_.profile.tsx`**
- Pass `form.primary_profession` to `<SpecialismsPicker />`.
- On profession change in the same form, drop any selected specialism not valid for the new profession (defensive, with a toast: "Specialisms cleared — pick new ones for {profession label}").
- On save, the same filter runs as a belt-and-braces step.
- Section "05 Specialisms" copy updated: "Specialisms are unlocked by your profession (section above)."

**`verification.functions.ts` auto-merge** — one filter line added: drop any `derived_specialism_slugs` that aren't in `getSpecialismsForProfession(primary_profession)` before merging into `professionals.specialisms`. Keyword rules in `title-rules.ts` left alone.

---

## 5. Landing-page chips (`/professions/$profession`)

- Delete every hand-written `specialisms: string[]` from `ProfessionMeta` in `src/routes/professions.$profession.tsx`.
- New server function `getPopularSpecialismsForProfession({ profession })` in `src/lib/directory/popular.functions.ts`:
  - Public read-only, uses a server publishable Supabase client (no auth).
  - Query: `professionals` where `primary_profession = ?` AND `is_published = true` AND `verification = 'verified'`, unnest `specialisms`, count desc, limit 8.
  - Fallback: if fewer than 4 rows, pad from `getSpecialismsForProfession(profession)`.
- Page calls it with `useQuery` (staleTime 60s) and renders 6–8 chips.
- Fix chip `<Link>` to actually filter: `search={{ profession, specialism: chip.slug, page: 1, sort: 'recommended' }}` (today it links with no params).

---

## 6. Search UI narrowing

- `src/lib/search/taxonomy.ts` — rebuild `SEARCH_ENTRIES` from `SPECIALISMS_BY_PROFESSION` (each entry carries its `professions: ProfessionSlug[]`). `searchTaxonomy(q, { profession })` filters specialism entries by that list when a profession is passed.
- `src/components/search/InlineHeroSearch.tsx` — forward `lockedProfession` to `searchTaxonomy`.
- `src/components/directory/ResultsSearchBar.tsx` — when a `profession` filter is active, narrow the "Goals & specialisms" combobox to valid options; when user switches profession and current `specialism` is now invalid, drop it from the URL.
- `src/lib/directory/search.functions.ts` — unchanged. Server still accepts any pair; UI just can't generate invalid ones.

---

## Out of scope

- `/specialisms.tsx` (profession-archetype marketing page — separate data structure, untouched).
- `/in/$location.tsx` (no specialism chips).
- DB-level pairing enforcement (would need a lookup table; app-code enforcement is enough for v1).
- Renaming/reordering the new slugs after this lands (cheap follow-up edits to `specialisms.ts`).

## Verification

- Build passes; trigger migration runs cleanly; auto-map UPDATE leaves every pro with ≤3 valid slugs.
- PT picker shows ~22 PT-specific options; Pilates picker shows ~16 Pilates options; no overlap with Strength Coach list except where intentional (e.g. `pre-post-natal-*` variants).
- `/professions/group-fitness-instructor` shows top class formats (e.g. Spin, BodyPump) ranked by verified GFI count.
- Clicking a chip on `/professions/strength-coach` lands on `/find-a-professional?profession=strength-coach&specialism=powerlifting&sort=recommended` and returns matching pros.
- Switching profession in the results bar drops a now-invalid `specialism` from the URL.
- Existing pro with old `strength` + `pre-post-natal` + `mobility` and `primary_profession = pilates-instructor` becomes `mat-pilates` (from `mobility`) + `pre-post-natal-pilates` after migration (capped at 3, dedup'd).