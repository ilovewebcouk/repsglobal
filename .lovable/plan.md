## Add provider centre number to certificates

Every training provider gets a centre/membership number that prints on the certificate directly under (or next to) the provider name, prefixed `Centre No. `.

### 1. Data model

Add `center_number text` to `public.profiles` (nullable, unique when set). Admin-editable only. No backfill — existing rows stay null until an admin fills them in.

### 2. Admin UI

On the existing provider admin edit surface (`/admin/professionals` provider detail — same place `certificate_logo_url` is edited), add a "Centre number" text input. Save via the existing provider update server fn.

### 3. Certificate pipeline

- `src/lib/certificates/issue.server.ts` — also select `center_number` from `profiles`, pass through as `providerCenterNumber` on the `CertificatePdfInput`.
- `src/lib/certificates/pdf.server.ts` —
  - Extend `CertificatePdfInput` with `providerCenterNumber: string | null`.
  - Extend `buildFieldValues` to expose two new field keys:
    - `center_number` → raw number, empty string when null
    - `center_number_line` → `"Centre No. <n>"`, empty string when null
  - Add both to the `TextField.field` union in the doc comment.
- `src/lib/certificates/pdf-legacy.server.ts` — draw the same `Centre No. …` line below provider name when present.
- `src/lib/certificates/preview.server.ts` — pass a sample `providerCenterNumber: "REPS-000123"` so the editor preview shows it.

### 4. Template editor

`src/components/admin/certificates/TemplateEditor.tsx` — add `center_number` and `center_number_line` to the field-picker dropdown for text fields so admins can position them on their uploaded template. No forced default coordinates — admin drags to place.

### 5. Default field map

Update the default template's `field_map` (in DB via migration) to include a `center_number_line` text field on the certificate page, positioned just under the existing `provider_name` field. Only apply when a template row has `_origin: "top-left"` and no existing entry for that key.

### Out of scope

- No changes to verification page / public certificate lookup (can add later).
- No auto-generation of centre numbers — admins type them in.

### Verification

- Migration adds column and default-map entry.
- Admin edits a provider, sets centre number, issues a batch → PDF shows `Centre No. <n>` under provider name.
- Providers with null centre number: line is simply omitted (empty string skipped by `drawText`).
