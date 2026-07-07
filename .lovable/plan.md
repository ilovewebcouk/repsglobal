## Goal
Wire the Reviews page into the training-provider dashboard so it works the same as it does for trainers, following the physical-separation pattern already agreed for Dashboard / Settings / Verification.

## Scope
- Structural wire-up only. No redesign, no schema changes, no changes to review server functions.
- Trainer reviews page is untouched.

## Files to edit

1. `src/components/dashboard/nav-data.ts`
   - Add a new group entry to `TRAINING_PROVIDER_NAV` so the provider sidebar shows Reviews:
     ```
     { title: "Reputation", items: [{ icon: Star, label: "Reviews", to: "/dashboard/reviews" }] }
     ```
   - Place between the existing "Account" group and "Help" group.
   - No trainer/pro/admin nav rows change.

2. `src/routes/_authenticated/_professional/dashboard_.reviews.tsx`
   - Convert the current single-component route file into a thin **dispatcher**, matching the pattern already live on `dashboard.tsx`, `dashboard_.settings.tsx`, `dashboard_.verification.tsx`, `dashboard_.provider-website.tsx`.
   - Keep `createFileRoute(...)`, `head()`, and the existing `component:` wiring.
   - The rendered component checks `useTrainerTier()`:
     - `training_provider` → render `<ProviderReviewsPage />` (new, from `@/components/dashboard/organisation/ReviewsPage`).
     - anything else → render the existing trainer `ReviewsPage` body, extracted verbatim into `src/components/dashboard/trainer/ReviewsPage.tsx` OR left inline in this file as `TrainerReviewsPage`. I'll keep it inline in the dispatcher file (matches how the current dashboard dispatchers keep trainer JSX inline) to minimise churn.

## Files to create

3. `src/components/dashboard/organisation/ReviewsPage.tsx`
   - Seeded from the trainer `ReviewsPage` component body (same shell, same KPIs, same tabs, same server fns `listMyReviews` / `getMyReviewKpis` / `listMyReviewRequests` / `thankReview` / `flagReview` / `replyToReview` / `clearReviewReply` / `createReviewRequest`).
   - `DashboardShell` props updated to provider context:
     - `role="trainer"` (unchanged — shell role stays the same, tier drives the sidebar)
     - `tier="training_provider"`
     - `active="Reviews"`
     - `title="Reviews"`
     - `subtitle="Reviews from learners on your provider profile and review requests."`
   - Copy tweaks limited to text that mentions "client(s)" → "learner(s)" where it appears in shell subtitle / empty states / dialog helper text. Field names in the underlying DTOs (`client_name`) are NOT changed.
   - Same server functions — provider reviews are the same `reviews` rows keyed by `professional_id` so the existing queries work with no backend changes.
   - Physically isolated from the trainer file: any future edit here won't touch the trainer experience.

## Files NOT changed
- `src/lib/reviews/reviews.functions.ts` — untouched.
- Database schema, RLS, migrations — untouched.
- `_organisation` route tree — still not introduced (we agreed on option B: shared route files, isolated component folder).
- Trainer sidebar `VERIFIED_NAV` and `PRO_NAV` — untouched.
- Admin reviews — untouched.

## Verification
1. Trainer (verified/pro) sidebar still shows Reviews under Deliver, page renders unchanged.
2. Provider sidebar now shows a Reviews entry, `/dashboard/reviews` renders the new `organisation/ReviewsPage`.
3. `useTrainerTier()` dispatch correctly picks provider vs trainer variant.
4. Typecheck passes.
5. No `_professional` file imports from `_organisation` route tree (still N/A) and no cross-imports between `components/dashboard/organisation/` and the trainer route body.
