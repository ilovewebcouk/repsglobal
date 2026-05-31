## Goal
Bring your originally-uploaded REPs documents into the repo at `docs/`, then update them in place so they match the final approved source of truth. The structure, voice, headings and content of your originals are preserved — only conflicting tokens, radius rules, mock-up filenames and naming inconsistencies are rewritten.

## Source documents (already on disk at `/tmp/repsdocs/`)

1. `01_reps_master_product_scope.md`
2. `02_reps_visual_design_system.md`
3. `03_reps_page_by_page_specification.md`
4. `04_database_schema_and_data_model.md`
5. `reps_global_platform_mock_up_lock_source_of_truth.md`
6. `reps_lovable_build_prompt_pack.md`

(`__MACOSX` is skipped.)

## Destination

```
docs/
  00_README.md                                    new — index + override clause
  01_reps_master_product_scope.md                 copied + synced
  02_reps_visual_design_system.md                 copied + synced
  03_reps_page_by_page_specification.md           copied + synced
  04_database_schema_and_data_model.md            copied + synced
  05_reps_mockup_lock_source_of_truth.md          copied (renamed for ordering) + synced
  06_reps_lovable_build_prompt_pack.md            copied (renamed for ordering) + synced
```

## Sync rules applied to every file (only where conflicts exist)

- Replace `#F28C38` (and any `#D87322` pair) with the final orange set: `#FF7A00 / #E96F00 / #CC6200 / rgba(255,122,0,.12) / rgba(255,122,0,.35)`.
- Replace any old radius guidance (`--radius-2xl: 32px`, `--reps-radius-button: 14px`, `--reps-radius-card: 22px` as button/card defaults, `--reps-radius-panel: 28px`, `rounded-[14px]`, `rounded-[28px]`, `rounded-[32px]`, `rounded-xl/2xl/3xl`) with the final scale and component mapping (`xs 6 / sm 8 / button 10 / input 12 / card 16 / card-lg 18 / panel 22 / hero 24 / pill 999`).
- Demote the six older 16:9 filenames (`home_v1.png`, `dashboard_v1.png`, `reps_directory_search_results_page.png`, `profile_of_fitness_professional_james_carter.png`, `fitness_professional_sign_up_page_mockup.png`, `platform_overview_dashboard_with_analytics.png`) to an "Archived references — must not drive the build" list. Promote the six `reps_fullpage_*_v1.png` files as the sole build references.
- Normalise product name to **REPs**. Keep "REPs UK" only where it refers to legacy data / current domain / Brilliant Directories migration.
- Reaffirm Phase 1 = static visual screens only. No auth, DB, payments, bookings, AI, live maps, BD migration in Phase 1.
- In `04_database_schema_and_data_model.md`, prepend a clear "Deferred to post-Phase-1 — not implemented during the static-screens phase" note; do not change schema content.
- Insert the override clause near the top of every doc:
  *"The approved full-page mock-ups override any earlier written radius, colour or layout guidance where there is a conflict."*

## What I will NOT touch

- Routes, components, `src/styles.css`, mock-up assets, `routeTree.gen.ts`.
- Schema field names, table names, or relationships — only the deferred-phase note is added.
- Typography, spacing, content hierarchy, visual direction.
- The originals' voice / structure — edits are surgical replacements at conflict points only.

## Change report (delivered after writes)

1. Documents checked: the 6 originals in `/tmp/repsdocs/`, plus in-repo `.lovable/plan.md`, `src/routes/README.md`, `mem://index.md`, `mem://design/source-of-truth`, `src/styles.css`.
2. Documents created/updated under `docs/`: the 7 files above.
3. Replacements made: per-file diff list of every `#F28C38` → `#FF7A00`, every retired radius token, every demoted 16:9 filename, every `REPs UK` → `REPs` correction.
4. Remaining conflicts: any items I could not auto-resolve (e.g. radius rules expressed only as prose) will be flagged for your review.
5. Confirmation that `docs/` + `mem://` + `src/styles.css` + `.lovable/plan.md` all state the same final orange, radius and mock-up lock.
