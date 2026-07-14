Add a visual editor to the Templates panel at `/admin/certificates` so you can see the certificate render live and drag fields into position instead of guessing coordinates.

## What you get

Clicking **Edit** on a template opens a full-width two-pane editor:

```text
┌───────────── Fields (left) ─────────────┬────────── Live preview (right) ──────────┐
│ Page 1 · certificate                    │  [Page 1] [Page 2]                       │
│  • learner_name    x[ 300] y[ 420]      │                                          │
│    size[28] align[center] bold          │   ┌────────────────────────────────┐     │
│    color[#111]                          │   │                                │     │
│  • course_line     …                    │   │   Rendered template PDF with   │     │
│  • issue_date      …                    │   │   sample data overlaid.        │     │
│  + add text field / image / list        │   │   Draggable markers per field. │     │
│                                         │   │                                │     │
│ Page 2 · unit summary                   │   └────────────────────────────────┘     │
│  • list: unit_summary  x/y/maxWidth/…   │                                          │
│                                         │   [Save field map]  [Discard]            │
└─────────────────────────────────────────┴──────────────────────────────────────────┘
```

Two ways to move a field:
1. **Drag** its marker on the preview — coordinates update in the inputs.
2. **Type** into the x / y / size / align inputs — marker moves.

The preview auto-refreshes (debounced ~400ms) after any change so the on-page result is always current. **Save field map** persists; leaving without saving discards.

## Technical details

**New server function** `previewCertificateTemplateWithMap({ id, field_map_json })` in `src/lib/certificates/templates.functions.ts`:
- Loads the template's uploaded PDFs from storage.
- Renders using the *supplied* field map (not the DB row), by extracting the overlay logic from `pdf.server.ts` into a small `renderCertificateWithTemplate(templateRow, fieldMap, sampleInput)` helper that both `generateCertificatePdf` and this new fn call.
- Returns `{ pdf_b64 }`. Removes the fragile "temporarily flip `is_default`" hack in the existing `previewCertificateTemplate`.

**New component** `src/components/admin/certificates/TemplateEditor.tsx`:
- Replaces the raw JSON textarea inside `TemplateRow` (JSON textarea kept behind an "Advanced / raw JSON" disclosure so you can still hand-edit).
- Left pane: structured form driven by the `CertificateFieldMap` type — grouped by page (certificate / unit_summary), then sections (text / images / list). Each text row: field name (select from known list), x, y, fontSize, fontWeight, align, color, maxWidth, uppercase.
- Right pane: renders live PDF via a blob URL in an `<iframe>` (browser's built-in PDF viewer). Refresh triggered by debounced state changes.
- **Drag overlay**: use `pdfjs-dist` on the client to rasterise page 1 (and page 2) of the returned preview PDF to a canvas at a fixed display width (~700px). Overlay absolutely-positioned `<div>` markers per text/image field. On drag, convert screen delta → PDF points using the canvas↔PDF scale. `pdfjs-dist` is standard for this and already worker-friendly.
- Toggle: **Show markers** (drag mode) / **Hide markers** (clean preview).

**Wiring** in `src/routes/admin_.certificates.tsx`:
- `TemplateRow` "Edit field map" opens the new `TemplateEditor` inline in place of the current textarea.
- The existing "Preview" button still opens the PDF in a new tab (unchanged).

**Sample data** used for the live render matches the existing `previewCertificateTemplate` sample ("Jamie Sample Learner", 6 units, etc.) so what you see is what learners will see.

## Out of scope
- Rotating fields or QR/logo drag-resize handles (positions still editable via inputs; keep MVP focused on the pain point — coordinates).
- Uploading new PDFs from inside the editor (still done via the existing upload form).
- Multi-user concurrent editing.

Nothing else on `/admin/certificates` changes.
