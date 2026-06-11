## Brutal honest verdict on the current /reviews

Current state ≈ **6.5 / 10**.

What's wrong, specifically:

1. **It went fully dark** to fix the "grey ghost nav" issue. That broke parity with the homepage, which is the page you actually want this to feel like. /about is allowed to be all-dark (it's a brand/manifesto pillar). /reviews is closer to a homepage-style hub.
2. **The hero looks like a Trustpilot dashboard** — big 4.9 + bars on the right, score-led, no human, no story. That's the most generic possible treatment for a reviews page.
3. **Two competing stat moments stacked back-to-back** — the score panel inside the hero AND the 4-cell stat strip 80px below it. Visually it reads as "stat → stat → stat → finally content".
4. **Header reads correctly now** (transparent over the dark hero, solid after scroll). The "grey strip" was a symptom of mixing the light body with the transparent header — solvable without going all-dark.
5. **Editor's picks and the feed look identical** — same panel, same border, same density. No hierarchy.
6. **Pro pitch is buried** in a dim mid-page tile row — it should feel like a moment, not a footnote.

So no, this is not 10/10. Here is what 10/10 looks like, locked to the choices you just made (homepage-style mixed theme, hybrid consumer+pro, image-led editorial hero).

---

## Target shape: homepage-mixed, image-led editorial

Surface system (mirrors `/`):

- Hero: `bg-reps-black` with editorial image, header stays `transparent` and goes solid on scroll — same behaviour the homepage already has.
- Body: alternating `bg-reps-ivory` ↔ `bg-reps-warm-white` (light editorial, like the homepage's body).
- Close: dark again (`bg-reps-ink`) for the FinalCta + footer, exactly like the homepage.

This is the single biggest move. It restores light/dark rhythm and fixes the "why does this look nothing like the homepage" complaint.

---

## Section order (10 sections)

```text
1.  HERO — dark, image-led editorial
2.  TRUST RAIL — slim dark band directly under hero (1 row)
3.  EDITORIAL FEATURE REVIEW — light, magazine-style 50/50
4.  HOW A REVIEW GETS HERE — light, 4-step inline rail
5.  EDITOR'S PICKS — light ivory, 3 quote-led cards
6.  BROWSE BY SPECIALISM — light warm-white, 9-tile mosaic
7.  THE FEED — light ivory, 2-col masonry + sort
8.  WHY PROS CHOOSE REPs REVIEWS — dark inset band (the "moment")
9.  FAQ — light, MarketingFaq
10. FINAL CTA — dark, shared FinalCta + footer
```

### 1. Hero (dark, image-led)

- Full-bleed editorial photo of a coach mid-session, REPS wordmark on chest (per trainer-imagery rule). Use existing `HeroOverlay copySide="left"` — never hand-roll the wash.
- Left column copy: `MarketingHeroEyebrow` "Reviews on REPs" → H1 "Every review came from a real booking." → 16px lede → 3 trust chips → primary CTA "Find a professional" + ghost link "How a review gets here".
- Right column: **no rating dashboard.** Instead, a single floating "verified review" card — initials, 5 orange stars, a 2-line quote, the pro's name + role, and a small "Verified booking · 14 Nov" line. Reads like proof, not a leaderboard.
- Standard rhythm: `pt-24 pb-20 lg:pt-28 lg:pb-24`.

### 2. Trust rail (dark, slim)

Single dark band immediately under the hero, before the light body starts. One row, 4 cells, divider keylines (the `/about` pattern). Stats: `12,400+ verified reviews · 4.9 avg · 96% would rebook · 100% booking-verified`. This is the only stat moment on the page — kills the duplicate score+strip problem.

### 3. Editorial feature review (light, 50/50)

The hero proof, expanded. Light ivory. Left: large pro portrait (radius 22). Right: pull-quote in display type, attribution, programme, "Verified booking" badge, link to the pro's shop-front. This is the page's most distinctive moment and the thing nobody else does.

### 4. How a review gets here (light)

Reframe the 4-step methodology as a **horizontal rail with numbered ribbons** (01–04), not 4 identical cards. Light surface, dark text, orange step numbers. Tighter than the current grid.

### 5. Editor's picks (light ivory)

3 quote-led cards (not feed cards). Bigger pull-quote, smaller meta. Orange "Editor's pick" pill, clear visual difference from the feed below.

### 6. Browse by specialism (light warm-white)

9 tiles, `sm:2 lg:3` mosaic, light surface, subtle stone border, orange chevron on hover. Same data already in `PROFESSION_TILES`.

### 7. The feed (light ivory)

Sort pills only (Most recent / Highest rated / Most helpful). 2-column light review cards. "Load more reviews" ghost button. No filters — Phase 1.

### 8. Why pros choose to be reviewed on REPs (dark inset)

The pivot to pro acquisition. Wrap the whole section in a **dark inset band** with `bg-reps-ink` + soft orange radial glow — so it reads as a moment inside the light body, not a fourth identical card row. 3 cards (real clients only / right of reply / reviews follow you across REPs) + primary CTA "List your business on REPs" + link to `/features/visibility`.

### 9. FAQ (light)

Light surface variant of `MarketingFaq`. Same 5 questions already drafted.

### 10. Final CTA + footer (dark)

Shared `<FinalCta />` + `<PublicFooter />` — unchanged.

---

## What gets removed

- The 4.9 + ratings-breakdown panel inside the hero (rating bars feel aggregator-y; the trust rail covers the number).
- The dedicated dark stat strip below the hero (folded into the trust rail).
- Duplicate dark backgrounds on every section.
- The "Trust mechanics — four commitments" grid (its job is covered by Methodology + Why Pros + FAQ; removing it tightens the page).

---

## Header / "grey ghost nav" fix

Use the same pattern the homepage uses: `<PublicHeader variant="transparent" />`. Transparent over the dark hero, solid-dark on scroll. The ghost-grey effect only happens when transparent header sits over a light body — putting the hero on `bg-reps-black` removes the bug without going all-dark on the whole page.

---

## Technical notes

- File: `src/routes/reviews.tsx` only.
- `MarketingFaq` currently renders dark — add a `tone="light"` prop (white surface, ink text, stone borders) so /reviews can reuse it without forking. Single shared primitive stays the source of truth.
- All section radii respect the locked scale: hero 24, large panels 22, cards 18, buttons 10, inputs 12, pills full. No 14/20/28/32, no `rounded-xl/2xl/3xl`. 14px exception only for downscaled pro thumbnails.
- Tokens only — no hex in components. Light surfaces via `bg-reps-ivory` / `bg-reps-warm-white` / `border-reps-stone` (homepage pattern).
- Section rhythm strictly `py-20 lg:py-28`; trust rail uses the tight proof-strip rhythm `pt-10 pb-16 lg:pt-12 lg:pb-20`.
- No hairline dividers between sections; rhythm is colour-band only.
- Image-led hero uses `HeroOverlay copySide="left"` (no inline wash).
- Run `audit.sh`; must exit 0.
- Update `mem://design/locked-reviews` to reflect the new locked structure.

---

## Out of scope (Phase 1)

Real review data, working sort, search, profession counts, per-profession averages, response moderation backend, auth, payments, AI summaries.

---

## Decisions still open

None — your three answers (homepage-mixed theme, hybrid consumer+pro, image-led editorial hero) fully determine the design. I'll implement exactly the above when you approve.