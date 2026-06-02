## Goal

Make `/for-professionals` the definitive landing page for professionals joining REPs, and back it with a real Features section that goes deep on each tool — using inline React/Tailwind mockups of the platform instead of placeholder images.

---

## 1. New: reusable platform mockup components

Create `src/components/mockups/` — React/Tailwind components that look like real product screens. Built once, reused on `/for-professionals` and across all `/features/*` pages.

Initial set (one per feature pillar):

- `DashboardMockup` — pro home: today's sessions, revenue, lead inbox
- `BookingsMockup` — calendar week view with sessions + deposit chips
- `PaymentsMockup` — Stripe-style payout list + MRR card
- `ClientsCrmMockup` — client row + profile drawer with notes/history
- `ProgrammesMockup` — programme builder (weeks/days/exercises)
- `CheckInsMockup` — weekly check-in form + progress photos timeline
- `MessagesMockup` — threaded inbox with AI quick-reply chips
- `LeadsMockup` — lead pipeline (New → Qualified → Booked)
- `InsightsMockup` — revenue/retention chart + "next move" card
- `ProfileMockup` — public REPs profile preview (Verified badge, reviews)

Each is a self-contained component with realistic copy, REPs design tokens, and a "browser chrome" frame variant for hero shots. No real data — pure presentation.

---

## 2. New `/features` hub + 9 sub-pages

```
src/routes/
  features.tsx                  # index/hub: grid of feature cards → sub-pages
  features.bookings.tsx
  features.payments.tsx
  features.clients.tsx
  features.programmes.tsx
  features.check-ins.tsx
  features.messaging.tsx
  features.leads.tsx
  features.insights.tsx
  features.profile-and-reviews.tsx
```

Each sub-page uses a shared `FeaturePageLayout` with this structure:

1. **Hero** — headline, sub, primary CTA ("Start free"), secondary ("See pricing"), + the matching `*Mockup` component in a browser frame
2. **Three "what you get" pillars** — icon + line, scannable
3. **Deep-dive sections (3-4)** — alternating left/right with smaller mockup snippets or annotated UI fragments
4. **Pro quote** — testimonial card relevant to that feature
5. **"Works with..."** — cross-links to 2-3 related features
6. **Plan availability strip** — which tiers include this feature (pulled from `pricing-data.ts`)
7. **CTA band** — Join REPs / See plans

Each route gets its own `head()` with unique title + description + og text (per `tanstack-route-architecture` rules).

---

## 3. Header: add "Features" mega-menu

`src/components/public/PublicHeader.tsx`:

- New top-level "Features" item between "Find a Pro" and "How it works"
- Desktop: mega-menu in 3 columns grouped by Visibility / Operations / Growth, each item is a feature with icon + one-liner, footer row links to `/features` overview and `/for-professionals`
- Mobile drawer: accordion "Features" with the same flat link list
- Add to `nav-config.ts` as `FEATURE_LINKS` so the menu and the `/features` hub render from the same source

---

## 4. Rebuild `/for-professionals` as a world-class landing page

Keep current bones; rework with the four chosen upgrades.

New section order:

1. **Hero (refreshed)** — same headline, but replace the earnings-calculator card with a `DashboardMockup` in a browser frame. Add sticky CTA bar that appears on scroll ("Start free · See plans") with founding-pro countdown
2. **Press / trust strip** — REPs verified since 2009, 25k+ pros, 1M+ sessions, press logos (already in `src/assets/press/`)
3. **3-up pitch** (existing — keep)
4. **"See the platform" showcase** — 3 large mockup tiles (Dashboard / Bookings / Clients CRM) each linking to the matching `/features/*` page
5. **Feature pillars (refactored)** — Visibility / Operations / Growth groups, each pillar shows 1 mockup + 3 feature cards, every card deep-links to its `/features/*` page
6. **Earnings calculator** — promote the existing card to a full section
7. **How it works** (existing 3 steps — keep, lightly polished)
8. **Stronger social proof** — expand testimonials to 6 with rotating layout + before/after stats (clients booked, revenue, hours saved per week)
9. **Pricing** (existing `PricingPlans` — keep)
10. **Why priced this way** (existing — keep)
11. **Compare every feature** (existing `PricingCompare` — keep)
12. **FAQ** (existing — keep)
13. **Final CTA + lead capture** — add an inline "Book a 10-min demo" form (name, email, discipline) alongside the existing CTA; submits to a placeholder handler for now (real backend deferred per Phase 1 rules)

---

## 5. Cleanup

- `/business-tools` already exists and overlaps with the new `/features` hub. **Redirect it** to `/features` via a thin route that calls `<Navigate to="/features" />` so any inbound links/SEO carry over.
- Remove `/business-tools` from the footer; replace with "Features" link.
- Run `scripts/check-nav-links.mjs` after changes — every new route must be reachable from nav, and no orphans.

---

## Technical details

- All mockups: pure Tailwind + REPs tokens, no images required. Use existing pro headshots (`src/assets/pro-*.jpg`) where avatars are needed.
- `FeaturePageLayout` lives at `src/components/features/FeaturePageLayout.tsx`; takes typed props for hero, sections, quote, related, planAvailability.
- Plan availability data pulled live from `src/components/pricing/pricing-data.ts` (single source of truth — no duplication).
- All new pages use `PublicHeader variant="solid"` + `PublicFooter`.
- Lead-capture form is presentational only (Phase 1 = no backend); show a success toast.
- Radius system: hero 24px, large panel 22px, std/feature cards 18px, buttons 10px (per locked memory).
- Browser-frame wrapper: a small reusable `<BrowserFrame>` component (rounded 22px, top bar with 3 traffic-light dots, optional URL pill).

---

## Out of scope

- Real auth, payments, lead persistence (still Phase 1).
- Animated/interactive mockups beyond CSS hover states.
- Video walkthroughs.
- Sub-features beyond the 9 listed (e.g. CPD, nutrition can be added later under same pattern).
