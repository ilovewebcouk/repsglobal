# REPS Accreditation — QLS-style rework

Reshape the "Request REPS accreditation" flow so providers submit their own words + real evidence, and AI only assists admin reviewers (internal, no public spec produced).

## 1. Provider-facing modal (`dashboard_.qualifications.tsx`)

**Remove entirely:**
- "✨ Expand with AI" button on every field
- The green "What AI drafts from your answers" callout at the top of the modal
- The `handleExpand` server-fn call and its usage tracking
- The "REPS AI is drafting your accreditation spec" toast — replace with "Submitted for REPS admin review."

**Rewrite the intro copy:**
> Submit your course for REPS accreditation. Answer in your own words and upload the supporting evidence below. A REPS admin will review your submission and confirm the level, official title and REPS-QUAL number. We do not rewrite your course — we verify it.

**Replace free-text "What the course covers" with a Modules repeater:**
- Each module row: `title` (required) + `summary` (1-line, required) + `learning_hours` (optional)
- "+ Add module" button appends a new empty row
- Minimum 1 module, no upper cap
- Stored as `spec_modules jsonb` on `reps_courses` (new column — see §4)

**Keep as plain textareas (no AI helper):**
- Working title
- Who this course is for
- What learners will be able to do afterwards
- How it's delivered (radio — unchanged)
- Prerequisites, Total hours, Assessment, Tutor credentials, Extra notes (unchanged)

## 2. Required evidence uploads (Core 4)

New "Evidence" section at the bottom of the modal, above Submit. All four required before submit is enabled:

| Slot | `file_kind` | Accepts |
|---|---|---|
| Course specification / syllabus | `specification` | PDF, DOCX |
| Sample learning materials (1–2 modules) | `sample_materials` | PDF, DOCX, PPTX, MP4, ZIP |
| Assessment plan + sample assessment | `assessment` | PDF, DOCX |
| Lead tutor CV | `tutor_cv` | PDF, DOCX |

- Uploads go to existing `course-accreditation` storage bucket (or create one — see §4)
- Recorded in existing `course_accreditation_files` table (already has `file_kind` column — reuse it)
- Multiple files allowed per slot; each slot needs at least one file
- Show filename + size + remove button per uploaded file
- 25 MB per file cap, client-side check

Submit button disabled until: required text fields filled + ≥1 module + all 4 evidence slots populated.

## 3. Admin review (internal only, no public spec)

Admin qualifications review UI (`AdminProviderQualificationsTab.tsx`) gains:

- **Evidence panel** — lists all uploaded files grouped by `file_kind`, each with a signed-URL "Open" link
- **AI assist button (admin-only)** — "Analyse submission with AI". Calls a new authenticated server fn `analyseAccreditationSubmission` that:
  - Reads the intake answers + module list
  - Extracts text from the uploaded specification + assessment PDFs (server-side, pdf-parse on worker)
  - Returns an internal reviewer aide: suggested level (1–7) + rationale, module-vs-spec consistency check, Bloom's-verb check on outcomes, red flags (missing GLH, mismatched level claims, tutor CV level vs course level)
  - Persists to existing `ai_draft` / `ai_red_flags` / `ai_deterministic_flags` columns
- **AI output is admin-only**, rendered in a collapsed "Reviewer aide" panel. Not exposed to provider. Not published.
- Admin still manually sets `official_title`, `official_level`, `reps_qual_number` and clicks Approve — AI never auto-approves.
- Drop the "public spec" (`spec_who_for`, `spec_learning_outcomes`, etc.) publishing step. What's shown publicly on the course tile stays limited to: title, level, provider, module list, hours, delivery mode.

## 4. Database (one migration)

```sql
alter table public.reps_courses
  add column if not exists spec_modules jsonb;  -- [{title, summary, hours}]

-- course_accreditation_files already exists with file_kind — no schema change
-- Add a CHECK-style trigger (not CHECK constraint) if we want to enforce known kinds:
--   'specification' | 'sample_materials' | 'assessment' | 'tutor_cv' | 'other'
```

Storage: reuse existing `course-accreditation` bucket if present; otherwise create private bucket with RLS scoping files to `provider_id`'s owner + admins.

## 5. Files touched

- `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` — strip AI, add modules repeater, add evidence uploader
- `src/components/admin/verification/AdminProviderQualificationsTab.tsx` — evidence panel + reviewer-aide panel + Analyse button
- `src/lib/qualifications/qualifications.functions.ts` — remove `expandField`; add `analyseAccreditationSubmission` (admin-only, role-checked); update `submitAccreditationRequest` to accept `modules[]` and require ≥1 evidence file per required kind
- New migration: `spec_modules` column + optional file_kind check trigger

## Out of scope (this pass)

- Full 8 evidence pack (QA policy, learner handbook, insurance, certificate template) — deferred until Level 3+ regulated flow
- Tiered evidence-by-level rules
- Public course spec page redesign
- Provider notification emails on approval/rejection copy changes
