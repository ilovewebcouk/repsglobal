## Goal (brutal-honest 10/10 version)

A learner can only leave a review on `/t/$slug` after a training provider actually prints their certificate for a specific course. The review is auto-invited by email the moment the batch is marked printed, is tied to that course, and rolls up into per-course and overall provider ratings. The same email pitches REPs Core with a first-year 50% code — one honest cross-sell wired into a moment of genuine goodwill.

No reviews and no certificates exist yet in production, so this is a clean rebuild, not a migration.

---

## 1. Data model changes

### 1.1 `reviews` — add course + certificate provenance

```text
reviews
+ course_id                     uuid  references reps_courses(id)                null
+ certificate_registration_id   uuid  references certificate_registrations(id)   null  UNIQUE
+ reviewer_kind                 text  check in ('client','learner')              not null default 'client'
```

- `reviewer_kind='client'` → existing pro path (booking/roster gate stays).
- `reviewer_kind='learner'` → provider path; `course_id` + `certificate_registration_id` required; `professional_id` holds the provider's user id.
- `UNIQUE(certificate_registration_id)` enforces "one review per printed certificate" at the DB level.

### 1.2 `review_requests` — reuse for learners

```text
review_requests
+ kind                         text  check in ('client','learner')  not null default 'client'
+ certificate_registration_id  uuid  references certificate_registrations(id)  null  UNIQUE
+ course_id                    uuid  references reps_courses(id)                null
+ course_title_snapshot        text                                              null
+ provider_name_snapshot       text                                              null
+ resend_count                 int    not null default 0
```

Snapshots freeze copy at send time so a later course rename doesn't rewrite past emails.

### 1.3 `learners` — link to auth user on first click

```text
learners
+ auth_user_id  uuid  references auth.users(id)  null
+ UNIQUE(provider_id, auth_user_id) WHERE auth_user_id IS NOT NULL
```

Populated on `/r/$token` visit when the signed-in user's email (case-insensitive) matches `learners.email`. That match is the proof the reviewer is the learner.

### 1.4 RLS

- `reviews` INSERT policy gets a second branch: for `reviewer_kind='learner'` the row must reference a `certificate_registrations` row where `provider_id = reviews.professional_id`, `course_id = reviews.course_id`, and the parent `certificate_batches.status = 'printed'`. All writes still go through server functions using service role — the policy is defence in depth.
- `review_requests` learner rows readable only by admin and the matching signed-in learner (via `auth_user_id`).

### 1.5 RPCs for the UI

```text
provider_course_review_stats(_provider_id uuid)
  returns (course_id uuid, course_title text, count int, average numeric(2,1))

list_provider_reviews_page(_provider_id uuid, _limit int, _offset int, _course_id uuid default null)
  returns (id uuid, rating int, title text, body text, reviewer_name text,
           course_id uuid, course_title text, certificate_number text,
           published_at timestamptz, total_count int)
```

Second RPC drives paginated learner reviews for `/t/$slug` (10 per page, published only) and returns `total_count` on every row so the client renders pager numbers without a second round trip.

---

## 2. The trigger: certificate printed → review email

**Where it fires.** `src/lib/certificates/certificates.functions.ts:adminMarkBatchPrinted` currently sets `certificate_batches.status='printed'` and stamps `printed_at`. Right after that update succeeds, call a new server helper `enqueueLearnerReviewRequestsForBatch(batchId)` before returning.

**What the helper does** (single service-role transaction, idempotent):

1. Load all `certificate_registrations` for the batch with `learners.full_name`, `learners.email`, `reps_courses.official_title`, `provider.full_name`.
2. Skip any registration that already has a `review_requests` row (UNIQUE on `certificate_registration_id` makes the whole thing safe to re-run).
3. For each remaining registration generate a 32-byte hex token, insert `review_requests` with `kind='learner'`, `certificate_registration_id`, `course_id`, `course_title_snapshot`, `provider_name_snapshot`, `client_email=learners.email`, `client_name=learners.full_name`, `sent_at=now()`, `expires_at=now()+180 days`.
4. Enqueue the `learner-review-request` app email (see §4). Individual email failures write `failed_at`/`failure_reason` on the row and never abort the loop.

