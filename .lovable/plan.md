## Goal

1. Make AI moderation actually run on every new review, and have it flag profanity / abuse / PII (not just `fake` / `promo`).
2. Remove the "pro replies to a review" feature end-to-end — UI, server fns, email, RPCs, columns.

---

## Part 1 — Fix AI moderation

### 1a. Run moderation reliably (not fire-and-forget)

In `src/lib/reviews/reviews.functions.ts`:
- Replace `void runReviewModerationFireAndForget(row.id)` in `submitReviewByToken` (and the other call site around line 589) with an `await` of `runReviewModeration({ data: { reviewId: row.id } })`, wrapped in a try/catch so a moderation failure never blocks the submit. Adds ~1–2s to the submit response but guarantees `ai_verdict` is written before the row appears in the queue.
- Remove the now-unused `runReviewModerationFireAndForget` helper.

### 1b. Expand the moderation prompt

In `src/lib/reviews/moderate.functions.ts`:
- Update the system prompt + JSON schema to also return `profanity`, `abuse`, and `pii` (alongside `fake` and `promo`), each as `{ hit, reason }`.
- Update verdict mapping so any `profanity.hit` or `abuse.hit` produces at minimum a `warning`; `abuse.hit` with strong signals (or 1★ + abuse) produces `suspect`.
- Update the `AiFlags` type in `src/lib/reviews/reviews.functions.ts` (and any TS surface in `admin_.reviews.tsx`) to include the three new flag keys so the existing "flags" chip strip in the admin queue renders them automatically.

### 1c. One-shot backfill of stuck rows

- Run `runReviewModeration` for the two existing rows where `ai_verdict IS NULL` (the 18:11 and 20:55 submissions) via a quick admin-only invocation, so the queue stops showing them as "AI: pending".

---

## Part 2 — Remove the pro reply-to-review feature

### 2a. Public profile (`src/routes/pro.$slug.index.tsx`)
- Delete the "Reply from the pro" panel rendered under each review (the `bg-reps-warm-white` / `border-l-2 border-reps-orange/40` block).
- Stop selecting `response` / `responded_at` / `response_edited_at` on the public query.

### 2b. Pro dashboard (`src/routes/_authenticated/_professional/dashboard_.reviews.tsx`)
- Remove the three reply states (Reply button + Textarea, "Your reply" panel, Edit/Save/Cancel, Delete + AlertDialog).
- Remove the "Awaiting reply" KPI tile and the response-rate stat (they're meaningless once replies are gone).
- Keep the rest of the page (list, filters, KPIs for total / avg rating / new this month).

### 2c. Server functions (`src/lib/reviews/reviews.functions.ts`)
- Delete `respondToReview`, `deleteReviewResponse`, and `respondSchema`.
- Drop `response`, `responded_at`, `response_edited_at` from `ReviewDTO` and from every `select(...)` projection (`listMyReviews`, `listPublicReviewsBySlug`, etc.).
- Delete the `sendReviewReplyEmailFireAndForget` helper (and any imports).

### 2d. Email template
- Delete `src/lib/email-templates/review-reply.tsx`.
- Remove the `review-reply` entry from `src/lib/email-templates/registry.ts`.

### 2e. Database (one migration)
- `DROP FUNCTION public.upsert_pro_review_response(uuid, text);`
- `DROP FUNCTION public.clear_pro_review_response(uuid);`
- `ALTER TABLE public.reviews DROP COLUMN response, DROP COLUMN responded_at, DROP COLUMN response_edited_at, DROP COLUMN response_notified_at;`
- Revert the pro-update RLS policy on `reviews` back to its pre-reply state (or drop it entirely if it only existed to allow reply writes).

### 2f. Types
- After the migration, `src/integrations/supabase/types.ts` will regenerate without the dropped columns; any leftover references in components will surface as TS errors and get cleaned up in the same pass.

---

## Things explicitly NOT in scope

- No change to the public review submission flow (`/r/$token`).
- No change to AI moderation of replies (the feature is gone).
- No change to admin reviews moderation UI other than the new flag chips (profanity / abuse / pii) appearing when the AI returns them.
- No "report this review" or "contact the reviewer" replacement flow — pros simply have no public response mechanism anymore.

---

## Order of operations

1. Ship Part 1 first (small, isolated, fixes the visible "AI: pending" bug).
2. Then Part 2 in a single pass: migration → server fns → UI → email template → types cleanup.
