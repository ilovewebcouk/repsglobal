# `/signup` — world-class conversion screen

## Principle

The user already said yes on `/pricing`. The job of `/signup?tier=…&period=…&next=checkout` is **collect credentials and get out of the way**. No re-pitching, no scrolling, no second thoughts. One viewport, one action, one outcome: land in Stripe Checkout in under 10 seconds.

## The screen (single viewport, two columns on ≥lg, stacked on mobile)

**Left rail (40%) — reassurance, not selling**

- `RepsWordmark` + one-line tagline "The Register of Exercise Professionals"
- Plan summary card (existing `planSummary` data) — promoted to the hero of the left rail:
  - "You're signing up for" eyebrow
  - Plan name + tagline
  - Big price + unit + meta line (e.g. "30-day free trial · then £59/month")
  - 4 highlight bullets (existing data) with emerald check icons
  - Subtle "Change plan" link → `/pricing` (critical escape hatch — removes anxiety, proven to *increase* conversion)
- Three trust micro-rows under the card, single line each, muted:
  - 🛡 Secured by Stripe · PCI-DSS
  - ✓ Cancel anytime from your dashboard
  - 🔒 We never see your card details

That's the entire left rail. No testimonial, no stats grid, no feature cards, no brand logos, no FAQ.

**Right rail (60%) — the form**

- H2: "Create your account" (single line, no subhead)
- Google + Apple buttons, side-by-side on ≥sm, stacked on mobile, equal weight, outlined not filled
- Divider: "or sign up with email"
- Full name (single field, not split)
- Email
- Password with eye toggle + inline strength hint (subtle, only after typing)
- Single checkbox: "I agree to the [Terms] and [Privacy Policy]" — required, no marketing opt-in clutter
- Primary CTA, full-width, large: **"Continue to secure checkout →"** (Verified copy: **"Continue to payment →"**)
- Below CTA, one muted line: "Next: secure payment via Stripe. You'll be back here in 30 seconds."
- Footer microcopy: "Already a member? [Sign in]"

## Conversion details that make this 10/10

1. **Autofocus on full name** — one less click
2. **`autocomplete` attributes** wired correctly (`name`, `email`, `new-password`) so password managers fire
3. **CTA shows the destination**, not the action. "Continue to secure checkout" beats "Create account" because it sets the next-screen expectation and removes the "what happens after I click?" hesitation
4. **Plan card sits on the LEFT** (not above the form on desktop) so the form is always at thumb height on the right — this is the standard SaaS conversion pattern (Linear, Vercel, Notion all do this)
5. **"Change plan" link is visible but quiet** — confidence signal; users who *don't* click it convert harder because they were given the option
6. **No double H1** — the page H1 is the plan name in the summary card. The form gets H2. This kills the current "Your fitness business…in one place" pitch headline that's currently fighting the plan card for attention
7. **Inline errors only**, no toast spam. Field-level red text under the offending input, focus moves to it on submit failure
8. **Loading state on CTA**: button text swaps to "Taking you to Stripe…" with the existing `Loader2` spinner — explicit destination beats generic "Loading…"
9. **No layout shift** between empty/error/loading states — pre-reserve error line height
10. **OAuth buttons match form button height exactly** (44px) — visual rhythm
11. **Mobile**: plan card collapses to a sticky bottom-of-card summary strip (name + price), full plan details accessible via a "View plan details" disclosure. Form takes full viewport.
12. **Page background**: keep the existing dark `bg-reps-ink` + orange radial glows + the dashboard hero image at low opacity in the far background. The form card stays warm-white for max contrast — that part is already right.

## What gets deleted from the file

- `TRUST_BULLETS` (4 items) + its `<ul>` render
- `STATS` strip
- `FEATURES` 4-card grid
- `BRANDS` logo strip
- `FAQS` accordion
- `ACCOUNT_TYPES` + `TIER_TO_ACCOUNT_TYPE`
- Sophie testimonial figure
- Hero H1 "Your fitness business…in one place"
- All section dividers and wrapper sections below the form
- Unused lucide imports: `Award`, `Briefcase`, `Building2`, `Calendar`, `ChevronDown`, `Globe`, `ShieldCheck`, `Sparkles`, `Star`, `TrendingUp`, `Users`, `User` (audit and keep only what the new layout uses)

## What stays untouched

- `validateSearch` + `beforeLoad` redirect
- `head()` SEO block
- `handleSubmit` → `supabase.auth.signUp` → `continueAfterAuth` → `createCheckoutSession` → `window.location.href` flow
- `handleGoogle` + Apple OAuth wiring + `continueAfterAuth` fallback
- Email-verification redirect path that preserves checkout intent
- Plan summary data shape (`PLAN_SUMMARIES`)
- Header strip (logo + "Already have an account? Sign in")

## Edge cases handled

- **No `?tier`** → `beforeLoad` already redirects to `/pricing` (keep)
- **Email already exists** → friendly inline error: "An account already exists for this email. [Sign in instead]" with link to `/auth?next=checkout&tier=…&period=…` so they resume the same flow post-login
- **Email verification required** → existing info banner stays; copy tightened to: "Check your inbox to verify, then we'll bring you back to checkout."
- **OAuth user with existing account** → `continueAfterAuth` already handles this; goes straight to Stripe
- **User abandons at Stripe and returns** → `/signup` with same query still works; they'll sign in via the "Already have an account?" link, which preserves intent

## Out of scope

- `/pricing`, `/auth`, `createCheckoutSession`, billing tiers, Stripe IDs
- Apple Developer wiring
- A separate post-payment onboarding screen (that's Phase 2.x — Stripe success_url already routes to `/dashboard` which handles first-run state)
- Removing the page entirely (impossible — Stripe can't create the auth user)

## Files

- `src/routes/signup.tsx` — restructure to two-column layout as above. Net: ~450 lines removed, layout rebuilt around the existing form + plan card. No new files, no new components, no design tokens, no backend.
