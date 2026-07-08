# Provider Qualification Permissions — Phase 1 (v3, evidence policy locked)

## Evidence policy (LOCKED)

### Regulated qualifications (Ofqual)
Accept ONLY:
1. **EQA report** from the awarding body's External Quality Assurer, OR
2. **Centre approval certificate** issued by the awarding body, OR
3. **Approval letter** from the awarding body, on their letterhead, naming the centre and the specific qualification(s) approved.

Not accepted: portal screenshots, self-declared centre numbers, insurer schedules, third-party endorsements.

No evidence → cannot list the regulated qualification. Non-negotiable.

### CPD (REPS accredits — this is our own workflow)
REPS *is* the accreditor. Providers request accreditation for a course they want to deliver by uploading exactly three things:

1. **Course syllabus** (learning outcomes, hours, delivery mode)
2. **Assessment criteria** (how learners are assessed / graded)
3. **Tutor CV** (lead tutor delivering the course)

All three are mandatory. Missing any → cannot submit.

On approval:
- Course is marked REPS-accredited.
- Provider gets the **REPS Accredited** badge for that course.
- Course is assigned a **CPD number** (`REPS-CPD-000123`, global sequence, zero-padded).
- Course renders publicly with "REPS Accredited · CPD-000123".

Not accepted for CPD: third-party endorsements (CIMSPA, other bodies), insurer recognition, awarding body letters, portal screenshots. REPS is the only accreditor for REPS-listed CPD.

## AI parsing

Every evidence file runs a Lovable AI extraction pass on submission (`google/gemini-2.5-pro`, multimodal). Output is admin-only, never shown to the provider.

Extracted (JSON, per-field confidence 0-1):

**Regulated submissions:**
- `document_type`: `eqa_report | centre_certificate | approval_letter | other`
- `awarding_body_detected` (matches against `AWARDING_BODIES` slugs)
- `centre_name_detected`, `centre_number_detected`
- `qualifications_listed[]` (raw titles + inferred Ofqual refs)
- `issue_date`, `expiry_date`, `signatory_name`, `signatory_role`
- `red_flags[]`: wrong document type, no letterhead, expired, name mismatch, unreadable, template mismatch

**CPD submissions:**
- Per file: `document_type: syllabus | assessment_criteria | tutor_cv | other`
- Syllabus: `learning_outcomes[]`, `total_hours`, `delivery_mode`, `has_assessment_reference`
- Assessment: `assessment_methods[]`, `pass_criteria`, `grading_rubric_present`
- Tutor CV: `name`, `highest_qualification_level`, `qualification_titles[]`, `years_experience`, `domain_match_to_syllabus`
- `red_flags[]`: file mislabelled, tutor under-qualified for claimed level, syllabus < minimum hours for level, missing assessment method, obviously copied from public source

**Auto-decision matrix:**
- All docs present + AI confidence > 0.85 + no red flags → admin queue with green "AI recommends approve" banner.
- Any red flag or confidence < 0.6 → admin queue with red "AI flagged" banner + reasons listed.
- Everything else → normal queue (amber).
- Phase 1 = AI-assisted, human decides. No full auto-approval until ≥500 reviewed decisions calibrate the model.

Raw AI output stored on the submission row (`ai_extraction jsonb`, `ai_verdict text`, `ai_red_flags text[]`).

## Architecture

```text
qualifications                       (regulated catalogue — Ofqual + awarding body)
provider_regulated_permissions       (provider proves centre approval for a regulated qual)
cpd_courses                          (provider's own CPD course — REPS accredits it)
```

Two tables, not one — because they're different objects. A regulated permission points at an existing catalogue row (someone else's qualification). A CPD course *is* a new row the provider defines and REPS accredits.

### `qualifications` (catalogue — regulated only)
- `title`, `level`, `awarding_body_slug`, `ofqual_ref`, `title_slug`, `is_active`.
- Seeded ~30 top regulated quals.
- Kind field dropped — CPD lives in its own table.

### `provider_regulated_permissions` (new)
- `provider_id` → `professionals.id`
- `qualification_id` → `qualifications.id`
- `evidence_doc_paths[]` (private bucket, ≤5 files, 20MB each)
- `evidence_type`: `eqa_report | centre_certificate | approval_letter`
- `awarding_body_reference` (centre number, free text)
- `ai_extraction jsonb`, `ai_verdict`, `ai_red_flags text[]`
- `status`: `submitted | approved | rejected | changes_requested`
- `reviewed_by`, `reviewed_at`, `admin_note`
- `evidence_issued_at`, `evidence_expires_at` (nullable — parsed from AI, admin can override)
- Unique on `(provider_id, qualification_id)` where `status != 'rejected'`.

