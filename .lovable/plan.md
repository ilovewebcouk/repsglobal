## Two changes to the certificate pipeline

### 1) Provider logo upload — enforced 160×60

The `profiles.certificate_logo_url` column already exists and the PDF renderer already draws it at the `provider_logo` slot in the field map. What's missing is an upload UI. Add it to the existing **Providers** panel in `/admin/certificates` (same row as centre number), since providers don't have a self-serve certificate settings screen yet.

- **`src/lib/certificates/providers.functions.ts`**
  - Return `certificate_logo_url` alongside `center_number` in `listProviderCenterNumbers`.
  - New server fn `setProviderCertificateLogo({ provider_id, data_base64, mime })`:
    - Decode the image server-side.
    - Read intrinsic dimensions (use a tiny PNG/JPEG header parser — no `sharp`, Workers-safe).
    - **Reject anything that isn't exactly 160×60 px** with a clear error ("Logo must be exactly 160×60 px — got NxN").
    - Upload to the existing `certificate-templates` bucket under `provider-logos/<provider_id>.<ext>`, get public URL, write to `profiles.certificate_logo_url`.
  - New server fn `clearProviderCertificateLogo({ provider_id })` to remove it.

- **`src/routes/admin_.certificates.tsx` — `ProvidersPanel`**
  - Show a 160×60 preview thumbnail per row (or an "Upload logo" button when empty).
  - File input `accept="image/png,image/jpeg"`. Client-side pre-check reads the file into an `Image` and blocks upload with a toast if dimensions ≠ 160×60, so admins get feedback before the round trip. Server still re-validates as the source of truth.
  - "Remove" button when a logo is present.

- **`src/lib/certificates/pdf.server.ts`**
  - The renderer currently letterboxes the logo inside its box preserving aspect. Since uploads are now guaranteed 160×60 and the template's `provider_logo` box is 160×60, the fit is exact — no behaviour change needed, but drop the "letterbox" scaling for the provider logo and draw it filling the box (guarantees no whitespace edges).

### 2) Unit summary pagination — 12 modules per page

Currently the unit summary template PDF is appended once and all items flow into a single list. Change to paginate at **12 items per page**, cloning the unit summary template page for each chunk.

- **`src/lib/certificates/pdf.server.ts` → `renderCertificateWithTemplate`**
  - When `unitPdfBytes && fieldMap.unit_summary` and `input.unitSummary.length > 0`:
    - Split `unitSummary` into chunks of 12.
    - For each chunk, copy the unit-summary template page into `output` as a new page and call `overlayPage` with that chunk as the `units` argument.
  - `overlayPage` already renders the list from the passed `units` array — pass the chunk instead of the full list. `drawList` numbering is 1-based off the chunk index, so pass a `startIndex` so page 2 continues "13., 14., …" not "1., 2., …".
  - `drawList` signature grows a `startIndex = 0` param; the numeric label becomes `${idx + 1 + startIndex}.` and the gutter width is sized off the widest label across the whole list (`unitSummary.length`), not the chunk, so the left margin stays consistent across pages.

- **Overflow safety**: if a chunk of 12 still visually overflows the template box (long titles wrapping), that's an artwork/box-height concern — out of scope. 12-per-page is the hard cap regardless of wrap depth for this pass; can revisit with a measured "fit as many as will render" pass later if needed.

- **Legacy renderer (`pdf-legacy.server.ts`)**: same pagination rule — 12 per page, new page after each chunk. Keep in sync so fallback PDFs match.

### Out of scope

- Provider self-serve certificate settings page (still admin-managed).
- Auto-resize / server-side resample of oversized logos — spec says no exceptions, so we reject instead.
- Dynamic per-page fit for unit summary (fixed 12/page for this pass).
