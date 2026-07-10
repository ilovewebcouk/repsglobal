# REPS Course Accreditation — Ofqual-style scheme, AI-drafted

## Decisions locked in

- **No more "CPD" language.** Everywhere it currently says CPD (table names, columns, routes, admin queues, dashboard labels, public profile, emails) becomes "REPS-accredited course" or "course". Existing `cpd_courses` table gets renamed to `reps_courses`; `reps_cpd_number` → `reps_qual_number`.
- **REPS number**: global sequence, never resets. Format `REPS-QUAL-000001`.
- **Levels**: 1–7 (no doctoral).
- **AI does the drafting in this pass** — admin reviews and edits, never types from scratch.
- **No legacy data to preserve** — clean cut.

## Brutal opinion (kept short)

Right call on all four. AI-first drafting is the only way this scales — otherwise every accreditation becomes a 45-minute admin task and the queue dies. The pattern is: provider uploads syllabus + assessment + tutor CV → AI reads them and drafts *everything* (title, level, learning outcomes, who it's for, study/assessment narrative, GLH) → admin sees a pre-filled form, tweaks, hits Approve. Admin's job is quality control, not authorship.

Accordion on the public profile is right. Same visual language for regulated and REPS-accredited rows = REPS mark reads as *equivalent trust*, not lesser.

## 1. Database migration

**Rename + rebuild the accreditation table** (blank canvas — no data preservation):

```
DROP TABLE public.cpd_courses;
CREATE TABLE public.reps_courses (
  id uuid PK,
  provider_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Provider submission (proposal only)
  proposed_title text NOT NULL,
  syllabus_doc_path text,
  assessment_criteria_doc_path text,
  tutor_cv_doc_path text,

  -- AI-drafted spec (populated on submission; admin can edit before approval)
  ai_draft jsonb,                       -- full raw AI response for audit
  ai_verdict text CHECK IN ('recommend_approve','flagged','inconclusive'),
  ai_red_flags text[] DEFAULT '{}',

  -- Admin-approved official spec (source of truth after approval)
  official_title text,
  official_level int CHECK (official_level BETWEEN 1 AND 7),
  reps_qual_number text UNIQUE,         -- REPS-QUAL-000001, global sequence
  spec_who_for text,
  spec_learning_outcomes jsonb,         -- string[]
  spec_how_youll_study text,
  spec_how_youre_assessed text,
  spec_prerequisites text,
  spec_guided_learning_hours numeric(6,2),
  spec_total_qualification_time numeric(6,2),
  spec_delivery_mode text CHECK IN ('in_person','online','blended'),
  spec_published_at timestamptz,

  status text NOT NULL DEFAULT 'submitted'
    CHECK IN ('submitted','ai_drafted','changes_requested','approved','rejected'),
  accredited_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_note text,
  created_at, updated_at
);
```

+ `CREATE SEQUENCE reps_qual_number_seq;`
+ `next_reps_qual_number()` returns `REPS-QUAL-` + lpad(nextval, 6, '0').
+ **Validation trigger**: when `status` transitions to `approved`, require all `official_*` + core `spec_*` fields non-null, and allocate `reps_qual_number` if not set.
+ GRANTs (authenticated + service_role + anon SELECT via approved-only policy).
+ RLS policies mirror current `cpd_courses` (providers own their rows, public sees `status='approved'`, admins manage all).

**Parallel spec fields on `provider_regulated_permissions`** (regulated qualifications): add `spec_who_for`, `spec_learning_outcomes`, `spec_how_youll_study`, `spec_how_youre_assessed`, `spec_guided_learning_hours`, `spec_published_at`, plus `ai_draft jsonb`. Admin fills these on approval using the same AI-drafting flow — so the accordion works identically for both kinds.

## 2. AI drafting server function

New `draftCourseAccreditation` server function (`src/lib/qualifications/ai-draft.functions.ts`):

- Trigger: called automatically when provider submits a new `reps_courses` row, and re-callable from admin workspace ("Redraft" button).
- Inputs: paths to syllabus PDF, assessment criteria PDF, tutor CV PDF. Downloads them from storage server-side.
- Model: `google/gemini-3-flash-preview` via Lovable AI Gateway (multimodal — reads PDFs directly, no separate OCR pass).
- Uses AI SDK `generateText` + `Output.object` with a **small, constraint-free** Zod schema (no `.min()/.max()`, no length bounds — bounds go in the prompt, we clamp in code):
  ```
  {
    proposed_title: string,        // AI's cleaned-up title suggestion
    suggested_level: number,       // 1-7, based on learning depth in syllabus
    reps_qual_number: null,        // admin-only, never AI
    who_for: string,
    learning_outcomes: string[],   // ~5-10 items, "On completion, learners will..."
    how_youll_study: string,       // hours, mode, structure
    how_youre_assessed: string,    // methods, pass criteria
    prerequisites: string,
    guided_learning_hours: number,
    total_qualification_time: number,
    delivery_mode: "in_person" | "online" | "blended",
    verdict: "recommend_approve" | "flagged" | "inconclusive",
    red_flags: string[],           // concerns admin must resolve
    reviewer_notes: string         // free-text summary of what AI found
  }
  ```
- System prompt (British English, no exclamation marks, no marketing jargon — same voice rules as `article-ai-draft.functions.ts`):
  > You are the accreditation reviewer for REPS, a global register of exercise professionals. You are drafting the public specification for a course a provider has submitted for REPS accreditation. You read the provider's syllabus, assessment criteria, and tutor CV, and draft the same fields Ofqual publishes for a regulated qualification. Only use facts present in the supplied documents. Never invent hours, outcomes, or credentials. If the syllabus is thin, mark `verdict: "inconclusive"` and list what's missing in `red_flags`.
- Writes result into `ai_draft` jsonb + copies each field into the corresponding `official_*` / `spec_*` column as **an initial draft admin can edit**. Sets `status = 'ai_drafted'`.
- Guarded with `NoObjectGeneratedError.isInstance(error)` fallback to salvage `error.text` — never crash the submission.
- Includes the "state limits in the prompt, clamp in code" rule from the SDK docs.

## 3. Provider dashboard (`/dashboard/qualifications`)

**Rename tab everywhere**: "REPS-accredited courses" (was CPD). Update `AddCpdDialog` → `AddCourseDialog`. Update all copy: "add a course you'd like REPS to accredit", "your submitted courses", etc. Keep the merged type-picker flow from the previous plan.

Submit flow becomes:
1. Provider uploads syllabus + assessment + tutor CV + working title.
2. Server function creates `reps_courses` row (`status='submitted'`), fires `draftCourseAccreditation` in the background (fire-and-forget, non-blocking).
3. Provider sees "AI is drafting your accreditation spec — usually ~30 seconds" with a polling indicator.
4. Once `status='ai_drafted'`, provider sees a **read-only preview** of what REPS will publish if approved. Provider cannot edit. They can withdraw or add a note.
5. After admin approval, provider sees the final published spec.

## 4. Admin workspace (`AdminProviderQualificationsTab`)

**Rename queue**: "REPS-accredited courses" (was CPD).

Two-column drawer:

**Left — evidence**:
- Uploaded PDFs (syllabus, assessment, tutor CV) inline preview.
- AI verdict badge + red flags list.
- Original `ai_draft` jsonb for audit.

**Right — Publish accreditation form** (all fields pre-filled from AI draft):
- Official title *(editable, defaults to AI suggestion)*
- Official level *(1–7 select, defaults to AI suggestion)*
- REPS number *(allocated on Approve — preview shown, e.g. "will be REPS-QUAL-000042")*
- Who it's for *(textarea, AI-filled)*
- Learning outcomes *(repeatable list, AI-filled, admin can add/remove/edit)*
- How you'll study *(textarea, AI-filled)*
- How you're assessed *(textarea, AI-filled)*
- Prerequisites *(textarea, AI-filled)*
- Guided learning hours *(number, AI-filled)*
- Total qualification time *(number, AI-filled)*
- Delivery mode *(radio, AI-filled)*

Actions:
- **Redraft with AI** — re-runs the drafting function (useful if provider uploaded better docs).
- **Save draft** — persist edits without approving.
- **Approve & publish** — validates all required fields non-null, allocates REPS number, sets `spec_published_at`, sets `status='approved'`, sends provider email.
- **Request changes** — sets `status='changes_requested'`, sends provider email with admin note.
- **Reject** — sets `status='rejected'`, sends email.

Same "AI redraft" button on the regulated-permissions admin tab, populating `spec_*` from Ofqual scrape + awarding-body PDFs.

## 5. Public profile accordion (`t.$slug.index.tsx` / `/c/$slug`)

Every qualification row (regulated + REPS-accredited) becomes a shadcn `Accordion` item — same closed-state visuals as today (awarding-body logo tile, title, level badge, number, verified pill, chevron on the right).

**Open state** shows the spec sections in this order (only sections with content — hide empties):
1. Who it's for
2. What you'll learn (learning outcomes as a bulleted list)
3. How you'll study (with GLH / TQT / delivery mode as inline stats)
4. How you're assessed
5. Prerequisites
6. Awarding body block:
   - Regulated → "View on Ofqual register" link
   - REPS-accredited → "REPS number: REPS-QUAL-000042 · Accredited [date]"

One row open at a time, keyboard accessible, deep-linkable via `#qual-<id>`. Same component reused on `/dashboard/qualifications` so providers see exactly what the public sees.

## 6. Ofqual API — what we can actually pull

Short version: **the JSON API is decommissioned**. Only HTML scraping of `find-a-qualification.services.ofqual.gov.uk/qualifications/{number}` works (already implemented in `src/lib/cpd/ofqual.server.ts`, cached 7 days in `ofqual_cache`).

From the scrape we get: **qualification number, title, awarding organisation, level, status**. That is it. Learning outcomes, units, GLH, assessment methods — not available from Ofqual. Those live on the awarding body's website in freeform HTML.

For regulated rows we therefore populate `spec_*` fields two ways:
1. AI drafting from the provider-uploaded EQA report / centre certificate / awarding-body syllabus PDF (same flow as REPS-accredited).
2. Optional future pass: AI-assisted scrape of the awarding body's public qualification page (opt-in per awarding body, since HTML shapes vary). **Out of scope for this pass.**

## 7. Global rename checklist

Search + replace across code, DB, copy:
- `cpd_courses` → `reps_courses`
- `reps_cpd_number` → `reps_qual_number`
- `CPD course` / `CPD-accredited` / `CPD number` → `REPS-accredited course` / `REPS-accredited` / `REPS qualification number`
- Add-CPD dialog / list / admin tab labels → "REPS-accredited course"
- `AddCpdDialog` component name → `AddCourseDialog`
- Keep `/dashboard/cpd` route (Education & CPD page for cert uploads — that IS CPD, it's the compliance/points page). Only the *provider-course-accreditation* concept gets renamed.

**Important distinction**: `/dashboard/cpd` (the Education & CPD page for individual pros uploading their own certificates and tracking points) stays as-is — that's genuinely CPD (continuing professional development). What we're renaming is the *provider's course-accreditation* concept, which was mis-labeled as CPD. Two different features that got the same name.

## 8. Out of scope this pass

- Provider "request changes" workflow on approved courses (opens a support ticket for now).
- AI drafting of `spec_*` on `provider_regulated_permissions` from awarding-body websites (only from uploaded PDFs).
- Public REPS register search page (`/register`) — later.

## Technical notes

- Migration is destructive (DROP + CREATE). Confirmed blank canvas — no data preservation.
- AI drafting fires as a background job from the submit server function. Uses `waitUntil` pattern or a simple detached promise — response returns immediately.
- All AI calls use the pattern from `ai-sdk-lovable-gateway`: constraint-free schema, limits in prompt, `NoObjectGeneratedError` guarded fallback.
- REPS number sequence is a real Postgres `SEQUENCE` so it's transactional and never duplicates under concurrent approvals.
- Accordion component: reuse shadcn `Accordion` primitive (already in the design system per memory).
- Legacy `cpd_courses` references in `src/lib/qualifications/qualifications.functions.ts`, `src/lib/verification/admin-pending.functions.ts`, `src/hooks/useAdminVerificationPending.ts`, `src/integrations/supabase/types.ts` (auto-regenerated) all get updated.
