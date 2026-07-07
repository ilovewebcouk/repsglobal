# Plan: Core pricing banner on all public pages

## Goal
Add a non-dismissible banner fixed at the top of every public-facing page, advertising the Core tier membership reduction from £99/year to £34/year.

## Approach
Create a reusable `SiteBanner` component and embed it inside every public header container so it sits above the nav and stays visible while scrolling.

## Files to change

### 1. New component — `src/components/SiteBanner.tsx`
- Full-width strip, `bg-reps-orange`, white centred text
- Copy: **"Core membership — now £34/year (was £99)."** with an inline `Link to="/pricing"` CTA "See plans →"
- ~36px tall, `text-[13px]` semibold, no dismiss control
- Uses only REPS design tokens (no hardcoded hex)

### 2. `src/components/public/PublicHeader.tsx`
- Insert `<SiteBanner />` as the first child inside the `<header>` element, above the 72px nav row
- Works for both `variant="transparent"` (fixed) and `variant="solid"` (sticky) — the banner rides with the header
- Confirms the header still wins z-index (`z-50`)

### 3. `src/routes/c.$slug.index.tsx` — `ChromeBar`
- Coach websites use their own sticky `ChromeBar`, not `PublicHeader`
- Insert `<SiteBanner />` as the first child inside `ChromeBar`'s `<header>`
- Bump the `SectionNav` sticky offset from `top-14` to `top-[92px]` (14 + banner) so the on-page nav still docks flush under the chrome
- Same treatment for `/t/$slug` provider pages (`src/routes/t.$slug.index.tsx`) if they render their own chrome — verify during build

### 4. Standalone public routes without `PublicHeader`
Add `<SiteBanner />` as the first element inside the page component on:
- `/auth`, `/forgot-password`, `/reset-password`, `/verify-email`
- `/accept-invite`, `/checkout/return`, `/checkout/credits/return`
- `/coming-soon`, `/unsubscribe`, `/newsletter/confirm`, `/newsletter/unsubscribe`

### 5. Homepage clearance check
- Home hero already has `pt-[140px]` mobile / `lg:pt-[160px]` desktop
- 72px nav + ~36px banner = 108px — clearance is fine, no padding change needed

## Copy guardrails
- Use **"Core"** (not "Verified") per the naming constraint
- Frame as current pricing only: "now £34/year (was £99)" — no migration / legacy / honour-price wording
- No mention of BD, migrated members, or founding tiers

## Excluded (not public-facing)
- `/dashboard`, `/admin`, `/portal`, `/_authenticated/*`
- Coach client portal (`/portal/*`)

## Out of scope
- Dismiss/close control (explicitly declined)
- Countdown, end-date, or A/B testing
- Analytics events on the banner click (can be added later if needed)

I'll also handle the missing "unverified" pill on `/c/$slug` (Ben Skevy) as a separate follow-up after this banner ships — it's a different code path in the `ChromeBar` verified block.