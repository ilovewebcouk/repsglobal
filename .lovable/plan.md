# Ofqual-number-first regulated qualifications

Flip the regulated-qualification flow from "pick from a fixed list" to "type your Ofqual number, we verify + AI reads your approval evidence."

## What changes

### 1. Provider dashboard — Regulated submission form
File: `src/routes/_authenticated/_professional/dashboard_.qualifications.tsx`

- **Remove** the `<Select>` dropdown backed by the `qualifications` catalogue table.
- **Replace** with a single **Ofqual qualification number** input (e.g. `601/3866/X`), validated by the existing `OFQUAL_QUAL_NO_REGEX`.
- On blur / debounced change, call a new server function `resolveOfqualNumber` that runs `lookupOfqualQualification()` (already exists in `src/lib/cpd/ofqual.server.ts`) and returns `{ found, title, awardingOrganisation, level, status }`.
- Show a live resolution card under the field:
  - **Green** — found on register: display title / awarding body / level / status. Auto-filled, read-only.
  - **Amber** — not on register: show warning "We couldn't find this on the Ofqual register. Your submission will still be reviewed by our team — please make sure the number is correct." Allow submit.
  - **Red** — invalid format: block submit with inline validation.
- Evidence uploader unchanged (EQA report / centre approval letter / EQA certificate — as locked earlier).

### 2. Submission payload
Change `submitRegulatedQualification` in `src/lib/qualifications/qualifications.functions.ts`:

- Drop `qualificationId` (FK to catalogue). 
- Accept `ofqualNumber: string` instead.
- Snapshot the Ofqual register response into the submission row at submit-time (title, awarding body, level, status, `ofqual_matched: boolean`).
- Trigger AI extraction (see step 3) inline after upload.

### 3. AI extraction — expanded fields
Update the Gemini 2.5 Pro prompt in the existing AI extractor to pull, from the uploaded EQA report / approval letter / certificate:

- Centre name + centre number
- Awarding body name (as stated in the doc)
- Approval status (Approved / Suspended / Withdrawn / Unclear)
- Approval / report date
- Approval expiry OR next EQA visit date (nullable)
- List of qualifications the centre is approved to deliver (array of `{ title, qualNumber? }`)
- EQA name (nullable)
- `confidence: "high" | "medium" | "low" | "inconclusive"`
- `flags: string[]` (e.g. "centre_number_missing", "qualification_not_listed_in_doc")

Add one derived cross-check computed server-side after extraction:
- `qualification_in_doc: boolean` — does the submitted Ofqual number (or its title) appear in the AI-extracted list of approved qualifications?

### 4. Admin queue — evidence panel
File: `src/components/admin/verification/AdminProviderQualificationsTab.tsx`

Show three columns side-by-side per submission:

1. **Ofqual register** (independent truth about the qualification itself): title, awarding body, level, status. Amber banner if not found.
2. **AI-extracted evidence** (what the doc says about *this centre's* approval): centre name + number, awarding body per doc, approval status, dates, list of approved quals, EQA name, confidence, flags.
3. **Cross-check verdict**: three chips —
   - Ofqual register match (found / not-found)
   - Awarding body match (register vs doc)
   - Qualification listed in doc (yes / no / inconclusive)

Admin decision buttons (Approve / Request changes / Reject) unchanged.

### 5. Catalogue table
- **Keep** `qualifications` table in the DB for now (historic submissions may reference it), but stop reading from it in the submission flow. Mark deprecated in a comment; remove in a later migration once no active rows depend on it.
- **Drop** the FK column `qualification_id` from `provider_regulated_permissions` in a new migration; add columns:
  - `ofqual_number text not null`
  - `ofqual_snapshot jsonb` (title/body/level/status at submit time)
  - `ofqual_found boolean not null default false`
  - `ai_extraction jsonb` (full AI result incl. new fields)
  - `ai_cross_check jsonb` (the 3 chip verdicts)

### 6. Public `/t/$slug` rendering
File: `src/routes/t.$slug.index.tsx` + `listPublicProviderQualifications`

- Group by `ofqual_snapshot.awardingOrganisation` (fall back to AI-extracted body when register missed).
- Show qualification title from the register snapshot; the Ofqual number becomes a small monospace chip under the title.
- Logo rendering via `awardingBodyLogo()` continues to work via fuzzy match on the register's awarding organisation name → existing slug map.

## Technical notes

- Ofqual lookup already exists (`src/lib/cpd/ofqual.server.ts`) with a 7-day Postgres cache — no new infra.
- AI extraction already exists via Lovable AI Gateway (`google/gemini-2.5-pro`) with the guarded `NoObjectGeneratedError` fallback pattern. Only the schema + prompt change.
- Keep the `Output` schema flat and constraint-free (no `.min/.max`, no long enums) per `ai-sdk-lovable-gateway` rules; state limits in the prompt, clamp in code.
- Amber "not on register" cases surface as a distinct admin filter alongside the existing "inconclusive" bucket so reviewers can triage them quickly.

## Out of scope (this pass)

- CPD flow is unchanged (syllabus + assessment criteria + tutor CV — no Ofqual lookup applies).
- Removing the `qualifications` catalogue table (deferred until historic rows migrated).
- Ofqual API rate-limit / bulk pre-warm — current per-submission cache is sufficient.