### `cpd_courses` (new)
- `provider_id`
- `title`, `level` (nullable, provider claims), `hours`, `delivery_mode`, `summary`
- `syllabus_doc_path`, `assessment_criteria_doc_path`, `tutor_cv_doc_path` (all NOT NULL on submit)
- `ai_extraction jsonb`, `ai_verdict`, `ai_red_flags text[]`
- `status`: `submitted | approved | rejected | changes_requested`
- `reps_cpd_number text unique` — assigned by trigger on first approval, format `REPS-CPD-000123` (global zero-padded sequence)
- `accredited_at`, `reviewed_by`, `admin_note`

### Member ID (professionals + providers)
- `professionals.reps_member_id text unique`, format `REPS-000123`, global sequence.
- Assigned by trigger on first verification approval.
- Dashboard chip + downloadable SVG badge.

### Awarding body logos
- Extend `AWARDING_BODIES` (`src/lib/cpd/awarding-bodies.ts`) with `logo` field (Lovable Asset).
- Seed Active IQ, Focus Awards, YMCA Awards, NCFE/CACHE, VTCT, Future Fit, Innovate. Missing ones → I'll list them at build time and ask you to drop SVGs; each becomes `src/assets/awarding-bodies/*.svg.asset.json`.

## UI surface

### Provider dashboard — new "Qualifications & Courses" tab
Two sub-sections:

**A. Regulated qualifications we deliver**
- "Add a regulated qualification" → pick from catalogue → upload EQA report / centre certificate / approval letter (mandatory, one of three) → enter centre number → submit.

**B. REPS-accredited CPD courses**
- "Request CPD accreditation for a course" → enter title / level / hours / delivery mode / summary → upload all three (syllabus + assessment criteria + tutor CV, all mandatory) → submit.
- Approved rows show the CPD number and the "Copy REPS badge" button.

### Admin — extend `/admin/verification`
Two new queue tabs:
- **Provider regulated** — evidence viewer side-by-side with AI extraction, approve / request changes / reject.
- **CPD accreditation** — three-file viewer, AI extraction panel showing syllabus/assessment/tutor summary, approve (assigns CPD number automatically) / reject.

### Public `/t/$slug` — "Qualifications & Courses" section
Two blocks:

**Ofqual-regulated qualifications we deliver**
- Awarding body logo · title · level pill · "Ofqual-regulated · Approved centre" (emerald status chip)
- Only `status='approved'` rows.

**REPS-accredited CPD courses**
- REPS wordmark chip · course title · level (if set) · hours · "REPS Accredited · CPD-000123" (emerald status chip)
- Only `status='approved'` rows.

## Migration order

1. `qualifications` catalogue + seed (regulated only).
2. Extend `AWARDING_BODIES` with logo field + asset uploads.
3. `provider_regulated_permissions` + RLS + grants.
4. `cpd_courses` + RLS + grants + `REPS-CPD-######` sequence + assign-on-approval trigger.
5. `verification-docs` bucket policies for new evidence paths.
6. `reps_member_id` column + sequence + assign-on-first-verification trigger.
7. Server fn: submit regulated permission + AI extraction (gemini-2.5-pro).
8. Server fn: submit CPD accreditation + AI extraction (gemini-2.5-pro).
9. Provider dashboard tab (both sub-sections).
10. Admin queue tabs (both).
11. Public render on `/t/$slug` — DONE. `listPublicProviderQualifications` (anon-safe) fetches approved regulated permissions grouped by awarding body (with logos) + approved CPD courses. Rendered in the existing Accreditations & Recognition and Courses sections.
12. Member ID chip — DONE. `reps_member_id` surfaced next to the REPS Verified pill in the hero. SVG badge download deferred until asset pack.

## Open questions

1. **Regulated evidence age cap** — hard-reject EQA/centre-cert/letter older than 24 months, or accept with admin discretion? Recommend hard-reject >24mo, auto-flag at 20mo.
2. **CPD level claim** — do you want providers to *claim* a CPD level (L2/L3/L4 equivalent) that admin then validates against the tutor CV, or is CPD level-less on REPS?
3. **CPD hours minimum** — is there a floor (e.g. ≥6 hours to count as a REPS CPD), or does REPS accredit any length?
4. **AI cost tier** — gemini-2.5-pro on every submission (~£0.02-0.05 each), or two-pass with gemini-2.5-flash first and pro only on ambiguous cases?
5. **Re-verification cadence** — regulated EQA/centre certs go stale. Auto-flag for re-upload at 24 months, or only on new claim?
