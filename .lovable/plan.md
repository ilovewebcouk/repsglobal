# Move provider certificate-logo upload to the provider dashboard

I got the last change wrong: I put the 160×60 logo uploader inside `admin/certificates` (`ProvidersPanel`), but this is meant to be **self-serve for training providers** — they upload their own logo that then appears on every certificate they issue.

## What changes

### 1) Add the uploader to the provider's own certificates surface
- Add a small "Certificate branding" card at the top of the **Certificates** tab in `src/routes/_authenticated/_professional/dashboard_.students.tsx` (the training-provider certificates hub).
- Card contents:
  - 160×60 preview slot showing the current logo (or an empty state).
  - "Upload logo" / "Replace" / "Remove" buttons.
  - Helper text: **"PNG or JPG, exactly 160 × 60 pixels. This logo appears on every certificate you issue."**
  - Client-side pre-check: read intrinsic dimensions before upload; if not exactly 160×60, block with a toast and don't call the server.

### 2) Server functions — reuse, but reauthorise as the provider
- `setProviderCertificateLogo` / `clearProviderCertificateLogo` in `src/lib/certificates/providers.functions.ts` already exist.
- Change them so they act on **the caller's own provider profile** (via `requireSupabaseAuth` + `context.userId`), instead of taking a `providerId` from an admin. Keep the strict 160×60 header-decode check and the `certificate-provider-logos` bucket upload, writing to `profiles.certificate_logo_url`.
- Only providers with an approved provider role may call it; anyone else gets a 403.

### 3) Remove the admin-side uploader
- Strip the logo upload / preview / remove UI I added to `ProvidersPanel` in `src/routes/admin_.certificates.tsx`. Admin no longer manages this — it's provider self-serve.
- (Optional, out of scope for this pass) An admin read-only preview could come later; not building it now.

### 4) No changes to the PDF renderer
- `src/lib/certificates/pdf.server.ts` already draws `certificate_logo_url` at the 160×60 `provider_logo` slot with no letterboxing — that stays.
- Unit-summary pagination (12 per page) also stays.

## Out of scope
- No changes to the certificate template, PDF layout, or unit-summary logic.
- No admin override to upload on behalf of a provider (can be added later if you want it).
- No auto-resize — spec is "exactly 160×60, no exceptions", so we reject anything else.

Confirm and I'll implement.
