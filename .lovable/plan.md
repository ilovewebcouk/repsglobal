## Goal
Give training providers a bulk-friendly Request-a-Review dialog: a single-entry form (email + optional name) AND a CSV upload for many past learners at once. Trainer flow is untouched.

## Scope
- Provider-only UI change (organisation ReviewsPage).
- One new server function that batches through the existing `review_requests` insert + email pipeline.
- No schema changes, no RLS changes, trainer `dashboard_.reviews.tsx` and its `RequestReviewDialog` unchanged.

## Files to create

1. **`src/lib/reviews/reviews.functions.ts`** — add `createReviewRequestsBulk`
   - Auth: same `requireSupabaseAuthWithImpersonation` middleware as `createReviewRequest`.
   - Input: `{ entries: Array<{ client_email, client_name? }> }`, capped at 200 rows per call, emails validated + lowercased + de-duplicated within the batch.
   - Logic: mirrors `createReviewRequest` per row:
     - Resolves the caller's `professionals` row once.
     - Loops rows: generate token, insert into `review_requests` (`status: 'sent'`, 90-day expiry), fire the same `review-request` transactional email.
     - Per-row try/catch so one bad email doesn't abort the batch.
   - Returns `{ sent: number, failed: Array<{ email, reason }> }`.
   - No new tables, no policy changes — same `review_requests` rows the single fn writes.

## Files to edit

2. **`src/components/dashboard/organisation/ReviewsPage.tsx`** — replace the existing `RequestReviewDialog` used inside this file with a provider-specific version:
   - Two tabs inside the same dialog: **Single** and **CSV upload**.
     - **Single** tab: identical to current (email required, name optional). Note: today's dialog also has "service" — provider CSV won't have it, so I'll drop the service field in the provider dialog to keep the two tabs consistent. (Trainer dialog keeps service.)
     - **CSV upload** tab:
       - File input accepts `.csv` (client-side parse, no upload to storage).
       - Simple parser: split lines, skip header if row 1 is `email,name` (case-insensitive), otherwise treat every row as data.
       - Preview table (first 10 rows + total count + invalid-row count).
       - Skips blank rows and rows where the email column fails a basic email regex; shows them under an "Invalid rows will be skipped: N" hint.
       - "Download template" link — a Blob-generated `review-requests-template.csv` with `email,name` header + one example row. No file added to the repo.
   - Copy uses "past learner(s)" instead of "past client(s)" (provider context).
   - Submit calls `createReviewRequestsBulk`; on success shows `Sent N requests${failed ? `, ${failed} failed` : ""}` toast and invalidates `["my-review-requests"]`.
   - Both the "Request a review" header button and the panel-level "Send another" button open the same new dialog.

## Files NOT changed
- `src/routes/_authenticated/_professional/dashboard_.reviews.tsx` (trainer route + its `RequestReviewDialog`) — no changes.
- `src/lib/reviews/reviews.functions.ts` existing exports — untouched; only a new export is added.
- Email template `review-request` — reused as-is.
- Database schema, RLS, migrations — untouched.

## UX details
- CSV parse is pure client-side JS (no new npm dep). Handles quoted values with a small tolerant parser (`"Smith, Jane"` type cases).
- Max 200 rows per submission enforced client-side + server-side (matches server cap).
- Duplicate emails within a single CSV are de-duped before send (keeps the first name).
- Emails already in `review_requests` for this provider aren't specially handled — the server just inserts a fresh request, same as current single-send behaviour.

## Verification
1. Trainer at `/dashboard/reviews` sees the exact same "Request a review" dialog as before (email + name + service).
2. Provider at `/dashboard/reviews` sees the new tabbed dialog (Single | CSV upload).
3. Single tab works end-to-end (creates one `review_requests` row + email).
4. CSV upload with a 3-row file creates 3 rows + 3 emails; toast shows "Sent 3 requests"; the Sent requests panel refreshes.
5. Invalid CSV rows are counted and skipped, not sent.
6. Typecheck passes.
