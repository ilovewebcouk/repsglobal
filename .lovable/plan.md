## Two changes in one pass

1. **Replace the proof band** on `/for-professionals` with a fade-edged scrolling press marquee — hero → marquee → Act 1 all on `bg-reps-ink`, logos drift R→L forever, edges fade to ink via mask-image.
2. **Fold the 2009 heritage** into the existing `/about` page as a "Since 2009" section so the heritage signal isn't lost when the proof band's headline disappears.

## 1 · Press marquee on `/for-professionals`

### What changes in `src/routes/for-professionals.tsx`

Proof band (currently ~lines 159–212) collapses to:

- **Section**: `bg-reps-ink`, `py-14 lg:py-20`. Same ink as hero + Act 1.
- **Eyebrow** (centred, above marquee): `AS FEATURED IN`, small caps, tracked `0.18em`, `text-reps-muted`.
- **Marquee track**: full-bleed horizontal strip, ~64px tall, edge fades on both sides.
- **Remove**: shield icon, "TRUSTED SINCE 2009" eyebrow, "Built in 2009…" headline, heritage sub-paragraph, orange radial glow, hairline divider, current static wordmark row.

### New component: `src/components/marketing/PressMarquee.tsx`

Why a component: the marquee logic (duplicated track + animation + edge fades) is reusable and the route file shouldn't carry CSS gymnastics.

Structure:

```text
<section> overflow-hidden, mask-image both edges
  <div> single track, flex gap-16, w-max, animate-marquee
    [logo, logo, logo, logo, logo, logo]   ← rendered once
    [logo, logo, logo, logo, logo, logo]   ← rendered again (duplicate for seamless loop)
```

Logos: the six existing SVGs from `src/assets/press/` (bbc-sport, gq, mens-health, runners-world, womens-fitness, the-times). Each rendered as `<img>` at `h-7 lg:h-8 w-auto`, `opacity-70`, `brightness-0 invert` so they sit on dark cleanly (or `text-white/70` filter equivalent). No hover state, no pause — user picked continuous.

Edge fade: the section uses `mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent)` so logos fade into the ink at both edges, no hard cut.

Animation: reuse the existing `@utility animate-marquee` already defined in `src/styles.css` (`transform: translateX(0) → translateX(-50%)` over 38s linear infinite). The 50% translate exactly equals one duplicated set — seamless loop. No new keyframes needed.

Accessibility: respect `prefers-reduced-motion` — when set, freeze the marquee (`animation: none`) so it sits as a static row. Add via a `@media (prefers-reduced-motion: reduce)` rule on the marquee class.

### Verification

- 1440px: hero → marquee → Act 1 reads as one continuous dark surface. Logos drift, fade in from right, fade out to left. No visible seam at loop point.
- 390px: marquee still flows, logos legible, fade gradient still readable on narrow viewport (may need to widen fade % on mobile if it eats logos — tune after screenshot).
- Reduced-motion: marquee freezes as a static logo row.

## 2 · Heritage section on `/about`

### What changes in `src/routes/about.tsx`

I'll read the current file first to find the right insertion point — likely after the hero/intro and before mission or team. The section adds:

- **Eyebrow**: `SINCE 2009`
- **Headline**: "Built in 2009. Rebuilt for 2026." (or the team's preferred wording — placeholder for now, easy to swap)
- **Sub**: 2–3 sentences on the heritage — REPs UK origin, what's carried forward, what's new under REPs Global. Pulled/adapted from the copy currently in the proof band.
- **Optional small detail strip**: 3 micro-stats (e.g. "16 years", "Trained X professionals", "Trusted by Y") — only if the data exists in the current about page or copy doc. If not, skip and keep the section copy-only.

Treatment: matches the existing About page's surface and typography — no new tokens, no new layout primitives. Just a new section block consistent with whatever's already there.

### head() meta

If `/about` already has `head()`, leave it alone. The heritage section is content, not a new route, so SEO surface doesn't change.

## What stays out

- No changes to hero or Act 1 on `/for-professionals`.
- No new design tokens.
- No `/history` route — folded into About per your choice.
- No changes to press logo files, order, or count.
- No pause-on-hover, no manual pagination — continuous scroll only.

## Honest risks

- **Marquee seam**: if the duplicated track + 38s timing doesn't loop seamlessly at the current logo count, the join will be visible. Fix is to tune the gap or animation duration, not to add a third track copy. Will verify with a screen recording style check after build.
- **Logo contrast on ink**: applying `brightness-0 invert` to coloured SVGs (e.g. BBC Sport red, GQ serif) flattens them to white wordmarks, which is what we want for the editorial row — but it does strip brand colour. If you want logos in their original colours, say so before I build and I'll render them as-is with a subtle `opacity-80` instead. Default = flatten to white.
- **About page heritage section**: I haven't read `/about` yet, so the insertion point and tone-matching is a "read first, place sensibly" step. If About is already overstuffed, I'll flag before slotting in.
