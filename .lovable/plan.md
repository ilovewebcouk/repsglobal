## Goal
When an admin removes a review, capture a reason and tell the trainer why — with an AI-drafted reason they can edit before sending.

## Admin side (`/admin/reviews`)

1. Replace the bare "Remove" button with a **Remove dialog**:
   - Reason category (radio): Off-topic · Abusive / hateful · Fake or incentivised · Personal data / privacy · Defamatory · Spam · Other.
   - "Reason shown to trainer" textarea (required, 20–600 chars).
   - **✨ Draft with AI** button — calls Lovable AI (`google/gemini-3-flash-preview`) with the review body + chosen category, returns a 2–4 sentence professional reason. Trainer-safe tone, no client PII repeated back, explains the policy hit and what they can do next.
   - "Internal note (admin only)" optional textarea.
   - Confirm → calls existing `admin_moderate_review(_review_id, 'remove', _note)` where `_note` becomes the trainer-visible reason; internal note stored separately.
2. Approve stays one-click.

## Schema (small additive migration)
Add to `public.reviews`:
- `removal_reason text` (trainer-visible)
- `removal_category text`
- `removal_internal_note text` (admin-only)
- `removal_notified_at timestamptz`

Update `admin_moderate_review` to write these on `'remove'` and clear them on `'approve'`. Also create one row in `review_notifications` for the pro with `recipient_role='professional'` and a new kind so the trainer's bell pings (existing notifications fan-out trigger only fires on insert, so we insert explicitly here).

## Trainer side (`/dashboard/reviews`)
- Add a **"Removed by REPs"** section above "All reviews" listing reviews where `moderation_status='removed'` and `removal_reason IS NOT NULL`:
  - Greyed card: client name, stars, snippet of body, "Removed on {date}", and the reason in an orange-bordered callout.
  - Acknowledge button → marks the review_notification read.
- "All reviews" continues to filter removed ones out (already done).

## Email
- Queue a `review-removed` branded email (same `contact-autoresponse`-style template family) to the trainer with the reason + a "View in dashboard" link. Sent via existing email queue pipeline.

## AI endpoint
- New `draftReviewRemovalReason` server function (TanStack `createServerFn`, admin-gated via `has_role`) — input `{ reviewId, category }`, returns `{ draft: string }`. Uses Lovable AI Gateway helper (already standard in project).

## Files touched
- `supabase/migrations/<new>.sql` — columns + updated `admin_moderate_review` + notification insert.
- `src/lib/reviews/reviews.functions.ts` — extend `adminModerateReview` input (category, reason, internal note), extend `AdminReviewRow` / `ReviewDTO` with removal fields, add `draftReviewRemovalReason`, enqueue removal email.
- `src/lib/email-templates/review-removed.tsx` — new branded template; register in `registry.ts`.
- `src/routes/admin_.reviews.tsx` — Remove dialog with AI draft.
- `src/routes/_authenticated/_professional/dashboard_.reviews.tsx` — "Removed by REPs" section.

## Out of scope
- No public-facing changes.
- No change to flag/approve flow beyond the dialog swap.
- Admin can still leave reason blank only if they tick "skip notification" (off by default) — TBD whether you want that escape hatch.

## One thing to confirm
Should the trainer also get an **email** for removals, or in-app notification only? (Plan above includes email; happy to drop it.)
