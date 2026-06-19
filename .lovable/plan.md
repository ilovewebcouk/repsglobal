# Reviews module — Verified tier, admin moderation, public rating, BD backfill

Scope: Verified-tier professional reviews dashboard, admin moderation page, directory rating display wiring, and a one-off backfill of the uploaded BD CSV. Pro/Studio variants stay out of scope.

## 1. Data model (one migration)

Existing `reviews` already has id, professional_id, client_user_id, client_name, rating, title, body, source, status, response, responded_at, published_at, created_at, updated_at. We add:

- `reviews.flag_reason TEXT NULL` + `reviews.flagged_at TIMESTAMPTZ NULL` — admin flagged queue + Flag action.
- `reviews.thanked_at TIMESTAMPTZ NULL` — Thank button.
- `reviews.service_label TEXT NULL` — free-text service name (used by BD backfill + request-review email).
- `reviews.client_email CITEXT NULL` — captured from BD `review_email` and from request-link submissions.
- `reviews.bd_review_id INT NULL UNIQUE` — idempotency key for BD CSV import.
- New table **`review_requests`**: `id uuid pk`, `professional_id uuid → professionals`, `client_email citext`, `client_name text`, `service_label text null`, `token text unique` (32-byte hex), `status text` ('sent'|'opened'|'submitted'|'expired'), `sent_at`, `opened_at`, `submitted_at`, `expires_at` (90 days), `created_at`. RLS: pro can SELECT/INSERT/UPDATE own rows; service_role full; public token lookup via SECURITY DEFINER RPC. GRANTs to `authenticated` + `service_role`.
- Indexes: `reviews(professional_id, status, created_at desc)`, `reviews(flagged_at)`, `review_requests(professional_id, created_at desc)`, `review_requests(token)`.
- View `professional_review_stats`: `professional_id`, `review_count`, `avg_rating` (only `status='published'`).

## 2. Verified-tier dashboard (`/dashboard/reviews`)

- Move `src/routes/_authenticated/_professional/_pro/dashboard_.reviews.tsx` → `src/routes/_authenticated/_professional/dashboard_.reviews.tsx` so Verified/Pro/Studio all see it.
- Remove `/dashboard/reviews` from `UPGRADE_BY_PATH` in `_pro/route.tsx`.
- Add "Reviews" item to the Verified-tier sidebar nav.
- Wire live data (drop static `REVIEWS`/`BREAKDOWN`/`FLAGGED`/`KPIS`): overall rating, last 30d, response rate, awaiting reply, flagged.
- Reply/Thank/Flag wired to new server fns (Reply already exists).
- "Request a review" promoted to primary (top-right); dialog → name + email + optional service → `createReviewRequest` → enqueues `review-request` email via `sendTransactionalEmailServer`. Email links to `/r/$token`.
- "Sent requests" panel: last 20 `review_requests` with status pills.

Locked mock-up layout stays pixel-identical — only data sources change.

## 3. Admin moderation (`/admin/reviews`)

Rewrite `src/routes/admin_.reviews.tsx` with live data; keep locked layout (4 KPI tiles + flagged list + rating distribution + trust system panel).

- KPIs: avg platform rating (weighted), reviews 30d, flagged count, auto-approved % (last 30d).
- Flagged list: rows where `status='flagged'` OR `flag_reason IS NOT NULL`. Approve → status=published, clears flag. Remove → status=hidden. Both via admin server fns gated by `requireSupabaseAuth` + `has_role('admin')`.
- Rating distribution over last 30d.

## 4. Public review submission `/r/$token`

No-auth route:
- `getReviewRequest({ token })` validates + stamps `opened_at`.
- Form (rating 1–5, title, body, name pre-filled) using shadcn primitives.
- `submitReviewByToken({ token, rating, title, body })` inserts `reviews` with `source='request_link'`, `client_user_id=null`, `status='published'`, copies `client_email` from the request, stamps `review_requests.submitted_at`.

Existing authenticated `submitReview` stays for logged-in clients.

## 5. Public profile + directory card rating wiring

