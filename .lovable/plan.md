## Goal

Pro can reply once to any approved review, edit/delete that reply, the reply renders on `/pro/$slug`, and the reviewer is emailed when the reply is first published.

## What's already done (don't re-build)

- `reviews.response` + `reviews.responded_at` columns exist.
- `respondToReview` server fn writes them (called from `/dashboard/reviews`).
- KPI "Awaiting reply" + response-rate counters work.
- `listPublicReviewsBySlug` already selects `response, responded_at`.

## 1. Database (one migration)

`reviews` — add:
- `response_edited_at timestamptz`
- `response_notified_at timestamptz` — idempotency anchor for the email

Tighten the pro-update RLS policy on `reviews` so a pro can update only `response` (+ implicit `responded_at`/`response_edited_at` stamped by the RPC), and only on rows where `professional_id = auth.uid()` AND `moderation_status = 'approved'`.

New RPC `upsert_pro_review_response(_review_id uuid, _response text)`:
- SECURITY DEFINER, asserts caller owns the review and review is approved.
- Length 1–1000 chars.
- First call: sets `response`, `responded_at = now()`.
- Subsequent: sets `response`, `response_edited_at = now()`.

New RPC `clear_pro_review_response(_review_id uuid)`:
- Same ownership/approval check. Nulls all four columns (`response`, `responded_at`, `response_edited_at`, `response_notified_at`).

## 2. Pro dashboard (`/dashboard/reviews`)

Replace the current "show Reply button only when `!r.response`" branch with three states:

- No reply: existing `Reply` button + inline Textarea (cap at 1000 chars, show counter).
- Reply exists, not editing: show the reply in the existing "Your reply" panel, plus `Edit` and `Delete` buttons (Delete behind a shadcn `AlertDialog` confirm).
- Editing: same Textarea pre-filled with current reply + `Save` / `Cancel`.

Server-fn changes in `src/lib/reviews/reviews.functions.ts`:
- `respondToReview` switches from a direct `update` to calling `upsert_pro_review_response` RPC, and after success runs the email step below (see §4).
- New `deleteReviewResponse` server fn calling `clear_pro_review_response`. No email on delete.
- Tighten `respondSchema` from `.max(2000)` to `.max(1000)`.

## 3. Public profile (`/pro/$slug`)

`pro.$slug.index.tsx` currently renders a hardcoded `REVIEWS` mock array in the "What Clients Say" section. Wire it to real data:

- Fetch `listPublicReviewsBySlug({ slug, limit: 6 })` via React Query in the existing route loader pattern.
- Replace the `REVIEWS.map(...)` block (lines ~738–762) with real rows: client name, "X months ago" via existing time helper, star row, `r.body`.
- When `r.response` is set, render directly underneath in a `bg-reps-warm-white` panel with `border-l-2 border-reps-orange/40`:
  - Line 1 (meta): `{pro.full_name}` · `Reply from the pro` · relative date · `· edited` suffix when `response_edited_at` is set.
  - Line 2: `r.response`.
- Stat tiles (rating dist, "based on N reviews") swap from the mock `RATING_DIST` / `pro.reviews` to `count` + a derived distribution from the same query (or hide the bar chart when n < 3 to avoid noise — keeps the visual but driven by real data).
- "See all N reviews" anchor stays; out of scope to build an "all reviews" page in this pass.

No other visual changes to the reviews section — typography, radii, colors all stay locked.

## 4. Email reviewer on first publish

New React Email template `src/lib/email-templates/review-reply.tsx`:
- Subject: `{pro_full_name} replied to your review`
- Body: 1-line context ("You left a {N}-star review on REPs"), the reply text in a quoted block, CTA button → `https://repsuk.org/pro/{slug}#reviews`.
- Register in `src/lib/email-templates/registry.ts` as `review-reply`.

Send wiring (inside `respondToReview` server fn, after RPC success):
1. Resolve reviewer email server-side via `supabaseAdmin`:
   - Prefer `reviews.client_email` (already populated for token-flow submissions).
   - Fallback: join `profiles`/`auth.users` via `reviews.client_user_id`.
   - If neither resolves, skip silently.
2. Send only when `response_notified_at IS NULL`. Edits never re-trigger.
3. Call existing `sendTransactionalEmail` with idempotency key `review-reply-{review_id}`.
4. On success, stamp `response_notified_at = now()` via service-role update.
5. Suppression + unsubscribe footer handled by the existing send route.

No bell notification, no in-app badge for the reviewer — single email, that's it.

## Things explicitly NOT in scope

- "All reviews" page on the public profile.
- AI moderation of replies (admin can still remove the parent review, which hides the reply visually since profile renders only `moderation_status='approved'` rows).
- Re-notifying reviewer on reply edits.
- Email when a review is hidden/removed after a reply was already sent.
