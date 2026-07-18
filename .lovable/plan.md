## What's actually happening

The AI drafter **does** fill the right-column form fields — it writes into `spec_who_for`, `spec_learning_outcomes`, `spec_how_youll_study`, `spec_how_youre_assessed`, `spec_prerequisites`, `spec_guided_learning_hours`, `spec_total_qualification_time` and `spec_delivery_mode`, and the admin form pre-populates from exactly those columns.

The Bondi Rise row you're looking at is the pre-existing stuck row from before yesterday's fix. When it was submitted 11h ago the AI drafter never ran at all (that was the bug I fixed), so those `spec_*` columns are still empty even though the middle-column "Reviewer summary (AI)" now shows content from a later partial run. Any course submitted from now on will arrive already drafted with every right-column field filled.

Two things to fix so this doesn't happen again and so this specific row self-heals:

## Plan

### 1. Auto-recover legacy rows on open
In `AdminProviderQualificationsTab.tsx`, when the admin opens a row where `ai_drafted_at` is set but the `spec_*` fields are still empty (i.e. a pre-fix row that only got a partial draft), automatically call `runRepsCourseAiDraft` with `overwrite: true` once, show a subtle "Drafting with AI…" state on the form panel, and refetch when it finishes. No manual "Redraft with AI" click required.

### 2. Hydrate the form from `ai_draft` JSON as a fallback
If for any reason the `spec_*` columns are still empty but the raw `ai_draft` JSON on the row contains values (e.g. AI ran but the DB write of official/spec was skipped), initialise the form state from `ai_draft.spec_who_for`, `ai_draft.spec_learning_outcomes`, etc., so the boxes are never empty when the AI has already produced content. Admin still edits and saves; save writes to the real `spec_*` columns.

### 3. Clearer "AI has filled these — review and approve" affordance
Above the right-column form, add a small banner when `ai_drafted_at` is set and any `spec_*` field is filled: *"AI has drafted the fields below. Review, edit if needed, then Approve & publish."* So the admin knows the form values are AI output, not their own manual entry.

### 4. Immediate one-time recovery for the Bondi Rise row
Because the row is already visible on your screen, ship (1) so that opening it triggers a fresh redraft automatically — no data migration needed.

### Out of scope
- The AI prompt/schema itself — it already produces every field the form needs.
- Middle-column spec view — that stays as the raw provider claim.
- Approval/publish flow — unchanged.

### Technical notes
- All changes are in `src/components/admin/verification/AdminProviderQualificationsTab.tsx` plus a small tweak to the exported surface in `src/lib/qualifications/qualifications.functions.ts` if the auto-recovery redraft needs a dedicated `redraftIfIncomplete` server function (preferred over calling the existing `redraft` mutation directly, so the UI can distinguish "auto" vs "user-clicked").
- No DB migration.
- No changes to the provider-side submission flow.