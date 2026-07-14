## What "Search & revoke" is meant to be

It's the admin's break-glass tool for one specific job: **find any certificate registration across every provider, and revoke it if REPs needs to invalidate it** (fraud, awarding-body withdrawal, wrong learner, provider off-boarded, etc.). Revoking flips the row's status, kills the public `/verify/<token>` page, and locks the PDF from re-download.

## Why you can't do anything right now

The Revoke button is coded to only appear when a row's status is `issued` or `dispatched`. Every row on your screen is `passed`, `enrolled`, or `canceled` — none of those have been turned into a live certificate yet, so there's nothing to revoke. The panel also has no other actions (no view, no filter, no context), so it looks like a dead-end search.

## Plan — make this tab actually usable

### 1. Rename + reframe
- Rename tab to **"Registrations"** (or keep "Search & revoke" but add a one-line subtitle: *"Find any learner registration across all providers. Revoke live certificates, view PDFs, or open the provider."*).
- Add a small legend of what each status means (`enrolled → passed → issued → dispatched`, plus `canceled`, `revoked`).

### 2. Add filters above the search box
- Status multi-select (enrolled / passed / issued / dispatched / canceled / revoked).
- Provider dropdown (typeahead).
- Date range (issued between).
- Empty-state copy: *"Search by cert number, learner email, name — or filter by status/provider."*

### 3. Give each row real actions (dropdown menu on the right)
Actions available depend on status:
- **View details** (always) — opens a drawer with full registration, batch, provider, IQA state, dispatch tracking.
- **Open provider** (always) — link to `/admin/providers/<id>`.
- **Download PDF** — when `issued` / `dispatched` / `revoked`.
- **Open public verify page** — when `issued` / `dispatched`.
- **Copy verify link** — when `issued` / `dispatched`.
- **Revoke certificate** — when `issued` / `dispatched`. Requires a reason (short textarea) + confirm dialog. Writes admin_audit_log.
- **Un-revoke / reinstate** — when `revoked`, admin-only, also audit-logged.
- **Mark dispatched manually** — when `issued` and no Royal Mail label (edge case).

### 4. Row visuals
- Show issued date + expiry (if any), batch ID chip, Ofqual number chip when present.
- Colour statuses consistently with the rest of the platform: `issued` emerald, `dispatched` emerald, `revoked` red, `canceled` white/50, `enrolled`/`passed` amber.

### 5. Revoke flow
- Confirm dialog replaces `window.confirm` — shows learner name, cert number, provider, and a required reason field (min 10 chars).
- On confirm: call `adminRevokeCertificate` with `{ registration_id, reason }`, then invalidate the search query and the provider's registrations query.
- Server side: extend `adminRevokeCertificate` to accept + persist a `revocation_reason` and `revoked_by` (already writes status; just widen the payload and column if missing — migration only if the column doesn't exist).

### 6. Empty-state + zero-result copy
- Zero results: *"No registrations match. Try a wider status filter or search by learner email."*
- Before first search: don't show a blank panel — show the 20 most recent registrations across the platform so the tab feels alive.

## Files this will touch
- `src/routes/admin_.certificates.tsx` — `SearchPanel` component (biggest change).
- `src/lib/admin/certificates.functions.ts` (or wherever `adminSearchRegistrations` / `adminRevokeCertificate` live) — add filter params + reason param + return richer row (issued_at, expiry, batch_id, verify_token, pdf_path).
- Possibly one migration to add `revocation_reason text` + `revoked_by uuid` + `revoked_at timestamptz` on `certificate_registrations` if not already present.

## Acceptance
- Tab loads with recent registrations pre-populated.
- Filters + search combine correctly.
- Every row has a working action menu; actions match status.
- Revoking an `issued` cert requires a reason, shows in audit log, and immediately breaks its public verify page.
- No row is ever a dead end.
