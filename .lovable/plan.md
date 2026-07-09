
## Goal

Bring the **Admin → Verification → Training providers → Qualifications & CPD** tab up to the same standard as the Name/Domain queue, and let providers submit several qualifications in one go against a single set of evidence docs.

Three problems today:
1. Regulated & CPD submissions render as a flat card list — you can't tell at a glance *who* submitted what without opening each card.
2. Clicking a document opens it in a new tab, so the qualification detail and the evidence are never on screen together.
3. A single EQA report or approval letter usually covers multiple qualifications, but providers can only submit one Ofqual number per upload — so the same evidence gets uploaded 3–4 times and admins can't see they belong together.

---

## 1. Admin queue — master-detail layout

Rewrite `src/components/admin/verification/AdminProviderQualificationsTab.tsx` to mirror `AdminProviderQueueTab.tsx`:

```text
┌─ Regulated | CPD ─┐  ┌─ Pending | Changes | Approved | Rejected ─┐
┌──────── list (380px) ────────┬──────────── detail ────────────────┐
│ Provider name                │ Provider header + email + submitted│
│  ↳ qualification title       │                                    │
│  ↳ Ofqual no · awarding body │ ┌─ Ofqual register ─┬─ AI evidence ┐│
│  ↳ time · status chip        │ │ title, body, lvl  │ centre, dates││
│                              │ └───────────────────┴──────────────┘│
│ [selected] highlighted       │ Cross-check chips                  │
│ ...                          │ Documents (open in drawer buttons) │
│                              │ Admin note + Approve/Changes/Reject│
└──────────────────────────────┴────────────────────────────────────┘
```

- List row shows: provider name (bold), qualification title, Ofqual number (mono), awarding body, `TimeAgo`, status chip.
- Add a **grouping affordance** in the list: submissions sharing the same `submission_group_id` (see §3) render as a single row with a `+N more` chip; selecting expands all rows in the group in the detail panel as tabs.
- Right-side detail keeps the existing two-column *Ofqual register vs AI-extracted* panel and cross-check chips, plus a new **"Requested by"** block: provider legal entity name, contact email (mailto link), `/t/<slug>` public profile link, submitted-at absolute + relative.
- Approve / Request changes / Reject buttons and admin-note textarea move into the detail panel footer, exactly like `AdminProviderQueueTab`.

Refetch every 30s while the `submitted` tab is active (already in place).

## 2. In-page document drawer

New component `src/components/admin/verification/QualificationDocDrawer.tsx` using shadcn `Sheet` (right side, `sm:max-w-[720px]`, full height).

- Opens from any "Document N" button in the admin detail panel. Never `window.open`.
- Fetches a signed URL via existing `getQualificationDocSignedUrl` server fn.
- Renders:
  - PDFs → `<iframe src={signedUrl} className="h-full w-full">`.
  - Images → `<img>` with contain-fit.
  - Anything else → a clean "Open in new tab" fallback (last resort only).
- Multi-doc submissions get a top-of-sheet segmented control (Doc 1 / Doc 2 / …) so admin can flip between attachments without closing the drawer.
- The list and detail stay interactive behind the sheet (modal=false), so admin can compare the doc against the AI-extracted panel side-by-side on wide screens.

Replace the two current `window.open(url, "_blank")` call sites in `AdminProviderQualificationsTab.tsx` (regulated + CPD) with `setDrawerPaths([...])`.

## 3. Multi-qualification submission from provider

The provider dashboard dialog at `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx` becomes multi-number:

- **Ofqual numbers list** (chip input):
  - Text input + `Add` button.
  - On add: validate format, run `resolveOfqualNumber`, then push a chip showing `{number} — {title or "Not on register"}` with a green/amber dot.
  - Each chip is removable. Minimum 1, maximum 10.
- Evidence type + centre number + files are shared across all numbers in the batch.
- Submit calls a new server fn `submitRegulatedPermissionBatch({ ofqual_numbers, evidence_type, evidence_doc_paths, awarding_body_reference })`:
  - Inserts one `provider_regulated_permissions` row per number, all sharing:
    - the same `evidence_doc_paths`
    - a new column `submission_group_id UUID` (generated once per batch)
  - Runs `runRegulatedAiExtraction` once per row (existing behaviour), so each row still gets its own Ofqual snapshot + cross-check.
- Copy update in the dialog: "Add every Ofqual number this document covers — one EQA report often lists several qualifications."

The single-number `submitRegulatedPermission` fn stays for back-compat but the UI only calls the batch fn.

## Technical section

### DB migration
```sql
ALTER TABLE public.provider_regulated_permissions
  ADD COLUMN IF NOT EXISTS submission_group_id uuid;
CREATE INDEX IF NOT EXISTS idx_prp_submission_group
  ON public.provider_regulated_permissions (submission_group_id);
```

Existing rows have `submission_group_id = NULL` and render as their own single-item group in the admin list.

### Server functions (`src/lib/qualifications/qualifications.functions.ts`)
- Add `submitRegulatedPermissionBatch` — schema: `{ ofqual_numbers: string[].min(1).max(10), evidence_type, evidence_doc_paths: string[].min(1).max(5), awarding_body_reference }`.
  - Generates one `submission_group_id = crypto.randomUUID()`.
  - Loops the existing insert + AI extraction per number.
  - Deduplicates numbers, normalises to upper-case, rejects invalid formats up-front.
- Extend `adminListRegulatedQueue` select to include `submission_group_id` and to also return the provider's `slug` (already present).
- No change to `adminDecideRegulated`; admin still decides per-row, which is deliberate because each row is a distinct approval.

### Client
- Rewrite `AdminProviderQualificationsTab.tsx` to a two-column layout using `PPanel`, existing `TimeAgo`, and the existing evidence panels/cross-check chips (lift them into a shared `<RegulatedDetail>` and `<CpdDetail>`).
- New `QualificationDocDrawer.tsx` using `Sheet` from `@/components/ui/sheet`.
- Provider dialog gains an `<OfqualNumberChips>` sub-component that reuses the current debounced `resolveOfqualNumber` logic per chip.
- CPD side gets the same master-detail treatment (single-course submissions, no batching, no group id).

### Scope guard
- No changes to public `/t/$slug` rendering, to CPD accreditation numbering, or to the RLS policies on `provider_regulated_permissions`.
- No changes to the identity or insurance queues.
- Existing single-number submissions continue to work; only the UI switches to batch.
