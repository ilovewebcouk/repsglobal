# REPS Endorsement — QLS-style rework

Reshape the "Request REPS endorsement" flow (formerly "accreditation") so
providers submit their own words + real evidence + a public endorsement
statement, and AI only assists admin reviewers (internal, no public spec).

## Terminology

- User-facing: **endorsed / endorsement** everywhere. `accredited` and
  `accreditation` are banned in provider/admin UI, emails, help articles,
  and marketing copy.
- Internal names (DB columns like `accredited_at`, storage bucket
  `course-accreditations`, table `course_accreditation_files`) stay as-is
  to avoid a churn-heavy migration.

## Endorsement statement (new — landed 2026-07-10)

Every provider agrees to display this verbatim on the page that lists the
course, before REPS endorses it:

> This course has been endorsed by the REPs for its high-quality,
> non-regulated provision and training programmes. This course is not
> regulated by Ofqual and is not an accredited qualification. We will be
> able to advise you on any further recognition, for example progression
> routes into further and/or higher education. For further information
> please visit the Learner FAQs on the REPs website.

Enforced by:

- Provider modal captures the URL where the statement will live + explicit
  agreement checkbox.
- Server fn `checkEndorsementStatement` (auth'd) fetches the URL, strips
  markup and asserts two signature phrases (`endorsed by the reps`,
  `not regulated by ofqual`) are both present.
- Submit is blocked until: URL is valid, checkbox is ticked, and the
  auto-check has returned `found === true`.
- Admin can re-run the check with `adminRecheckEndorsementStatement`,
  which persists `endorsement_statement_last_checked_at`, `_found`,
  `_check_error`.

New columns on `reps_courses`:
- `endorsement_statement_url text`
- `endorsement_statement_agreed boolean` (default false, set true on submit)
- `endorsement_statement_last_checked_at timestamptz`
- `endorsement_statement_found boolean`
- `endorsement_statement_check_error text`
- `admin_reviewer_aide jsonb` + `admin_reviewer_aide_generated_at` — reserved
  for Phase 2 AI reviewer aide (admin-only).

## Shipped in Phase 1 (this pass)

- DB migration: statement columns + reviewer-aide columns.
- Provider modal (`dashboard_.qualifications.tsx`):
  - Removed all "Expand with AI" — earlier pass.
  - Modules repeater — earlier pass.
  - Core 4 evidence uploads — earlier pass.
  - **New:** Endorsement-statement section (statement, copy button, URL
    field, "Check now" button + result badge, agreement checkbox).
  - Submit gate now includes statement-ready check.
  - User-facing strings renamed to "endorsement".
- Server functions (`qualifications.functions.ts`):
  - `REPS_ENDORSEMENT_STATEMENT` constant.
  - `checkEndorsementStatement` (provider pre-flight).
  - `adminRecheckEndorsementStatement` (admin, persists result).
  - `submitRepsCourse` accepts + stores statement URL and agreement.
  - Types extended.
- Admin tab (`AdminProviderQualificationsTab.tsx`): user-facing strings
  renamed.

## Phase 2 — still to build

- **Admin evidence viewer** — Evidence panel on the admin review row with
  signed-URL "Open" links per file kind + a statement-verify badge
  (green "Statement live" / red "Not on page") with a manual re-check
  button wired to `adminRecheckEndorsementStatement`.
- **Admin AI reviewer aide** — `analyseEndorsementSubmission` server fn
  (admin-only, `has_role` gate). Reads intake, module list, evidence text,
  returns internal aide: level suggestion + rationale, module-vs-spec
  consistency, Bloom's-verb consistency, red flags. Persists to
  `admin_reviewer_aide`. Rendered in a collapsed panel; never surfaced to
  providers.
- **Wider terminology sweep** — Rename user-facing "accredit*" across
  marketing pages (`/cpd`, `/find-a-training-provider`, `/specialisms`,
  public provider `/t/$slug` course tiles) and help articles.

## Out of scope

- Full 8 evidence pack, tiered rules by level, public course spec
  redesign, notification email copy updates.
