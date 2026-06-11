# /reviews — 10/10 rework (revised)

## Brutal honest, corrected

I was wrong last round. Re-checked `src/routes/index.tsx`: homepage uses **dark hero on `bg-reps-black`** → **light body sections alternating `bg-reps-warm-white` / `bg-reps-ivory`** → **dark CTA card** → dark footer. `/reviews` is currently fully dark, which makes it look like a `/features/*` pillar page (pro-facing) instead of a public consumer landing page like `/` or `/in/london`. You were right to call it. We migrate `/reviews` to the homepage pattern.

The other three calls also stand:

- **Kill the "We don't hide critical feedback" section.** Showcasing 3★ reviews on the public hub is a sales-anti-pattern for pros. Replace with a pro-positive "Why pros choose to be reviewed on REPs" block. Trust comes from *method*, not from parading negativity.
- **Remove the breadcrumb.** No other top-level marketing page has one.
- **Standardise the stat strip with `/about`** (single bordered 4-up panel, `rounded-[22px]`, gap-px, `font-display 32→40`, uppercase `tracking-[0.14em]` labels). On a light section we use a soft surface variant; the structure is identical to `/about`.
- **Broaden scope.** Add gyms, training providers, nutrition, Pilates, yoga to the explore-by-specialism tiles. Reword H1 to cover the whole platform.

---

## New section order + theme map

```text
1. Hero  (DARK — bg-reps-black, matches homepage hero)
   - MarketingHeroEyebrow
   - H1: "Reviews you can trust — for every fitness pro."
   - Lede: every coach, studio, gym, nutritionist, training provider on
     REPs — reviewed only by people who actually booked them.
   - Search bar (placeholder behaviour, same UI tokens as homepage hero)
   - 3 trust chips: Verified bookings · Moderated for legality, not
     sentiment · Pro right of reply
   - NO breadcrumb.

2. Headline rating panel  (LIGHT — bg-reps-warm-white)
   - Keep the 4.9 score + breakdown bars but restyled for a light surface
     (white card, reps-border, reps-text). Drop the three "honest stats"
     chips — they move into the stat strip.

3. Stat strip  (LIGHT — same section as #2 OR bg-reps-ivory)
   - SHARED pattern with /about: 4-up bordered panel, rounded-[22px],
     gap-px, font-display 32→40, uppercase tracking labels.
   - Numbers: "12,400+ verified reviews · 4.9 avg rating ·
     96% would rebook · Median 4h to publish".

4. How REPs reviews work  (LIGHT — bg-reps-warm-white)
   - 4-stage methodology: Book → Train → Invited to review → Published.
   - The credibility engine. Tighten copy.

5. Editor's picks  (LIGHT — bg-reps-ivory)
   - 3-card row of featured reviews on cream surface.

6. Browse reviews by specialism  (LIGHT — bg-reps-warm-white)
   - Expand from 6 to 8 tiles: PT, Group Ex, Strength, Online Coaching,
     Nutritionist, Yoga, Pilates, Gyms & Studios, Training Providers.
     (sm:grid-cols-2 lg:grid-cols-4, two rows.)

7. Full review feed  (LIGHT — bg-reps-ivory)
   - Filter row: "Most recent / Highest rated / Most helpful".
     DROP the "4★ and under" filter.
   - Restyle ReviewCard for light surface (white card, soft border).

8. Why pros choose to be reviewed on REPs  (LIGHT — bg-reps-warm-white)
   <-- REPLACES "We don't hide critical feedback".
   - 3-card row aimed at the pro reader:
     a) Reviews from real clients only — no anonymous trolls.
     b) You own the response — public right of reply.
     c) Reviews follow you across REPs — profile, shop-front, enquire,
        search, profession + city pages.
   - Soft CTA: "List your business on REPs" → /for-professionals.

9. Trust mechanics  (LIGHT — bg-reps-ivory)
   - 4 short commitments. Reframe one card from
     "critical reviews stay live" to
     "Moderated for legality, abuse and spam — not for sentiment."

10. FAQ  (LIGHT — bg-reps-warm-white)
    - MarketingFaq primitive, 5 questions:
      Who can leave a review? · Can a business respond? · How are fake
      reviews handled? · Can reviews be edited later? · Where do reviews
      show up across REPs?

11. FinalCta  (DARK — shared <FinalCta /> component, matches homepage CTA)
    - Find a coach by review → /find-a-professional
    - How reviews work for pros → /for-professionals
```

## Technical changes

**File:** `src/routes/reviews.tsx` only.

- Remove breadcrumb `<nav aria-label="Breadcrumb">` block (~L340).
- Switch root wrapper from `bg-reps-ink text-reps-text` to `bg-reps-warm-white text-reps-charcoal` (or equivalent light text token).
- Hero stays dark (`bg-reps-black`) — copy/paste structure already used by homepage hero.
- For each body section, swap dark surface classes:
  - `bg-reps-panel/15` / `bg-reps-panel/30` → `bg-reps-warm-white` / `bg-reps-ivory`
  - `border-reps-border` (dark) → keep the same token (it works on both — it's a neutral border var), but verify contrast and switch to a lighter border var if needed
  - `text-white` / `text-white/70` etc → `text-reps-charcoal` / `text-reps-muted` (or whatever the homepage uses in light sections — mirror exactly)
  - `bg-reps-panel/40` cards → `bg-white` cards with soft border + `var(--reps-shadow-card)` (matches the homepage Featured Pros + 4-step cards)
- Refactor stat block to `/about` STATS pattern (single `rounded-[22px] border gap-px` panel, `font-display 32→40`, uppercase tracking labels) but on light surface to match the rest of the page.
- Delete the "We don't hide critical feedback" section + its data array; add new "Why pros choose to be reviewed on REPs" 3-card row using `SectionEyebrow` + `SectionHeading`.
- Expand `PROFESSION_TILES` 6 → 8.
- Replace bottom dark CTA with the shared `<FinalCta />` component from `src/components/marketing/FinalCta.tsx` (already wired on `/cpd`, `/for-professionals`).
- Hero MUST use `<HeroOverlay copySide="left" />` per the locked hero-overlay system, only if it has a background image. If hero stays flat dark with no image, skip overlay.

## Memory updates after lock-in

- Update `mem://design/locked-reviews` (create) with section order, theme map, surface tokens per section, and the "reviews are public consumer-landing, not pro-pillar" classification rule.
- Add a Core note: "Public consumer-landing pages (/, /in/$location, /reviews, /find-a-professional) use the homepage theme pattern: dark hero + alternating warm-white/ivory body + dark FinalCta. /about and /features/* stay fully dark."

## Out of scope (Phase 1, unchanged)

Real review data, functional search/sort, pro-response moderation backend, per-profession real counts, auth, DB, payments.

## Compliance

Will run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` after the edit. Expected: 0 violations from `reviews.tsx`. The 14px pro-thumbnail radius exception still applies if a scaled-down profile photo appears in a card.
