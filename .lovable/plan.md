# /for-professionals — make every feature a scannable 50/50

## The problem

Two sections currently hide features:

1. **Pillar 3 · Operations** is one merged 50/50 with a 3-up sub-strip underneath. Leads, Bookings, Payments each get a single line of copy. Anyone scanning or Cmd-F-ing the page misses them.
2. **Pillar 4 · Coaching** is a tabbed component (`PillarTabs` — Programmes / Check-ins / Client record). Tabs are invisible to anyone scrolling, and search-in-page can't find tab content. You missed them yourself.

The fix is to stop forcing each pillar to be one section. Keep the six-pillar grid in Act 2 as the *map*, then let the deep-dive sections below it be one 50/50 per feature — even if that means 10–12 blocks. Each block links to its pillar page. More 50/50s is fine; hidden features is not.

## What changes

### A. Replace the merged Operations block with 5 individual 50/50s

Delete the current Pillar 3 ProductBlock + `OPERATIONS_SUB` 3-up. Replace with one 50/50 per feature, all eyebrowed *"Pillar 3 · Operations · [Feature]"* and all CTA'd *"Explore Operations →"* `/features/operations`:

1. **Leads CRM** — mockup `/dashboard/leads`. Bullets on pipeline stages, source tracking, AI lead scoring, reply drafts.
2. **Bookings & calendar** — mockup `/dashboard/bookings` (reverse). Two-way sync, deposits, reminders, session types.
3. **Payments & subscriptions** — mockup `/dashboard/payments`. Stripe payouts, packages, memberships, dunning, no platform cut.
4. **Clients CRM** — mockup `/dashboard/clients` (reverse). One record per client — sessions, notes, payments, programmes, LTV.
5. **Client messaging** — mockup `/dashboard/messages`. Focused inbox separate from personal phone, threaded, AI draft replies.

Copy seed already exists in `src/routes/features.operations.tsx` (`FEATURES` array) and `src/components/marketing/PillarTabs.tsx` — reuse, don't rewrite.

### B. Replace the Coaching tabs with 4 individual 50/50s

Remove `<PillarTabs />`. Replace with one 50/50 per coaching feature, all eyebrowed *"Pillar 4 · Coaching · [Feature]"* and all CTA'd *"Explore Coaching →"* `/features/coaching`:

1. **Programmes** — mockup `/dashboard/programs`. Lift copy from the existing Programmes tab.
2. **Check-ins** — mockup `/dashboard/check-ins` (reverse). Lift from Check-ins tab.
3. **Client record** — mockup `/dashboard/clients`. *Move* this from Operations (one canonical home in Coaching since it's the coaching record), or keep it in Operations and drop here — see Open question 1.
4. **Client portal** — keep the existing one, phone mockup `/portal/today` (reverse).

Keep `PillarTabs.tsx` file in place (still used elsewhere? — check `rg PillarTabs src/`) but stop importing it here.

### C. Keep — already 50/50 and working

- Pillar 1 · Visibility
- Pillar 2 · Shop-front
- Pillar 5 · REPs AI (the hero moment + 6 AI capability cards is fine — AI is a horizontal layer, not a feature list)
- Pillar 6 · Growth

### D. Small QA fixes while we're in there

- Hero CTA reads *"Explore the six pillars"*. With this restructure we still anchor to `#pillars` (the six-pillar grid in Act 2 is the map). Leave copy as-is.
- Act 2 intro currently says *"Each one is detailed below"* — still true, just with more sections per pillar. Add one sentence: *"Some pillars contain multiple features — every one has its own section below."*
- Add a tiny inline pillar tag (eyebrow) to every new 50/50 so the visual rhythm makes the pillar grouping obvious as you scroll.
- Replaced-stack board, comparison strip, testimonials, week-with-REPs, FAQ, final CTA — untouched.

## Final section order

1. Hero
2. PressMarquee
3. Act 1 · Register
4. Pillar 1 · Visibility (1 block)
5. Act 2 · Six-pillar grid (`#pillars`)
6. Pillar 2 · Shop-front (1 block)
7. Pillar 3 · Operations — **5 blocks** (Leads, Bookings, Payments, Clients CRM, Messages)
8. TestimonialFeature
9. Pillar 4 · Coaching — **4 blocks** (Programmes, Check-ins, Client record, Client portal)
10. ComparisonStrip
11. ReplacedStackBoard + TestimonialTriad
12. UseCaseTriad
13. Pillar 5 · REPs AI hero moment + 6 AI cards
14. Pillar 6 · Growth (1 block)
15. WeekWithReps
16. FAQ
17. Final CTA

Total feature 50/50s on the page: **13** (was 6). Every feature is scannable, searchable, and screenshot-able.

## Out of scope

- No new components — reuse `ProductBlock`. No design tokens, no pricing data, no routes outside `for-professionals.tsx`.
- No copy rewrites on Hero / Act 1 / AI / Growth / FAQ / Final CTA.
- `PillarTabs.tsx` not deleted (kept for possible reuse).

## Open question

1. **Client record — Operations or Coaching?** It's listed under Operations in `features.operations.tsx` (CRM) and under Coaching in `PillarTabs` (the coaching record). I'd put it in **Operations** (it's the CRM spine for bookings/payments too) and drop the third Coaching block, leaving Coaching with 3 blocks (Programmes, Check-ins, Client portal). Confirm or flip.
