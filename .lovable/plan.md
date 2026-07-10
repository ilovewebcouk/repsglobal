
# Form-based REPS course accreditation

Replace the 3 PDF uploads with a structured 10-field form. Providers describe the course in plain English; AI expands rough answers into polished copy per field on demand, then drafts the full Ofqual-style spec on submit. Admin still reviews and publishes.

## What the provider fills in

Ten fields, all in the "Request REPS accreditation" dialog. Required unless noted.

1. **Working title** — short input. What they'd call the course internally.
2. **Who this course is for** — textarea (2-3 sentences). Target learner, prior experience assumed.
3. **What the course covers** — textarea. Topics/modules in bullet or prose form.
4. **What learners will be able to do afterwards** — textarea. Rough outcomes; AI rewrites as Bloom's-verb learning outcomes.
5. **How it's delivered** — segmented control: In-person / Online live / Online self-paced / Blended.
6. **Total learning hours** — number input. Provider's estimate; AI splits into GLH vs TQT.
7. **How learners are assessed** — textarea. e.g. "written exam + practical observation".
8. **Prerequisites** — textarea (optional). Qualifications, age, experience.
9. **Tutor name & credentials** — textarea. Who teaches it and why they're qualified.
10. **Anything else REPS should know** — textarea (optional). Insurance, awarding partners, unusual delivery.

No file uploads anywhere in the flow.

## AI expand per field

Every textarea (fields 2, 3, 4, 7, 8, 9, 10) gets a small **✨ Expand with AI** button in its top-right corner.

- Disabled until the field has ≥ 15 characters (needs something to expand).
- Click → server function `expandCourseField({ field, currentValue, contextSoFar })` → returns polished draft.
- Reads the whole form so far as context (so "learning outcomes" expansion knows what the course covers).
- Replaces the field value with the AI draft; provider can undo (one-level undo per field) or keep editing.
- Uses `google/gemini-3-flash-preview` via Lovable AI Gateway, streaming into the textarea.
- Per-field system prompts enforce British English, no marketing jargon, concrete verbs.

Rate-limited to 20 expansions per course per hour to prevent abuse.

## Submit flow

1. Provider clicks **Submit for accreditation**.
2. Row inserts into `reps_courses` with `status='submitted'`, all form fields stored as structured columns (no more `syllabus_doc_path` / `assessment_doc_path` / `tutor_cv_doc_path`).
3. `runRepsCourseAiDraft` fires in background — same as today, but reads the structured form instead of parsing PDFs. Much more reliable AI grounding.
4. AI drafts: `official_title`, `official_level` (1-7), `spec_learning_outcomes`, `spec_who_for`, `spec_how_youll_study`, `spec_how_youre_assessed`, `spec_prerequisites`, `spec_guided_learning_hours`, `spec_total_qualification_time`, `spec_delivery_mode`, `ai_verdict`, `ai_red_flags`.
5. Status flips to `ai_drafted`. Admin reviews in existing two-column workspace. Publish assigns `REPS-QUAL-XXXXXX`.

## Database changes

Migration on `reps_courses`:

- **Drop columns**: `syllabus_doc_path`, `assessment_criteria_doc_path`, `tutor_cv_doc_path`.
- **Add columns**:
  - `proposed_who_for text not null`
  - `proposed_what_covered text not null`
  - `proposed_learner_outcomes text not null`
  - `proposed_delivery_mode text not null` (check: in_person/online_live/online_self_paced/blended)
  - `proposed_total_hours numeric not null`
  - `proposed_how_assessed text not null`
  - `proposed_prerequisites text` (nullable)
  - `proposed_tutor_credentials text not null`
  - `proposed_extra_notes text` (nullable)
- Rename existing `proposed_title` stays.
- `ai_expand_usage jsonb default '[]'` for per-course rate-limit tracking.

Storage bucket `reps-course-evidence` and related RLS become unused — leave for now, remove in a later cleanup.

## Server functions

New: `expandCourseField` — validated input `{ courseId, field, currentValue, formContext }`, returns `{ draft: string }`. Middleware `requireSupabaseAuth`, verifies caller owns the course row (or it's a fresh in-flight draft keyed by the user).

Updated: `submitRepsCourse` — takes the 10-field payload instead of file paths. Zod validation on all fields.

Updated: `runRepsCourseAiDraft` — no more PDF-fetching or signed URLs. Prompt is built from the structured form fields, which produces cleaner, more consistent drafts. Same output contract, same clamping in code, same status transition.

Unchanged: `adminSaveRepsCourseSpec`, `adminDecideRepsCourse`, `adminRedraftRepsCourse`, `listMyRepsCourses`, `listPublicProviderQualifications`.

## UI changes

`src/components/dashboard/qualifications/AddCourseDialog.tsx`:

- Remove the 3 file drop zones.
- Add 10 fields matching the list above, using shadcn `Field`/`FieldGroup`, `Input`, `Textarea`, `RadioGroup` (for delivery mode).
- Add `AiExpandButton` component (reusable) in each textarea's header. Includes a subtle "Expanded by AI — edit freely" chip after use, and an Undo button while the previous value is still recoverable.
- Keep the existing "What AI drafts from your documents" callout, reworded to "What AI drafts from your answers".
- Submit disabled until required fields are filled (client-side); server re-validates.

`dashboard_.qualifications.tsx`:
- Existing polling and status rendering unchanged.
- Row detail (when clicking a submitted/ai_drafted course) shows the form answers instead of doc links.

Admin workspace (`AdminProviderQualificationsTab.tsx`):
- Left column swaps "Evidence documents" section for "Provider's answers" — a read-only rendering of the 10 fields with clear labels.
- Everything else (AI verdict, red flags, right-column official spec editor, actions) unchanged.

## Copy update

Dialog subtitle becomes:
> "Answer 10 short questions about your course. REPS AI drafts the level, official title and full specification from your answers; a REPS admin reviews and publishes. Approved courses receive a unique REPS–QUAL–number."

## Technical notes

- Zod schema for `expandCourseField` uses no `.min()/.max()` — enforce length in the prompt, clamp in code (hard cap 2000 chars per expansion).
- `Output.object({ schema: z.object({ draft: z.string() }) })` for structured return; wrap in `NoObjectGeneratedError` fallback per the AI SDK guidance.
- Streaming into the textarea uses `streamText` + `toUIMessageStreamResponse` via a server route at `src/routes/api/course-expand.ts` (streaming needs a server route, not a server function).
- Rate limit implemented in the route handler by reading `ai_expand_usage` and rejecting > 20/hour with a clear 429 message surfaced in the UI.

## Out of scope this pass

- Migrating the currently-empty `reps_courses` table's old columns cleanly (drop is fine — blank canvas).
- Removing the unused storage bucket.
- Provider "request changes" round-trip.
- AI expand for the working title field (deliberately kept manual — AI names courses badly).

## Files touched

- `supabase/migrations/<new>.sql` — schema change on `reps_courses`.
- `src/lib/qualifications/reps-courses.functions.ts` — updated `submitRepsCourse`, new `expandCourseField`.
- `src/lib/qualifications/ai-draft.functions.ts` — new prompt based on structured fields.
- `src/routes/api/course-expand.ts` — streaming AI expand endpoint.
- `src/components/dashboard/qualifications/AddCourseDialog.tsx` — full rewrite (form + expand buttons).
- `src/components/dashboard/qualifications/AiExpandButton.tsx` — new reusable component.
- `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` — row detail update.
- `src/components/admin/verification/AdminProviderQualificationsTab.tsx` — swap evidence section for answers view.
- `src/integrations/supabase/types.ts` — regenerated after migration.
