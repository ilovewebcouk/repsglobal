# Qualifications & Courses — unified public list

## Public page (`src/routes/t.$slug.index.tsx`)

Replace the two-subsection "Accreditations & Recognition" block with a single unified list.

1. **Rename the section**
   - `<h2>` → **"Qualifications & Courses"**
   - Intro copy → "Regulated qualifications this provider is approved to deliver and courses REPS has independently accredited. Each carries its own verifiable ID number."
   - Sub-nav label (line 913): `"Accreditations & CPD"` → **"Qualifications & Courses"**
   - Section `id="accreditations"` stays (avoids breaking anchor links); scroll-mt kept.

2. **Merge into one list**
   - Remove the two separate `<h3>` blocks ("Ofqual-regulated qualifications" / "REPS-accredited CPD courses") and the `border-t` divider between them.
   - Build one flat array `allQualifications` combining:
     - Ofqual items (from `accreditationsByBody` groups) — carry awarding body name + logo + Ofqual ref + REPS ref.
     - REPS-accredited items (from `cpdRows`) — carry REPS logo + REPS ref (no Ofqual pill).
   - **Sort by level DESC** (Level 5 → Level 2), then by title. Items with no level fall to the bottom.
   - Render each row using the existing Ofqual row layout (logo tile + level chip + title + pills). The awarding body logo tile shows the REPS wordmark logo for REPS-accredited items, or the awarding body's logo for Ofqual items.
   - Pills per row:
     - Ofqual items: green `OFQUAL <ref>` pill + green `REPS <ref>` pill (existing 4-digit format).
     - REPS-accredited items: green `REPS <ref>` pill only.
   - Approved-centre badge on the section header: show when *any* Ofqual item exists (unchanged logic, moved to the section H2 right-side slot).

3. **Empty states**
   - If the combined list is empty → single `EmptyBlock` "No qualifications yet" / "Once REPS verifies this provider's qualifications and courses, they'll appear here."
   - Remove the two separate empty states.

## Language cleanup — drop "CPD" from public-facing surfaces

Use a background sub-agent to enumerate every "CPD" / "REPS-accredited CPD" / "REPS CPD" string across the codebase and classify each as:
- **Public/provider-facing** (public profile, marketing, provider dashboard tabs shown to admins/providers) → rename to "REPS-accredited course" / "REPS accredited".
- **Trainer CPD tracking feature** (`dashboard_.cpd.tsx`, EarnedTitles, CertificateCard) → out of scope; this is a separate feature (individual trainers logging CPD).

Sub-agent deliverable: a table of file:line → current string → proposed replacement, split public vs trainer-CPD. Then I apply the public ones.

Known locations to change (starting list, sub-agent will complete):
- `src/routes/t.$slug.index.tsx` line 425 "CPD tracking" card title, line 468 comment, lines 616–673 subsection, line 913 sub-nav label, line 530 intro.
- Provider back-end pages (public labels/copy) — sub-agent finds them.
- Public REPS-CPD number pill label: `REPS CPD` → `REPS`.

## Provider back-end — leave upload tabs separate

Per the request: two upload tabs stay, because evidence requirements differ:
- **Ofqual-regulated** tab: EQA report / certificate / letter.
- **REPS-accredited** tab (rename from "REPS CPD"): CV, syllabus, assessment criteria.

Only rename the tab label + any "CPD" wording inside it; do not merge the tabs, do not change the upload schemas or storage.

## Out of scope
- Trainer-facing CPD tracking (`/dashboard/cpd`) — different feature, keep as-is.
- Database schema changes (no rename of `cpd_courses` table; only UI wording).
- Ordering rules beyond "level DESC, title ASC".

## Technical notes
- Combined sort: parse `it.level` as integer where possible; strings like "Level 5" or `5` both accepted. Nulls last.
- REPS logo for the tile: use `src/assets/brand/logo.svg` (already in project).
- Keep all existing tokens/radii (rounded-[22px] card, rounded-[10px] logo tile, emerald pill triplet).
- No DB migration.
