## How AI is picking the level today

`official_level` (1–7) is inferred by Gemini in a single JSON call. The system prompt gives the model a ladder:

```text
Lvl 2 = supporting
Lvl 3 = independent instructor
Lvl 4 = specialist / exercise referral
Lvl 5 = advanced specialist
Lvl 6 = degree-equivalent
Lvl 7 = postgraduate-equivalent
```

…and the model infers from the provider's answers on prerequisites, tutor credentials, learner-outcome verb depth, total hours, and topic depth.

Two weaknesses:
1. The AI returns just a number. Admin sees "L3" with no "why". `reviewer_notes` is generated but discarded.
2. The ladder is a paragraph, not a deterministic rubric, so Gemini drifts on thin/contradictory answers.

## A. Make the AI show its working on level

- Extend the AI schema with `official_level_rationale` (1–2 sentences) and `official_level_confidence` (`high | medium | low`).
- Tighten the level rubric into an ordered checklist the model must apply:
  1. Prerequisites required?
  2. Learner-outcome verb depth (remember → apply → analyse → evaluate → create)
  3. Total qualification time band (< 20h / 20–60h / 60–150h / 150h+)
  4. Tutor credential floor
- Render `AI suggests L3 · high confidence` with the rationale sentence above the level picker in the admin detail. Admin can override in one click.
- Also render `reviewer_notes` as a callout above the spec form.

## B. Admin workspace UX upgrades

Inside `AdminProviderQualificationsTab.tsx`, ordered by impact:

1. **Trust context strip** at the top of the detail pane: identity verified · insurance active · domain verified · previous courses approved.
2. **Provider vs AI diff chips** on title, total hours (→ GLH + TQT), delivery mode, prerequisites.
3. **Level picker as labelled ladder** — segmented 1–7 with label under selected ("L3 — independent instructor"); AI pick highlighted with ✨.
4. **Reviewer notes callout** (1–3 sentence AI summary).
5. **Deterministic red-flag pass** alongside AI ones:
   - Prerequisites = "none" but level ≥ 4
   - GLH > TQT
   - Delivery = self-paced but assessment mentions "practical observation"
   - Tutor credentials shorter than 30 chars
6. **Sticky decision bar** at the bottom (Save draft · Approve · Request changes · Reject).
7. **Keyboard shortcuts**: `a` approve, `r` reject, `c` changes, `j/k` next/prev, `?` help.
8. **Approve & next** — approves and auto-loads the next NEW row.
9. **Collapse long "Provider's answers"** behind expand/collapse so hero info fits above the fold.
10. **Admin note required** hint on reject / changes buttons (server already enforces).

## C. Provider dashboard follow-through

Once `changes_requested` or `flagged`, show the reviewer's note + specific red flags inline on the provider's course card so they know exactly what to fix.

## D. Assessment report PDF (NEW — marquee provider artefact)

Every course gets an Ofqual-style **REPS Course Assessment Report**, downloadable by the provider from their qualification card and by the admin from the detail pane. This is the credibility artefact that makes REPs read as a real awarding body.

**Where the button appears**
- Provider dashboard course card → *View assessment report (PDF)* — visible on `approved`, `changes_requested`, `rejected`.
- Admin detail pane → same button, with a *DRAFT — not yet issued* watermark on non-final statuses so admins can preview before deciding.
- (Future, out of scope this pass) public `/q/{reps_qual_number}/report` mirroring Ofqual's public qual pages.

**Report contents (8 sections)**
1. **Cover** — REPS wordmark, course title, provider legal name, REPS qualification number (if issued), decision, decision date, reviewer name.
2. **Course specification** — published spec: title, level, GLH, TQT, delivery mode, prerequisites, learning outcomes, assessment methods.
3. **Level determination** — the rubric with a mark against each checkpoint, the AI's rationale sentence, and confidence band. Ends with the admin-confirmed level.
4. **Assessment findings** — reviewer notes, AI red flags, deterministic flags, and resolution for each.
5. **Provider trust context at time of decision** — identity verified · insurance active · domain verified · previous approved courses count.
6. **Decision & conditions** — approved / changes requested / rejected, any conditions, admin note.
7. **Audit trail** — submitted → AI drafted → admin edited → decided, with timestamps and actor.
8. **Methodology footer** — link to a new short `/accreditation-methodology` page, unique document ID, generation timestamp.

**Immutability**
- On decision, snapshot the full spec + rationale + flags + trust context into `reps_courses.decision_snapshot jsonb` and render the PDF once, storing it in a private `course-reports` bucket. `reps_courses.report_pdf_path` points at it.
- Provider and admin download via signed URLs.
- Re-generation only fires on redraft or a fresh decision — never silently.

**Rendering approach**
- `@react-pdf/renderer` inside a TSS server route (`src/routes/api/reports/course/$id.pdf.ts`). Pure JS, Worker-compatible, matches site typography. Same React components can drive an on-screen preview.
- Report component in `src/components/reports/CourseAssessmentReport.tsx` — shared between server-generated PDF and any on-screen preview.

**Dependencies**
- New private storage bucket `course-reports` with `owner=provider_id` RLS.
- New public page `/accreditation-methodology` (short — how REPS assesses, the level rubric, deterministic flags, human oversight statement). Linked from the report footer.
- New columns on `reps_courses`: `decision_snapshot jsonb`, `report_pdf_path text`, `report_generated_at timestamptz`, plus the earlier `official_level_rationale text`, `official_level_confidence text`, `reviewer_notes text`.

## Files touched

- `src/lib/qualifications/qualifications.functions.ts` — extend `REPS_COURSE_SYSTEM`, store new AI fields, deterministic flag computer, decision-snapshot builder, PDF generation trigger on decide.
- `src/components/admin/verification/AdminProviderQualificationsTab.tsx` — trust strip, diff chips, level ladder, reviewer notes, deterministic flags, sticky bar, shortcuts, Approve & next, report button.
- `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` — reviewer note + red flags surfacing on flagged/changes cards, report download button.
- `src/components/reports/CourseAssessmentReport.tsx` — new shared report component.
- `src/routes/api/reports/course/$id.pdf.ts` — new server route rendering the PDF and streaming signed URL.
- `src/routes/accreditation-methodology.tsx` — new short marketing page.
- Migration: new `reps_courses` columns above + `course-reports` private bucket + RLS.

## Out of scope this pass

- Public `/q/{reps_qual_number}/report` page (later — needs SEO + PR review).
- Multi-reviewer claim-and-lock queue.
- Renaming `src/lib/cpd/`, `src/components/cpd/`, `/cpd` route path.

Approve and I'll ship A + B + C + D in order. D depends on A's new AI fields, so the migration goes first.