- Update `pro.$slug.index.tsx` and directory card builders to read `(count, average)` from `professional_review_stats` instead of hardcoded `0.0 (0)`.
- `FeaturedProCard` shape unchanged; we pass real numbers. Count=0 keeps the existing "0.0 (0)" state.
- Directory list query (`src/lib/directory/...`) LEFT JOINs the stats view.

## 6. BD CSV backfill (one-off) — CORRECTED

CSV `member_reviews_19-06.csv` has 161 rows. **Key correction:** the trainer column is `user_id` (44 distinct BD trainers), NOT `member_id` (which is 0 across all rows — ignored). `review_name`/`review_email` are the reviewer (client), not the trainer.

Join chain:
```
member_reviews.user_id (CSV)
  → bd_member_seed.bd_member_id
  → bd_migration.rep_user_id        (status = 'seeded')
  → professionals.user_id → professionals.id
```

Script `scripts/backfill-bd-reviews.ts` (run with service-role):

1. For each CSV row where `review_status='2'` (approved):
   - Resolve `user_id` to a `professional_id` via the join chain above. Unmapped → log + skip (BD trainer not yet migrated/seeded).
   - Strip HTML (`<[^>]+>`) and decode entities (`&#39;` `&quot;` `&amp;` `&lt;` `&gt;`) from `review_description`.
   - Insert into `reviews`:
     - `professional_id` = resolved
     - `client_name` = `review_name`
     - `client_email` = `review_email`
     - `title` = `review_title`
     - `body` = stripped description
     - `rating` = clamp(`rating_overall`, 1, 5)
     - `published_at` = `created_at` = parsed `review_added` (YYYYMMDDHHMMSS)
     - `bd_review_id` = `review_id` (idempotency)
     - `source='bd_import'`, `status='published'`
2. `ON CONFLICT (bd_review_id) DO NOTHING`.
3. Run via `bun run scripts/backfill-bd-reviews.ts /mnt/user-uploads/member_reviews_19-06.csv`. Output report: imported / skipped-duplicate / skipped-status / skipped-unmapped (with the unresolved `user_id` list).

Same script handles future BD exports automatically.

## 7. Email template

New `src/lib/email-templates/review-request.tsx`:
- Subject: `"{{proName}} asked for your review on REPS"`
- Body: short paragraph + big CTA → `https://repsuk.org/r/{{token}}`
- Registered in `src/lib/email-templates/registry.ts`.

## 8. Execution

Large fan-out (admin rewrite, dashboard rewrite, public form, backfill script, directory rewiring) goes to parallel background subagents with tight prompts + file paths. Migration + route move + sidebar nav update I do directly so the foundation lands first.

## Technical / file-by-file

- **Migration** — `reviews` ALTERs, `review_requests` CREATE + GRANTs + RLS, `professional_review_stats` view, indexes.
- **Move**: `_pro/dashboard_.reviews.tsx` → `_professional/dashboard_.reviews.tsx`.
- **Edit**: `_pro/route.tsx` (drop `/dashboard/reviews` from `UPGRADE_BY_PATH`).
- **Edit**: Verified sidebar nav config (add Reviews).
- **Rewrite**: `src/routes/admin_.reviews.tsx`.
- **Extend**: `src/lib/reviews/reviews.functions.ts` — add `flagReview`, `thankReview`, `createReviewRequest`, `listMyReviewRequests`, `getReviewRequest`, `submitReviewByToken`, `adminListFlagged`, `adminApproveReview`, `adminRemoveReview`, `adminReviewKpis`.
- **New**: `src/routes/r.$token.tsx`.
- **New**: `src/lib/email-templates/review-request.tsx` + registry update.
- **Edit**: `FeaturedProCard` consumers + directory list query.
- **New**: `scripts/backfill-bd-reviews.ts`.

## Out of scope

- Pro/Studio review module redesign.
- Real auto-moderation (profanity/promo); flagged queue stays manual; trust-system panel keeps static labels.
- Editing the locked `/c/$slug` shop-front to surface reviews.
- New-review email notifications.
