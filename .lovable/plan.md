# Shop-front pass on /for-professionals

## The gap

The page name-drops Shop-front in the Act 2 intro ("see a live example") and includes it as one of six pillar tiles, but the rest of the page acts like it doesn't exist:

- No dedicated 50/50 showcase / CTA section — the "see a live example" link is the only proof.
- The comparison table (`ComparisonStrip`) has zero rows about it.
- The "One connected platform" before/after board (`ReplacedStackBoard`) doesn't list Wix/Squarespace on the **Before** side, and doesn't surface "Personal shop-front at /c/your-name" on the **After** side — so coaches don't see that REPs replaces their website too.

Shop-front is a **Pro + Studio** feature (per locked coach shop-front memory) and is the most photographable surface REPs has — it deserves a hero moment on this page.

## What we'll change

### 1. New Pillar 1.5 — Shop-front showcase (50/50 with live CTA)

Insert a new section **between Act 2 pillars grid and Pillar 1 · Leads CRM** (i.e. right after the six-tile grid, so it directly fulfils the "see a live example" promise made in the intro).

Use the existing `ProductBlock` component for visual consistency with the other pillar showcases.

```
eyebrow:  "Pillar · Shop-front"
title:    "The page that turns visitors into clients."
body:     "Pro and Studio plans include a personalised shop-front at
           /c/your-name — your story, your method, your tiers, your
           proof. Designed to convert. Indexed by Google. Nothing to
           build, nothing to host."
bullets:
  - Outcome-led hero with your photo and verified badge
  - Three-tier services with a 'Most popular' lane
  - Foundation method, transformation proof, testimonials
  - SEO-ready at /c/your-name — replaces your Wix/Squarespace site
mockup:   { device: laptop, src: "/c/james-wilson" }
ctaLabel: "See the live example"
ctaHref:  "/c/james-wilson" (open in new tab)
secondary CTA: "Explore Shop-front" → /features/shop-front
reverse:  true (image-left, copy-right — alternates with Pillar 1 below)
```

Also remove the "see a live example" link from the Act 2 intro paragraph (line 236–239) since the showcase section right below now carries that job — keeps the intro paragraph clean.

### 2. Add Shop-front rows to `ComparisonStrip`

Edit `src/components/marketing/ComparisonStrip.tsx` ROWS to add two new rows:

```
{ label: "Personal shop-front at /c/your-name", reps: true, trainerize: false, mypthub: false, ptd: false },
{ label: "Replaces your website (Wix/Squarespace)", reps: true, trainerize: false, mypthub: false, ptd: false },
```

Place them after "Public verified register" so the two register/shop-front rows sit together at the top.

### 3. Add Wix/Squarespace + Shop-front to `ReplacedStackBoard`

Edit `src/components/marketing/ReplacedStackBoard.tsx`:

- **BEFORE list:** add `{ name: "Wix / Squarespace", job: "Website" }` — bump the "8 tools" counter to "9 tools".
- **AFTER list:** add `"Personal shop-front at /c/your-name"` near the top (just after "Verified directory listing").

This makes the headline promise — "replace the scattered stack" — actually include the website most coaches are paying £15/mo for.

## Out of scope (Phase 1 guardrail)

No new routes, no backend, no edits to /features/shop-front or /c/$slug (both locked). No pricing copy changes. No new images — the `ProductBlock` mockup component renders the live `/c/james-wilson` route inside its laptop frame as it already does for other pillars.

## Files touched

- `src/routes/for-professionals.tsx` — new `<section>` with `ProductBlock`, intro paragraph trim.
- `src/components/marketing/ComparisonStrip.tsx` — 2 new ROWS entries.
- `src/components/marketing/ReplacedStackBoard.tsx` — 1 new BEFORE entry + counter bump + 1 new AFTER entry.

## QA after build

- Visit `/for-professionals` at 1440 / 1024 / 390. Confirm new Shop-front section renders, `reverse` alternation looks right against the Pillar 1 section that follows it, and CTAs work.
- Confirm `ComparisonStrip` still fits without horizontal scroll on desktop; mobile already scrolls.
- Confirm `ReplacedStackBoard` "9 tools" reads correctly and the two-column BEFORE grid still balances.
- Run REPs compliance audit (tokens, radii, no shadows on buttons).
