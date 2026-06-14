# Plan: Reset Verified tier to badge + credentials + directory + email enquiries

Verified (£99/yr) becomes deliberately minimal. Pro and Studio are untouched and keep every feature already built.

## What Verified is

- Verified badge on their listing
- Credentials shown (verification status + qualifications)
- Appears in the public directory (search, city pages, profession pages) as a **card only**
- New enquiries are **emailed** to them — no in-app inbox, no reviews, no shop-front, no services editor, no `/c/$slug` page

## 1. Sidebar — Verified-only nav

`src/components/dashboard/DashboardShell.tsx` → `VERIFIED_NAV` becomes:

- Dashboard
- Public Profile
- Verification
- Education & CPD
- Settings

Remove: Enquiries (already gone from Pro? — keep for Pro/Studio, remove from Verified group).

## 2. Block the URLs for Verified

Add a tiny tier guard. When a Verified user hits any of:

- `/dashboard/enquiries`
- `/dashboard/shop-front`
- `/dashboard/services`
- `/dashboard/reviews` (if/when it lands)

…redirect to `/dashboard` and fire a sonner toast: *"That's a Pro feature — upgrade to unlock."*

Implementation: a small `useEffect` guard in each of those four route components that calls `useTier()` (or the existing helper) → `navigate({ to: "/dashboard" })` + `toast(...)`. No new middleware, no route-tree changes. Pro/Studio code paths unchanged.

## 3. `/dashboard/profile` — hide upsell callouts for Verified

In `src/routes/_authenticated/_professional/dashboard_.profile.tsx`, the "More of your public page" callout card (the one we added with Services + Shop-front buttons) is gated on `tier !== "verified"`. Verified sees the editor without that callout. Everything else in the editor stays the same — they edit bio, photo, headline, credentials, contact, social — that's what powers the directory card.

## 4. Public coach page `/c/$slug` — Verified does NOT get one

`src/routes/c.$slug.tsx` loader: if the pro's tier is `verified`, throw `notFound()` so the route 404s. They only exist as a directory card; the card's "Enquire" CTA goes to `/pro/$slug/enquire` (already email-routed). Pro/Studio shop-fronts are unchanged.

Also update any link from search results / city pages that currently points to `/c/$slug` for Verified pros → point those to `/pro/$slug/enquire` (or just the card with an "Enquire" button, no profile click-through).

## 5. Enquiries → email

The `/pro/$slug/enquire` server fn already creates a row + (presumably) sends an email. Confirm the email send is wired; if it's only DB-side, add a transactional email to the pro's account email on submit. No in-app inbox for Verified.

## 6. Out of scope / explicitly NOT doing this pass

- Removing Pro features (shop-front, services editor, reviews, inbox) — they stay for Pro/Studio.
- Refactoring route files or deleting the four blocked routes — they keep working for Pro/Studio.
- Touching `/c/$slug` design — only the loader-level 404 for Verified.
- Marketing pages — `/pricing`, `/for-professionals`, comparison pages already reflect tier ladder; copy audit deferred.

## Technical notes

- Tier check uses the existing `useTier()` / loader-side tier from the auth context — no new server fn.
- Toast uses sonner.
- All changes are presentation/guard logic only — no schema changes, no Stripe changes, no migrations.

## Files touched

- `src/components/dashboard/DashboardShell.tsx` (remove Enquiries from VERIFIED_NAV)
- `src/routes/_authenticated/_professional/dashboard_.enquiries.tsx` (Verified guard + redirect)
- `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (Verified guard + redirect)
- `src/routes/_authenticated/_professional/dashboard_.services.tsx` (Verified guard + redirect)
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` (hide upsell callout for Verified — may already be done)
- `src/routes/c.$slug.tsx` (404 if pro.tier === verified)
- Wherever search/city/profession cards link to `/c/$slug` — branch on tier
