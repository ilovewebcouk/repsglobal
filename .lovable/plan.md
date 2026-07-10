## Remove Plan D — Course Assessment Report PDF

Rip out the assessment-report feature entirely so there is no trace of it in code, DB, storage, or dependencies. Keep Plans A + B + C (AI level rationale, deterministic flags, admin UX, provider-side flag surfacing) — those are working and unrelated.

### 1. Delete files

- `src/lib/qualifications/course-report.server.tsx` — remove.
- `src/routes/accreditation-methodology.tsx` — remove (and let `routeTree.gen.ts` regenerate).

### 2. Strip report code from remaining files

- **`src/lib/qualifications/qualifications.functions.ts`**
  - Remove `buildDecisionSnapshot`, `generateAndStoreCourseReport`, `getCourseReportUrl`.
  - Remove the fire-and-forget snapshot/PDF call inside `adminDecideRepsCourse`.
  - Remove any imports of `course-report.server` and `@react-pdf/renderer`.
- **`src/components/admin/verification/AdminProviderQualificationsTab.tsx`**
  - Remove `ReportButton` component and its header slot.
  - Remove any `getCourseReportUrl` import / usage.
- **`src/routes/_authenticated/_professional/dashboard_.qualifications.tsx`**
  - Remove `ReportDownloadButton` and its imports/usage.
  - Keep the reviewer-notes + deterministic-flags inline callouts (Plan C).

### 3. Dependencies

- `bun remove @react-pdf/renderer` (and any transitive-only helpers added just for the PDF, e.g. `@react-pdf/*` peers if present). `package.json` + `bun.lock` regenerate.

### 4. Database migration (new, forward-only)

New migration `drop_course_report_artifacts.sql`:

- `ALTER TABLE public.reps_courses DROP COLUMN IF EXISTS decision_snapshot, DROP COLUMN IF EXISTS report_pdf_path, DROP COLUMN IF EXISTS report_generated_at;`
- Drop RLS policies on `storage.objects` that target the `course-reports` bucket.
- `DELETE FROM storage.objects WHERE bucket_id = 'course-reports';`
- `DELETE FROM storage.buckets WHERE id = 'course-reports';`

Keep the Plan A columns (`official_level_rationale`, `official_level_confidence`, `reviewer_notes`, `ai_deterministic_flags`) — those power the admin UI and provider callouts.

### 5. Types

- After migration runs, `src/integrations/supabase/types.ts` regenerates and loses the three report columns automatically. No manual edit.

### 6. Verification

- Typecheck passes with no dangling imports.
- `rg "course-report|CourseAssessmentReport|report_pdf_path|report_generated_at|decision_snapshot|accreditation-methodology|@react-pdf"` returns no hits outside the new migration file.
- Admin detail pane and provider dashboard load without the report button.

### Out of scope

- Any change to Plans A, B, C behaviour.
- The public `/accreditation-methodology` idea (gone with the file — can revisit later if needed).

Approve and I'll ship the removal in this order: migration first (drops columns + bucket), then code deletion + edits, then `bun remove`.
