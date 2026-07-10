# Merge provider Qualifications & Courses into one list

## Goal
Replace the two-tab layout in `/dashboard/qualifications` with **one unified list** and a type-picker as step 1 of the Add flow. The public profile already reads this way; the back-end now matches.

## File
`src/routes/_authenticated/_professional/dashboard_.qualifications.tsx`

## 1. Kill the tabs, unify the list

- Remove the `Tab` state and the `Regulated qualifications / REPS-accredited courses` pill switcher (lines ~92–124).
- Fetch both queries as today (`listMyRegulatedPermissions` + `listMyCpdCourses`); render both.
- Replace `RegulatedSection` + `CpdSection` with a single `<QualificationsList>` panel:
  - **Header**: H2 "Your qualifications & courses" · one primary button **"Add qualification or course"** (opens the type-picker dialog).
  - **Body**: single ordered list containing both regulated permissions and REPS-accredited courses.
- **Row shape** — reuse existing `RegulatedRow` / `CpdRow` visuals verbatim (no visual rework this pass). Rows are the same width; the kind is conveyed by the awarding-body logo tile (Ofqual body vs REPS logo) and existing badges (Ofqual number vs `REPS-QUAL-…` / `REPS CPD number`).
- **Sort order** (matches public profile):
  1. Withdrawn rows drop to bottom (keep current regulated behaviour).
  2. Then by numeric level DESC (parse `L5`, `Level 5`, `5` — nulls last).
  3. Then by title ASC.
- **Empty state**: single card "No qualifications or courses yet" with sub "Add your first — we'll ask whether it's an Ofqual-regulated qualification you deliver or a course you'd like REPS to accredit." and the same Add button.

## 2. Type-picker dialog (new — step 1 of Add flow)

New local component `AddTypePickerDialog`:

- Two large radio-card options, stacked, using existing `RadioGroup` + `PCard` primitives:
  - **"Ofqual-regulated qualification"** — sub: "I'm an approved centre for a qualification on the Ofqual register (e.g. Active IQ Level 2 in Instructing Circuit Training). You'll need an EQA report, centre certificate, or approval letter."
  - **"REPS-accredited course"** — sub: "I've built my own course and want REPS to accredit it. You'll provide a syllabus, assessment criteria, and tutor CV."
- Footer: `Cancel` · `Continue`.
- On Continue: close this dialog, open the corresponding existing dialog (`AddRegulatedDialog` or `AddCpdDialog`) with the same open/close pattern already in place.

State model in `ProviderQualsPage`:
```ts
const [pickerOpen, setPickerOpen] = React.useState(false);
const [regulatedOpen, setRegulatedOpen] = React.useState(false);
const [cpdOpen, setCpdOpen] = React.useState(false);
```
- `Add qualification or course` → `setPickerOpen(true)`.
- Picker `Continue(regulated)` → `setPickerOpen(false); setRegulatedOpen(true)`.
- Picker `Continue(course)` → `setPickerOpen(false); setCpdOpen(true)`.

Existing `AddRegulatedDialog` and `AddCpdDialog` stay untouched — they're the branch destinations.

## 3. Copy changes

- Page subtitle → **"One list for both regulated qualifications you're approved to deliver and courses you'd like REPS to accredit."**
- Sub-nav / dashboard `active` label already "Qualifications & Courses" — unchanged.
- Remove the two per-section H2s ("Regulated qualifications we deliver" / "REPS-accredited courses") since the panel now has a single header.

## 4. Filter chips — DEFERRED

Not adding filter chips in this pass (user chose "merge only"). Sort by level is enough for current volume. Revisit if any provider has >10 items.

## Out of scope
- No changes to `AddRegulatedDialog` / `AddCpdDialog` internals.
- No server-function changes.
- No DB migration.
- Admin moderation surface (`AdminProviderQualificationsTab`) keeps its two queues — different evidence, different reviewers, legit internal split.

## Technical notes
- Level parsing helper `parseLevel(v)` reused from `t.$slug.index.tsx` — copy into this file (small enough, no new util file).
- Row union type: `{ kind: "regulated"; row: RegulatedPermissionRow } | { kind: "course"; row: CpdCourseRow }` so the map cleanly dispatches to `<RegulatedRow>` or `<CpdRow>`.
- Keep both `useQuery` invalidation keys as-is; both Add dialogs already invalidate their own key.
