## Goal

Two parallel workstreams, both static (Phase 1 — no auth/DB/payments changes):

1. **Pro funnel rewire** — make `/for-professionals` the single canonical landing page for the entire professional journey; retire `/pricing` as a destination; surface Pricing in header nav.
2. **Homepage v2** — build a new world-class flagship homepage at a side route for review, leaving the current `/` untouched until approved.

---

## Workstream 1 — Pro funnel rewire

### 1a. Rebuild `/for-professionals` as the hub
Replace the current short page with a deep, scannable landing page in this order:

1. **Hero** — keep current trainer-image hero, tighten copy, add anchor CTAs ("See plans" → `#pricing`, "Join REPs" → `/signup`).
2. **Trust strip** — "25,000+ verified pros · 4.8★ · Verified register since 2009" + small logo/credential row.
3. **The pitch** — 3-up value props (Get discovered / Take bookings / Run your practice) with short body + image vignettes.
4. **Feature deep-dive** — current 6 features expanded with sub-bullets; group into Visibility, Operations, Growth.
5. **How it works** — current 3-step block, polished.
6. **Testimonials** — current testimonial + 1–2 more in a carousel/grid.
7. **Pricing (`id="pricing"`)** — full plan card grid + monthly/annual toggle + founding banner, lifted from `/pricing`. Shared component so there is no duplicated content.
8. **Compare plans** — full feature matrix, lifted from `/pricing`.
9. **FAQ** — lifted from `/pricing`.
10. **Final CTA band** — "Join 25,000+ verified pros" → `/signup`.

To avoid duplicated content, extract the pricing UI from `src/routes/pricing.tsx` into shared components in `src/components/pricing/` (`PricingPlans`, `PricingCompare`, `PricingFAQ`, `FoundingBanner`) and consume them in `/for-professionals`.

### 1b. Retire `/pricing` as a destination
- Change `src/routes/pricing.tsx` to a `beforeLoad` redirect to `/for-professionals#pricing` (TanStack `redirect({ to: '/for-professionals', hash: 'pricing' })`).
- Update all internal links (`PublicHeader`, `PublicFooter`, homepage CTA band, `/for-professionals` "See pricing", any signup deep-links) to point at `/for-professionals` or `/for-professionals#pricing`.
- Keep the route file so old bookmarks/SEO don't 404.
- The shared `PricingPlans` component keeps the existing checkout server-fn wiring (`createCheckoutSession`, signup deep-link with `tier`/`period`) intact — no billing logic changes.

### 1c. Header nav
- Add `Pricing` link to `PublicHeader` (desktop + mobile), pointing at `/for-professionals#pricing`.
- Keep `Become a Pro` as the top-level link to `/for-professionals`.
- Update active-state matcher so both highlight under the pro section.

### 1d. CTA routing audit
Every "join / become a pro / pricing" CTA on every public page should land on one of:
- `/for-professionals` (top of funnel)
- `/for-professionals#pricing` (plan selection)
- `/signup` (only when a specific plan is already chosen)

---

## Workstream 2 — Homepage v2 (review build)

Build the new homepage at **`/home-v2`** (new route) so it can be reviewed side-by-side with the live `/`. Nothing on `/` changes until v2 is approved; then we swap.

Sections, in order:

1. **Hero** — keep the locked desktop/mobile hero we just finalised (no changes).
2. **Logo / press / credential strip** — thin band under the hero: "As featured in… / Recognised by…" — placeholder marks if no real logos yet, designed so it's obvious they're placeholders.
3. **Social proof rail** — 4-up: rating, verified pros count, sessions booked, countries — promoted from the current stats strip with stronger typography and motion on scroll.
4. **"Find your coach in 3 steps"** — reworked from current "How REPs works", more visual, paired with a screenshot/illustration.
5. **Explore by specialism** — keep, tighten icon treatment, add subtle hover lift.
6. **Featured professionals** — keep grid, add a real horizontal scroller on mobile with snap.
7. **Outcomes / results** — new section: 2–3 short client outcome cards ("Down 12kg in 6 months with James", etc.) with portrait + quote. This is the missing emotional layer.
8. **Why trust REPs** — keep, tighten copy, swap to icon-led 2x2 with more whitespace.
9. **Editorial moment** — full-bleed image quote ("The world's register of verified fitness professionals") to give the page a magazine beat.
10. **Pro CTA band** — keep existing image, repoint CTA at `/for-professionals` (not `/signup`).
11. **Final closer** — short "Find. Trust. Train. Transform." closer with two CTAs: "Find a coach" / "Become a pro".

Visual rhythm rules: respect locked radius system (16/18/22/24px), use only `src/styles.css` tokens, no `rounded-xl/2xl/3xl`, no hardcoded colors. All new components live under `src/components/home-v2/` so they're easy to delete if v2 is rejected.

### Review flow
- Ship `/home-v2` and link to it from `/` only via a temporary banner visible to me when reviewing (or just by URL — your call).
- Once approved, swap: move v2 content into `src/routes/index.tsx`, retire `/home-v2`.

---

## Out of scope for this plan
- No auth, DB, payments, or search-logic changes.
- No edits to the locked `/pro/$slug` profile page.
- No new image generation in this step — placeholder marks where new photography is needed (outcomes section, press logos). We'll generate assets in a follow-up once layout is approved.

---

## Technical notes

- **Shared pricing components**: `src/components/pricing/{PricingPlans,PricingCompare,PricingFAQ,FoundingBanner}.tsx`. The `createCheckoutSession` server-fn call and the signup deep-link with `{ tier, period, next: 'checkout' }` move into `PricingPlans` unchanged.
- **Redirect**: in `src/routes/pricing.tsx`, replace the component with `beforeLoad: () => { throw redirect({ to: '/for-professionals', hash: 'pricing' }); }`.
- **Anchor scroll**: rely on TanStack Router's built-in hash scroll; no custom JS.
- **Header active state**: update the matcher in `PublicHeader.tsx:91` so `/for-professionals` is the only path that needs to match (drop `/pricing` since it now redirects).
- **Route files**: `src/routes/home-v2.tsx` for v2; new components under `src/components/home-v2/` and `src/components/pricing/`.

---

## Suggested order of execution

1. Extract shared pricing components, point `/pricing` route → redirect, repoint all CTAs, add Pricing to header. (Funnel is correct before anything else.)
2. Rebuild `/for-professionals` consuming the shared pricing components.
3. Build `/home-v2` for review.
4. After v2 approval, swap v2 → `/`.
