
## Goal

Every new review goes into an admin approval queue. AI runs a pre-screen for promo/profanity/PII/fake-signals and surfaces warnings (it never auto-rejects). Reviewer IP + email are captured so AI can flag dodgy patterns (same IP / same email across pros, burst submissions). Admin + the affected pro get notified on submit, and the admin sidebar gets a "Reviews" badge that mirrors the Support unread pattern.

## Database (one migration)

`reviews` — keep existing rows, add columns:
- `moderation_status` text default `'pending'` — `pending | approved | removed`
- `ai_verdict` text — `clean | warning | suspect`
- `ai_flags` jsonb — `{ profanity, promo, pii, fake_signals, dedupe }` with per-check `{ hit: bool, reason: string }`
- `ai_checked_at` timestamptz
- `submitter_ip` inet (server-captured, never exposed publicly)
- `submitter_user_agent` text
- `admin_notified_at`, `pro_notified_at` timestamptz
- `moderated_by` uuid, `moderated_at` timestamptz, `moderation_note` text

Backfill existing rows: `moderation_status='approved'`, `ai_verdict='clean'` so nothing in the wild disappears.

Public-facing read changes:
- `listPublicReviewsBySlug` and any public/profile queries filter `moderation_status='approved'`.
- Old `status='published'` stays as the publish-state field; `moderation_status` is the new gate. Public views require BOTH `status='published'` AND `moderation_status='approved'`.

New table `review_notifications` (drives the sidebar badge, same shape as support):
- `id`, `review_id`, `recipient_user_id`, `recipient_role` (`admin | professional`), `read_at`, `created_at`
- RLS: recipient can read/update their own rows; service_role full; admin can read all via `has_role`.
- GRANTs per project rules.

RPC updates:
- `submit_review_by_token(token, rating, title, body, client_name, client_email, ip, user_agent)` — sets `moderation_status='pending'`, `status='pending'` (not published), inserts notification rows for admin(s) + the pro, returns the new review id.
- New `admin_moderate_review(review_id, action, note)` where action is `approve | remove`. Approve sets `status='published'`, `moderation_status='approved'`, `published_at=now()`. Remove sets `moderation_status='removed'`, `status='removed'`. Both mark moderator + close notifications.

## AI pre-screen (server function)

`src/lib/reviews/moderate.functions.ts` — `runReviewModeration(reviewId)`:
- Loads the review + last 90 days of reviews from the same `submitter_ip`, `client_email`, and `professional_id`.
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured `Output.object` schema returning the five flag groups.
- Heuristic checks layered on top of AI (cheap + deterministic):
  - Profanity: regex word list
  - Promo: URL/`@handle`/phone/discount-code regex
  - PII: email/phone/postcode regex in `body`
  - Fake/bot: rating-vs-sentiment mismatch (AI), duplicate body hash vs last 90d
  - Dedupe: same IP across ≥2 pros in 7d, same email across ≥3 pros in 30d, ≥3 reviews from same IP in 24h
- Writes `ai_verdict`, `ai_flags`, `ai_checked_at`. Never changes `moderation_status` — admin always decides.

Trigger: invoked from `submit_review_by_token` flow (server function fires it after RPC insert, fire-and-forget so the reviewer's "thanks" page isn't blocked).

## Token submission flow (`/r/$token`)

- Server function that backs the form now captures `getRequestIP()` + `user-agent` and passes them to the RPC.
- Success screen copy updates to: "Thanks — your review will appear on the pro's profile once our team has checked it (usually within 24 hours)."

## Admin `/admin/reviews` rewrite

Replaces the current "Flagged queue" mock with a real moderation queue:
- KPI cards: Pending, Approved (30d), Removed (30d), Avg AI risk
- Tabs: `Pending` (default) · `Approved` · `Removed` · `All`
- Each row shows: rating, body preview, pro name, reviewer name+email (admin-only), submitted IP (admin-only), AI verdict pill (clean / warning / suspect) with hover-tooltip listing each flag + reason, and Approve / Remove buttons (shadcn AlertDialog confirm on Remove).
- Suspect rows expand to show related-review list (same IP / same email) for context.

## Notifications

- Sidebar: add `ReviewsUnreadBadge` next to the existing `SupportUnreadBadge` in `DashboardShell.tsx`, wired to a new `useReviewsUnread()` hook (mirrors `useSupportUnread`) querying `review_notifications` for the current user.
- Bell icon (admin top-bar): include review notifications in the existing notification feed; clicking jumps to `/admin/reviews?focus={id}`.
- Pro dashboard: same `useReviewsUnread()` powers a badge on the pro's own `/dashboard/reviews` nav item. Pro sees a neutral "1 review awaiting REPs approval" row at the top of their reviews page until it's approved/removed.
- Email: keep existing review-request emails as-is. No new transactional email for the held-state (in-app + bell only) — call out if you want one added.

## Things explicitly NOT in scope

- No automatic publish path. Every review waits for admin even if AI says clean.
- No reviewer email on the held state.
- No changes to the public profile review card visuals.

## Technical notes

- IP capture uses `getRequestIP({ xForwardedFor: true })` inside the server fn that calls the RPC — never trust client-supplied IP.
- `ai_flags` + `submitter_ip` are admin-only; RLS on `reviews` extends the existing select policy so public/pro can't read those columns (use a `public_reviews` view that projects only safe columns, swap profile queries to it).
- New badge query polls every 30s like `useSupportUnread`.
