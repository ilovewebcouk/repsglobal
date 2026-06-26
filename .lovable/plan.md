## Goal

Strip everything demo-flavoured from the public live site, but keep the two locked mock-up pages reachable by admin (`cruz.pt@icloud.com`) at their existing URLs so you always have a reference of "the perfect page":

- `/pro/james-carter` — Verified PT profile mock-up (fixture)
- `/c/james-wilson` — Pro-tier coach shop-front mock-up (fixture)

Everything else demo/seed gets pulled from public surfaces. Nothing about the locked visual designs of those two pages changes.

---

## 1. Admin-gate the two demo fixture pages

In `src/routes/pro.$slug.index.tsx` and `src/routes/c.$slug.tsx`:

- When the requested slug is a **fixture-only slug** (`james-carter` / `james-wilson`) AND there is no matching real DB row, run an admin check (`has_role(auth.uid(), 'admin')`) in the loader.
- Non-admin (incl. signed-out): throw `notFound()` so the public sees the standard 404.
- Admin: render the fixture page exactly as today (locked design untouched).
- Also emit `<meta name="robots" content="noindex,nofollow">` via `head()` on these fixture renders so they never get indexed.
- Remove the silent `?? PROS["james-carter"]` / `?? COACHES["james-wilson"]` fallbacks for *unknown* slugs — unknown slugs without a DB row should `notFound()`, not impersonate James.

## 2. Hide BD seed / unclaimed pros from public listings

BD-seed rows (`professionals.bd_seed_thin = true`) currently appear in directory search, city pages, profession pages, and can hit the featured rail. Hide them everywhere public:

- `src/lib/directory/search.functions.ts` — add `.eq("bd_seed_thin", false)` to the public search query (and any city/profession derivatives).
- `src/lib/directory/featured.functions.ts` — exclude `bd_seed_thin = true` from `getFeaturedPros` and the global featured-ID set (hero rail already excludes them).
- Direct `/pro/<bd-slug>` URLs keep working (so claim flows still resolve) but are noindex'd until claimed — flip `head()` to noindex when `bd_seed_thin && identity_status !== 'approved'`.

## 3. Replace hardcoded demo content on public pages

- **Homepage `src/routes/index.tsx`**:
  - Delete the `FALLBACK_FEATURED` array. When `liveFeatured` is empty, render nothing (or a minimal placeholder card slot) instead of fake James/Sophie/Daniel/Laura.
  - Replace the `outcomes` testimonial block (James/Sophie/Daniel quotes) with a neutral "Featured stories — coming soon" empty-state, or remove the section entirely until real stories exist. Pick the empty-state.
- **`src/routes/reviews.tsx`** — the page is built from a hardcoded `MOCK_REVIEWS` array (James Wilson, Sophie Taylor, Liam Roberts, Laura Bennett). Either:
  - (a) replace with a query against approved DB reviews, or
  - (b) gate the whole route admin-only (since there are no real public reviews yet).
  Recommended: **(b) admin-gate** for now — quickest, no public exposure. Re-open when real review volume exists.
- **Marketing pages** (`features.visibility.tsx`, `features.shop-front.tsx`, `features.operations.tsx`, `for-professionals.tsx`, `features.coaching.tsx`, `dev.section-library.tsx`, `cpd-legacy.tsx`, `home-legacy.tsx`, `TestimonialFeature.tsx`, `components/features/feature-content.tsx`, `InteractiveMocks.tsx`) — these are **internal references to the locked mock-ups** (iframes / AnnotatedMock / testimonial avatars pointing to James Carter / James Wilson). They are the canonical product screenshots and stay, since they are art direction, not "demo data on the live platform". No change.

## 4. Demo dashboard / portal routes

- `src/routes/dashboard-demo.tsx` and `src/routes/portal_.*.tsx` — keep, but ensure they're admin-only or already behind `/portal` (client-portal demo). Confirm and gate if exposed.

## 5. Audit & cleanup

- Run a final `rg` for hardcoded `Sophie Williams`, `Daniel Roberts`, `Laura Mitchell`, `Liam Roberts`, `Sophie Taylor`, `Laura Bennett` on **public** routes — remove from public surfaces, leave inside marketing mock-up references (the locked screenshots above).
- Verify directory + city + profession + homepage rails return 0 rows when DB has no verified pros (acceptable empty state).

---

## What stays untouched

- `src/routes/pro.$slug.index.tsx` and `src/routes/c.$slug.tsx` visual layouts (locked mock-ups).
- Marketing-page iframes/screenshots that point at the two James pages — they're the product screenshots.
- BD seed table itself (data preserved, just hidden publicly).
- Stripe / billing / verification logic.

## Open question

The `reviews.tsx` route in §3 — confirm you're happy with **admin-gate the whole `/reviews` page** rather than rewiring it to real DB reviews now. Otherwise I'll do option (a) and only show approved reviews from the DB.