**Manual resend.** Admin certificates page gets a "Resend review invite" row action per registration — reuses the existing token, mails again, bumps `resend_count`. Missing row (edge case) → create one.

---

## 3. Learner submit flow

### 3.1 `/r/$token` (existing shell, new branch)

- Loader calls `getReviewRequestByToken({ token })` — public server fn returning `{ kind, provider_slug, provider_name, course_title, learner_first_name, expires_at }` and never the raw email.
- If `kind='learner'`:
  - Not signed in → CTA "Sign in with `<masked email>` to leave your review". After sign-in they return to `/r/$token`.
  - Signed in with the matching email → server-side `linkLearnerToAuthUser({ token })` upserts `learners.auth_user_id = auth.uid()`, then form renders.
  - Signed in with a different email → block with a clear message + support link.
- Form fields: rating (1–5, default **null** so there's no anchoring bias), optional headline, required body 20–2000 chars. Course chip at the top ("You're reviewing **Level 3 Personal Training** with **Fitness Education Online**") so learners can't be confused about which course this is for.

### 3.2 `submitLearnerReview({ token, rating, title, body })`

Server-side, in order, all mandatory:

1. Load `review_requests` by token; must be `kind='learner'`, not `submitted_at`, not past `expires_at`.
2. Load `certificate_registrations`; parent batch `status` must be `printed` or `dispatched`.
3. Signed-in user's email must match `learners.email` (via `learners.auth_user_id = auth.uid()`, set on link step).
4. Insert `reviews` with `reviewer_kind='learner'`, `professional_id=provider_id`, `course_id`, `certificate_registration_id`, `moderation_status='pending'`, `status='pending'`.
5. Stamp `review_requests.submitted_at`, set `status='submitted'`.
6. Fan out notifications + AI moderation (existing helpers).
7. UNIQUE(`certificate_registration_id`) surfaces "already reviewed" as a friendly error.

### 3.3 Admin moderation

Admin queue already reads `moderation_status='pending'`. Add the course chip + "Verified certificate #ABC123" pill next to the review card so moderators see exactly which cert backs the review. Approving flips `status='published'` and `published_at=now()`, unchanged.

---

## 4. The learner review email (world-class version)

New React Email template `learner-review-request` in `src/lib/email-templates/`. Registered in `src/lib/email-templates/registry.ts`.

**Subject:** `How was Level 3 Personal Training with Fitness Education Online?` (course + provider interpolated from snapshots — no generic "Leave a review").

**Structure** (single column, `Body` bg `#ffffff`, brand orange CTA, no unsubscribe link — the queue appends it):

1. Preheader: `Your certificate has been printed — share how it went.`
2. `Hi Sarah,`
3. `Your certificate for **Level 3 Personal Training** with **Fitness Education Online** has just been printed and posted. Congratulations — that's a real credential now.`
4. `While it's fresh, would you share an honest review of the course? It takes 60 seconds and it's the single most useful thing you can do for future learners deciding whether this course is right for them.`
5. Primary CTA button → `https://repsuk.org/r/<token>` — label `Write your review`.
6. Micro-copy: `You'll rate the course, add a short comment, and that's it. Your review is tied to your verified certificate, so future learners know it's real.`
7. Divider.
8. **Secondary block — "Next step: get on the REPs register"**:
   - `You've earned it. Now get seen for it.`
   - `REPs is the independent register for fitness professionals. Members show as **verified** across the platform and get a profile clients can actually find. Right now, your first year is 50% off — £17 instead of £34.`
   - Button → `https://repsuk.org/join?ref=cert&code=NEWPRO50` (label: `Claim 50% off your first year`).
   - Fine print: `Offer valid for 30 days from the date this email was sent. One use per person.`
9. Footer: provider name, course title, certificate number, "This link expires in 180 days."

**Copy discipline:** no emojis, no exclamation marks in the CTA, no "we", no "UK", no BD-migration language, no "shopfront". Rating is null by default — never nudge stars.

**The discount code.** `NEWPRO50` is a real Stripe promotion code applied to the Core annual price (`src/lib/billing.ts`).
- Stripe coupon: `50% off, once, expires 30 days after redemption start, 1 use per customer`.
- `/join?code=NEWPRO50` passes `discounts: [{ coupon }]` into the Checkout Session.
- Invalid/expired at checkout → Stripe rejects gracefully; user sees full price, no broken UX.

---

## 5. `/t/$slug` layout changes (revised per your feedback)

### 5.1 Sidebar card — "What Learners Say" (KEEP)

Stays exactly where it is. Shows:

- Big overall number `4.7` + 5-star row.
- `Based on N verified learner reviews`.
- The 5→1 bar chart from published learner reviews only.

**Remove the "No reviews yet…" empty text inside this card** (the red-boxed area in your screenshot). When count is 0, the card just shows `0.0`, empty stars, `Based on 0 reviews`, and empty bars — clean.

**Remove the orange "Write a review" button** from this card. The only entry point is the emailed token — no public self-serve.

### 5.2 New dedicated Reviews section (below Qualifications & Courses)

A full-width section titled **"Verified learner reviews"** placed **after** Qualifications & Courses and **before** any Locations / FAQ blocks. This is the single home of the review list.

Structure:

```text
─── Verified learner reviews ───────────────────────────────
   Sub-line: N reviews across M courses · certificate-verified

   [ All courses ▾ ]   [ Most recent ▾ ]           (filters right-aligned)

   ┌─ review card ─────────────────────────────────────────┐
   │ Sarah T.  ★★★★★   14 Jul 2026                          │
   │ [ Level 3 Personal Training ]  [ ✓ Verified learner ]  │
   │ "Course was well-structured, tutor feedback was fast…" │
   └───────────────────────────────────────────────────────┘
   … (up to 10 cards) …

              «  1  2  3  …  8  »          Page 3 of 8
────────────────────────────────────────────────────────────
```

- **Pagination**: 10 reviews per page, server-driven via `list_provider_reviews_page`. Page number lives in `?reviews_page=` and `?course=` query params so it's shareable and back/forward works.
- **Course filter**: shadcn `Select` populated from `provider_course_review_stats`. Selecting a course resets page to 1.
- **Sort**: `Most recent` (default) / `Highest rated` / `Lowest rated`. Encoded in `?reviews_sort=`.
- **Card**: course chip (`Badge`, `border-reps-border bg-reps-panel-soft`) + verified chip (`border-emerald-400/30 bg-emerald-500/15 text-emerald-300`, per `status-colors` memory). Provider response, when present, renders as an indented block under the body.
- **Empty state** (only place we say it now): `No reviews yet. Verified learner reviews appear here after a certificate is printed.` — one short sentence, no CTA button.
- **Radius map**: card 18px, pager buttons 10px, filter selects 12px (per REPs radius rule).

### 5.3 Kill `/t/$slug/review`

Delete `src/routes/t.$slug.review.tsx`. Everyone reviews through the token; no self-serve form on the provider page. Route 301 → `/t/$slug#reviews`.

### 5.4 Course cards inside Qualifications & Courses

Each course row gains a small `★ 4.8 · 24` inline when it has ≥1 published review. Clicking it deep-links to the Reviews section filtered to that course (`#reviews?course=<id>`). No fabricated numbers — hidden when count = 0.

---

## 6. Provider dashboard (reviews page)

`listMyReviews` already exists. Additions:

- DTO gains `course_id`, `course_title`.
- Header: overall stars + total, plus a "Reviews by course" table (course · avg · count · last received).
- Review list: same card as public + Reply / Report row actions.
- New "Requests" tab: `review_requests` rows (course · learner name · sent · opened · submitted · resend button).
- Manual "Ask for a review" is **disabled** with an info banner: `Reviews are invited automatically when you mark a batch printed. This keeps every review tied to a real, verified certificate.`

---

## 7. Files touched

**New:**
- `supabase/migrations/*_provider_reviews_v1.sql` — schema + RPCs + policies.
- `src/lib/email-templates/trainer/reviews/learner-review-request.tsx`
- `src/lib/reviews/learner-review-request.server.ts` — batch trigger helper + resend.
- `src/lib/reviews/token.functions.ts` — `getReviewRequestByToken`, `linkLearnerToAuthUser`, `submitLearnerReview`, `listProviderReviewsPage`.
- `src/components/provider/ProviderReviewsSection.tsx` — the new paginated section for `/t/$slug`.

**Edited:**
- `src/lib/certificates/certificates.functions.ts` — call `enqueueLearnerReviewRequestsForBatch` inside `adminMarkBatchPrinted`.
- `src/lib/reviews/reviews.functions.ts` — extend DTOs with `course_id/course_title/reviewer_kind`; per-course breakdown; strip legacy self-serve endpoint from provider slugs.
- `src/lib/email-templates/registry.ts` — register `learner-review-request`.
- `src/routes/t.$slug.index.tsx` — remove "No reviews yet…" text and "Write a review" button from the sidebar card; mount `<ProviderReviewsSection />` beneath Qualifications & Courses.
- `src/routes/r.$token.tsx` — kind='learner' branch.
- `src/routes/t.$slug.review.tsx` — deleted, 301 redirect.
- Provider dashboard reviews route — course breakdown + Requests tab.
- Qualifications & Courses card component — inline `★ x.x · N` per course.
- Stripe wiring in `src/lib/billing.ts` + Checkout create — accept `code=NEWPRO50`.

---

## 8. Verification checklist

1. Admin marks a batch printed → each learner receives the course-specific email; `review_requests` rows carry correct token + snapshots.
2. Marking the same batch printed twice → zero duplicate rows, zero duplicate emails.
3. Learner clicks link, signs in with matching email → form loads with correct course chip; wrong email blocked.
4. Learner submits → row appears in admin queue with course + certificate number; UNIQUE prevents second submit.
5. Admin approves → review appears in the new Reviews section on `/t/$slug`; sidebar `What Learners Say` averages update.
6. Sidebar shows `0.0` + empty bars when count=0, **without** the "No reviews yet…" text or the "Write a review" button.
7. Reviews section paginates at exactly 10 per page; `?reviews_page=` and `?course=` survive refresh and browser back/forward.
8. Course filter on the Reviews section reflects `provider_course_review_stats` and resets page to 1 on change.
9. `NEWPRO50` link → Stripe Checkout shows £17 for year one on Core annual; expired code degrades to full price.
10. `/t/$slug/review` returns 301 → `/t/$slug#reviews`.
11. Playwright screenshot of `/t/$slug` with 23 seeded reviews across 3 courses shows: sidebar overall = correct, section pager `1 2 3`, page 3 has 3 cards, course filter reduces to a single course's set.

---

## 9. Explicit non-goals

- No reviews for providers who don't issue REPs certificates.
- No learner self-edit of a submitted review (admin can remove).
- Email only — no SMS/push.
- No in-app leaderboard of NEWPRO50 redemptions in v1; Stripe Dashboard covers it.
- No changes to the pro (`/c/$slug`) review flow beyond the shared DTO additions.

---

## Is this world-class?

Yes, once shipped. Three reasons it's a 10/10 and not a 7/10:

1. **Zero manual review requests.** Removing the "Write a review" button is uncomfortable but correct — every review on `/t/$slug` is provably tied to a printed certificate, so the page becomes a trust artefact instead of a comment box.
2. **Course-level rollups + paginated section.** Learners choose courses, not providers-in-the-abstract. Splitting the overall summary (sidebar, always visible) from the paginated list (dedicated section, filterable by course) matches how humans actually shop for a course.
3. **One honest cross-sell at the perfect moment.** The 50%-off nudge only ever lands on a learner who just earned a certificate — exactly the person REPs wants on the register, and the discount is a legitimate reason to act now rather than a growth-hack.
