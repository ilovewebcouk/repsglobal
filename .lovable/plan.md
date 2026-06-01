# Doc update pass — sync specs + add build status

Two parallel workstreams over the `docs/` folder. No code/route changes.

## 1. Sync existing specs (doc-sync skill)

Run the `doc-sync-source-of-truth` audit across `docs/**/*.md`, root `*.md`, and `.lovable/plan.md`. Apply the standard replacement matrix:

- `#F28C38` → `#FF7A00`, `#D87322` → `#E96F00` / `#CC6200`
- Banned radii (`14/20/28/32px`, `rounded-xl/2xl/3xl`) → 9-step scale (6/8/10/12/16/18/22/24/999)
- Archived mock-up filenames → `reps_fullpage_*_v1.png` (the 6 locked names)
- "REPs UK" → "REPs" (outside legacy/migration context)
- Gold/yellow rating stars → brand orange
- Button shadow guidance → "flat — `shadow-none` only"

Then reconcile **scope drift** in `03_reps_page_by_page_specification.md` and `06_reps_lovable_build_prompt_pack.md` against what actually shipped:

- Signup card style + removed "I am a" picker
- Student membership removed from pricing
- Resources hub (`/resources` + `/resources/$slug`) replaces any earlier "Blog" or "Resources" placeholder language
- Any other contradictions surfaced by the audit (flagged, not silently rewritten)

Voice and structure preserved. Replace values, not paragraphs. Anything ambiguous goes under "Remaining conflicts" in the report — not auto-resolved.

## 2. New file: `docs/07_phase1_build_status.md`

Single page, grouped by surface, derived from `src/routes/` (~80 route files). Each row: route → state (Shipped / Partial / Not started) → notes.

Sections:

- **Public marketing** — `/`, `/about`, `/how-it-works`, `/for-professionals`, `/pricing`, `/find-a-professional`, `/in/$location`, `/professions/$profession`, `/specialisms`, `/standards`, `/cpd`, `/business-tools`, `/help`, `/faq`, `/contact`, `/complaints`, `/press`, `/careers`, `/reviews`, `/terms`, `/privacy`, `/cookies`
- **Resources** — `/resources`, `/resources/$slug`
- **Professional profile** — `/pro/$slug`, `/pro/$slug/enquire`
- **Auth** — `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/verify`, `/verify-email`, `/accept-invite`, `/unsubscribe`
- **Professional dashboard** — every `dashboard_.*` route
- **Client portal** — every `portal_.*` route
- **Admin** — every `admin_.*` route

Plus three short closing sections:

- **Phase 1 deferred** — auth wiring, RLS, DB, payments, bookings, AI, live maps, real search/filter logic, BD migration (per the locked Phase 1 scope)
- **Known visual debt** — any open items the compliance audit currently flags
- **Phase 2 candidates** — Resources CMS, real search, etc.

Status is judged by what each route file actually renders (static high-fidelity vs placeholder vs missing), not by feature completeness — consistent with Phase 1 = static screens only.

## 3. Index update

Add a one-liner to `docs/00_README.md` pointing to `07_phase1_build_status.md` so it's discoverable.

## Out of scope (explicit)

- No route additions, deletions, renames
- No component edits
- No memory file changes (Core rules already match the locked system)
- No new specs invented — gaps surface as "Remaining conflicts" in the report, not new docs

## Deliverable

Doc-sync change report in the standard 5-section format (Documents checked / updated / replacements / remaining conflicts / confirmation), plus a link to the new `07_phase1_build_status.md`.
