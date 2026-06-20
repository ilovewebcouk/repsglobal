
## Goal

Trainers can write/edit/delete a reply to each of their reviews from `/dashboard/reviews`. Admins see the reply (read-only) on `/admin/reviews`. Public pages (`/pro/$slug`, etc.) stay untouched — the reply is held in the DB but never rendered publicly.

The backend (columns, RPCs, `replyToReview`/`clearReviewReply`, email template) is already in place from the previous turn. This plan only adds DTO fields + UI.

## 1. Extend DTOs in `src/lib/reviews/reviews.functions.ts`

- `ReviewDTO`: add `response: string | null`, `responded_at: string | null`, `response_edited_at: string | null`, `response_notified_at: string | null`, `moderation_status: string`.
- `listMyReviews` select: add `response, responded_at, response_edited_at, response_notified_at, moderation_status`.
- `AdminReviewRow`: add the same four `response*` fields.
- `adminListReviews` select + row mapping: add the four fields.
- `listPublicReviewsBySlug`: **leave untouched** — public surface stays reply-free.

## 2. Trainer dashboard reply composer (`src/routes/_authenticated/_professional/dashboard_.reviews.tsx`)

For each review in the list, render a new "Your reply" block under the existing review body:

- If `response` exists: show the reply text in an orange-bordered card with timestamp ("Replied {date}" + "edited {date}" when applicable), plus **Edit** and **Delete** buttons.
- If no reply: show an inline "Reply to this review" button that expands a textarea (1–1000 chars, char counter) with **Send reply** / **Cancel**.
- Reply controls are only enabled when `moderation_status === 'approved'` (RPC enforces this anyway — UI just disables and shows a small "Reply available once approved" hint otherwise).
- Mutations:
  - `replyMutation` → `replyToReview({ data: { review_id, response } })`, invalidate `["my-reviews"]`, toast.
  - `clearMutation` → `clearReviewReply({ data: { review_id } })`, invalidate, toast.
- Small note under the composer: "Your client will get a one-off email when you publish your first reply."

No changes to KPIs panel, sent-requests panel, or "How reviews work" copy.

## 3. Admin moderation visibility (`src/routes/admin_.reviews.tsx`)

For each row, when `response` is set, render a read-only reply card beneath the review body:

- Label: "Trainer reply"
- Body: `response` (whitespace-preserved)
- Meta line: "Replied {responded_at}" · "Edited {response_edited_at}" (if set) · "Client notified {response_notified_at}" (if set)
- Styling: muted panel, no edit affordance. Admin does NOT moderate replies in this pass.

## 4. Out of scope (explicit)

- `src/routes/pro.$slug.index.tsx` — public profile, untouched.
- `src/routes/reviews.tsx`, city pages, homepage rating tiles — untouched.
- `listPublicReviewsBySlug` — does not return `response`.
- No reply-moderation flow for admin (can add later if needed).
- No tier-gating on replies (every trainer with approved reviews can reply — matches old behaviour).

## Technical notes

- `replyToReview` already handles first-publish email (idempotent via `response_notified_at`) and edit-vs-create branching via the `upsert_pro_review_response` RPC.
- `clearReviewReply` clears all four columns including `response_notified_at`, so a later re-publish will re-send the notification email — acceptable for now.
- All new DTO fields are nullable; existing consumers that don't read them are unaffected.
- Total diff: ~3 files, ~150 LOC.
