# Student certification & registration

Build the full pipeline for training providers to register learners against their approved REPs courses, pay REPs a per-certificate fee at batch checkout, and receive a REPs-branded digital certificate + unit summary (plus printed copies for UK providers) with a QR-code-verified public lookup.

## 1. Provider dashboard — new "Students" tab

Single top-level tab under `/dashboard/students` (sibling to Qualifications). Not nested inside each course.

**Sub-views (segmented):**
- **Learners** — master list of every learner the provider has ever added (name, email, courses taken, latest status). Add / edit / soft-delete.
- **Registrations** — one row per (learner × course). Columns: Learner, Course, Enrolled, Pass mark, Status (`enrolled → passed → pending_payment → paid → issued → dispatched`), Certificate #, QR link. Bulk actions: mark passed, add to basket.
- **Basket & checkout** — everything currently `passed` and unpaid, running total (£X × N), Stripe Checkout button.
- **Certificates** — issued only. Download e-cert PDF, resend email to provider, view public verify link.

## 2. Data model (new tables)

- `learners` — provider_id, full_name, email, dob (optional), country, created_by. Unique (provider_id, lower(email)).
- `certificate_registrations` — learner_id, provider_id, course_id (→ `provider_regulated_permissions.id`), reps_course_number (denormalised), level, status, enrolled_at, passed_at, marked_passed_by, paid_at, issued_at, dispatched_at, price_pence_at_issue, format (`digital`/`printed_and_digital`), certificate_number (e.g. `REPS-CERT-000001`, generated on issue), verification_token (opaque, in QR URL), pdf_path, unit_summary_pdf_path, batch_id.
- `certificate_batches` — provider_id, stripe_checkout_session_id, stripe_payment_intent_id, total_pence, count, status (`pending → paid → issued → fulfilled`), created_at, paid_at.
- `certificate_pricing` — single-row config (or key/value) holding `unit_price_pence`. Editable only by admin.

RLS: providers CRUD their own rows via `has_provider_access(provider_id)`; admin full; public gets a narrow read on `certificate_registrations` by verification_token only (for the QR verify page) exposing safe columns (learner name, course title, level, issued date, provider name, status).

## 3. Pricing (flat fee)

- Admin setting: single `unit_price_pence` (default e.g. £15). No per-course, no tier, no digital/printed price split — format is derived from country, price is the same.
- Snapshot into `price_pence_at_issue` at checkout so future price changes don't rewrite history.

## 4. Format — auto by provider country

- Provider profile already has country (verify in `provider_regulated_permissions` / providers table during build). If UK → `printed_and_digital`. Else → `digital`.
- No per-student toggle. Copy on the basket makes this explicit: "Your certificates will be printed and posted to your address on file, plus emailed as PDFs" vs "Digital certificates only for providers outside the UK".

## 5. Batch checkout (Stripe)

- Provider selects passed registrations → "Checkout N certificates for £Y".
- Server fn `createCertificateBatchCheckout`:
  1. Validate all rows belong to provider, status = `passed`, not already in an open batch.
  2. Insert `certificate_batches` (pending) + link registrations to it, flip their status to `pending_payment`.
  3. Stripe Checkout, `mode: payment`, one line item with quantity=N, unit_amount=`unit_price_pence`, metadata `{ kind: "cert_batch", batch_id, provider_id }`. Use platform account (REPs), not Connect — this is REPs revenue.
- Webhook `/api/public/webhooks/stripe` (extend existing): on `checkout.session.completed` with `kind=cert_batch`, mark batch `paid`, flip registrations to `paid`, then enqueue certificate issuance (synchronously for v1 — small volume).

## 6. Certificate issuance

Immediately on paid webhook:
1. Assign next `certificate_number` (sequence) + `verification_token` (`crypto.randomUUID`).
2. Server-side PDF generation using `pdf-lib` (Worker-safe): jointly branded certificate of achievement + unit summary from `spec_learning_outcomes` / `spec_modules`. Template locked to a REPs layout + provider name/logo; user will supply the final visual template — build with a clean placeholder now and swap the template file.
3. QR encodes `https://repsuk.org/verify/{verification_token}`. Generate with `qrcode` (pure JS, Worker-safe) as PNG data URL embedded in the PDF.
4. Upload PDF to Storage bucket `certificates` (private). Save `pdf_path`.
5. Email the provider (not the learner) via existing email pipeline: "N certificates ready" with a link back to the Certificates sub-view. Provider forwards to learners themselves.
6. For UK providers, also add the batch to an admin **Print queue** (see §8) with status `awaiting_print`.

## 7. Public verification page

- New public route `/verify/$token` (top-level, SSR on).
- Loader → public server fn that reads `certificate_registrations` by `verification_token` via a narrow `TO anon` SELECT policy projecting only safe columns.
- Renders: learner name, course title + level, REPs certificate number, issue date, provider name, "Valid" / "Withdrawn" badge. `head()` sets `robots: noindex`.
- Also add a manual lookup form at `/verify` (enter cert number + learner surname) that resolves to the same page.

## 8. Admin surfaces

Under `/admin` (verification section):
- **Certificate pricing** — edit `unit_price_pence`.
- **Batches** — list, filter by status, view learner list, download combined PDF pack.
- **Print queue** — UK batches awaiting print. Actions: mark `printed`, mark `dispatched` (records date; visible to provider). CSV export of address + learner names for the mail house.
- **Registrations** — global search by cert number / learner email / provider, revoke certificate (sets status `revoked`, verify page shows "Revoked").

## 9. Pre-work audit (before building)

Before writing any of the above, spawn one investigation sub-agent to confirm:
1. Provider country field — which table/column, and whether it's reliably populated for existing approved providers.
2. Existing Stripe webhook route path + how it dispatches by `metadata.kind` (so we extend, not fork).
3. Existing PDF generation utilities (if any) and whether `pdf-lib` + `qrcode` are already installed.
4. Provider-side auth guard used by qualifications routes so students routes match.

Findings feed back into the migration + server-fn file paths before implementation starts.

## 10. Build order

1. Audit (sub-agent) → confirm §9.
2. Migration: `learners`, `certificate_registrations`, `certificate_batches`, `certificate_pricing`, sequences, RLS, public verify policy, GRANTs.
3. Server fns: learners CRUD, registrations CRUD + mark-passed, batch checkout, admin pricing, admin revoke, public verify read.
4. Stripe webhook branch for `cert_batch`.
5. PDF + QR generator (placeholder template) + Storage bucket `certificates` (private).
6. Provider `/dashboard/students` UI (Learners / Registrations / Basket / Certificates).
7. Admin surfaces (Pricing / Batches / Print queue / global search + revoke).
8. Public `/verify/$token` + `/verify` lookup.
9. Email template "Your REPs certificates are ready".
10. QA pass end-to-end (test mode Stripe, sandbox provider, sample UK + international).

## Out of scope for v1

- Provider-issued certificate templates / co-branded artwork variants (uses one locked REPs template + provider name until you supply a final design).
- Learner-facing accounts or logins.
- Refunds / partial refunds on issued certificates (admin can revoke; refund done in Stripe dashboard manually).
- Bulk CSV learner import (add later once flow proves out).
- Automatic printer/mail-house integration — v1 is a CSV + PDF pack the admin hands off.
