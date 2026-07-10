
# Print a batch — end-to-end workflow

## The workflow this enables

1. Provider pays for a printed batch → learners get digital PDFs by email → batch appears in admin **Print Queue** with status `awaiting_print`.
2. Admin clicks **Download print pack** → gets a single merged PDF (all learner certificates, one page each, ready to send straight to the printer). A secondary **Download individual PDFs (ZIP)** link is available for reprints.
3. Admin physically prints on card stock.
4. Admin clicks **Mark as printed** → status flips to `printed`, `printed_at` timestamp saved.
5. **Create label & dispatch** button is disabled until step 4 is done. Once printed, admin dispatches as today (Royal Mail order + tracking + provider email).

## Database

Migration adds two columns to `certificate_batches`:
- `printed_at timestamptz` — set when admin marks the pack printed.
- `printed_by uuid` — admin who confirmed.

Status enum gains `printed` (between `awaiting_print` and `dispatched`).

## Server functions (`src/lib/certificates/certificates.functions.ts` + new `print-pack.server.ts`)

**New `print-pack.server.ts`** (server-only helper):
- `buildMergedPrintPack(batchId)` — loads every issued registration in the batch, streams each stored PDF from the `certificates` bucket, concatenates with pdf-lib, uploads the result to `certificates/{providerId}/{batchId}/print-pack.pdf`, returns the storage path. Cached — regenerated only if missing or if a registration was re-issued after the cached copy.
- `buildIndividualZip(batchId)` — bundles the same PDFs into a ZIP (using `fflate`, Worker-safe), uploads to `certificates/{providerId}/{batchId}/print-pack.zip`.

**New server functions:**
- `adminDownloadPrintPack({ batchId, format: "merged" | "zip" })` — admin-gated, ensures the file exists (builds on first call), returns a 15-minute signed URL.
- `adminMarkBatchPrinted({ batchId })` — admin-gated. Verifies status is `awaiting_print`, sets `status = 'printed'`, `printed_at = now()`, `printed_by = auth.uid()`. Idempotent.

**Modified:**
- `adminMarkBatchDispatched` — precondition changes from `status IN ('awaiting_print','printed')` to `status = 'printed'`. Returns a clear error if the batch hasn't been marked printed.

## Admin UI (`src/routes/admin_.certificates.tsx`)

Print Queue row actions become a small stepper — one action visible at a time based on status:

- `awaiting_print` → **Download print pack** (primary, opens merged PDF in new tab) + overflow menu: "Download individual PDFs (ZIP)". A secondary **Mark as printed** button sits alongside, enabled once the download has been triggered at least once (soft nudge, not a hard block — admin can still click it directly).
- `printed` → shows "Printed {relative time} by {admin name}" + **Create label & dispatch** (enabled). Small "Re-download print pack" link for reprints.
- `dispatched` → existing tracking display + label download.

The existing `DispatchDialog` gets a guard: if status ≠ `printed`, show inline warning "Mark this batch as printed before generating a label" and disable the confirm button.

## Provider UI

Batches tab gains one extra status label between "Being prepared for dispatch" and "Shipped":
- `awaiting_print` → "Being prepared for dispatch"
- `printed` → "Ready for dispatch — Royal Mail collection pending"
- `dispatched` → existing tracking display

## Out of scope for this change

- Automated print-on-demand vendor (Cloudprinter / Doxzoo) — revisit at volume.
- Per-certificate reprint workflow (reprint one learner without regenerating the whole pack).
- Print-pack watermark ("BATCH XYZ — {date}") on each page — easy add later if useful for physical sorting.

## Files touched

- `supabase/migrations/{timestamp}_certificate_batch_printed_state.sql` (new)
- `src/lib/certificates/print-pack.server.ts` (new)
- `src/lib/certificates/certificates.functions.ts` (add 2 fns, tighten dispatch precondition, extend `AdminBatchDTO` + `PrintQueueRowDTO` with printed fields)
- `src/routes/admin_.certificates.tsx` (Print Queue action stepper + dispatch guard)
- `src/routes/_authenticated/_professional/dashboard_.students.tsx` (add `printed` status label in batches list)
- `src/integrations/supabase/types.ts` (regenerated after migration)
