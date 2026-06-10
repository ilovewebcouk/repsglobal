---
name: Locked /about
description: Frozen 2026-06-10 — 10-section brand pillar: cinematic hero, kept stat strip, manifesto moment, heritage bridge, FeaturedProCard proof strip, "more than a directory" 50/50, zigzag pillars link list, independence editorial, horizon close, FinalCta. Uses 4 cinematic Lovable-Asset images (all REPS-wordmark compliant). Two locked type exceptions: Manifesto block (32→52px) in section 3 and Horizon close (34→56px) in section 9 — both deliberate breaks of SectionHeading. Page sits in the brand layer (cohesive with /, /find-a-professional, /c/$slug) — NOT in the dense /features/* pillar style.
type: design
---

# /about — Locked design

Frozen 2026-06-10. Do not redesign without an explicit, section-named request.

## Section order (locked)

1. **Cinematic hero** — `heroAsset` (warehouse gym, white REPS tee). `HeroOverlay copySide="left"`. `MarketingHeroEyebrow` "About REPs". H1 `text-[44px] lg:text-[64px]` — "The professional platform for the modern fitness industry." Two CTAs (Find a professional / Join as a professional). Rhythm: `pt-24 pb-20 lg:pt-28 lg:pb-24`.
2. **Stat band** — 4 tiles, `rounded-[22px]`, `pt-10 pb-16 lg:pt-12 lg:pb-20` proof-strip rhythm. Verified pros / Sessions booked / Countries / Avg rating.
3. **Manifesto** — `bg-reps-panel/15`. Page-local type **EXCEPTION**: 4 stacked sentences at `font-display text-[32px] lg:text-[52px]`. Closes with "into one place." in `text-reps-orange`.
4. **Heritage bridge** — 50/50 (1.1fr/1fr). Locked bridge copy verbatim + `heritageAsset` 4:5 portrait with orange radial glow below.
5. **Built around trust** — `bg-reps-panel/30`. 50/50 (1fr/1.1fr). Editorial copy + three real `FeaturedProCard`s (James Wilson, Sophie Taylor, Liam Roberts) — reuse city-page cards as the proof moment.
6. **More than a directory. More than software.** — Centred eyebrow+heading, then two `BlockHeading` blocks side-by-side: "For the public." / "For professionals."
7. **System behind the listing** — `bg-reps-panel/15`. Zigzag 50/50 (image left, copy right). `professionalsAsset` portrait + 6-pillar text-only link list (Visibility, Shop Front, Operations, Coaching, REPs AI, Growth). Each row: label + body + ArrowUpRight, divide-y border-y, hover lifts the arrow to brand orange.
8. **Built for independence** — 50/50 (1.1fr/1fr). Editorial + `independenceAsset` 3:4 portrait.
9. **Horizon close** — Pure `bg-reps-ink` with bottom radial brand-orange glow. Page-local type **EXCEPTION**: H2 `text-[34px] lg:text-[56px]` triplet, "stronger ecosystem" highlighted with a brand-orange underline strip.
10. **FinalCta** — Shared `<FinalCta />`, `eyebrow={null}`, heading "Build your professional presence with" + accent "REPs.", primary `/for-professionals`, secondary `/find-a-professional`.

## Imagery

All 4 images are cinematic editorial photographs uploaded as Lovable Assets under `src/assets/about/`:

- `about-hero.jpg` — warehouse gym, coach in white tee with REPS left-chest embroidery
- `about-heritage.jpg` — studio consultation, white polo with REPS left-chest
- `about-professionals.jpg` — online coach at laptop, dark tee with centred REPS chest print
- `about-independence.jpg` — outdoor dawn portrait, black tee with centred REPS chest print

All comply with `mem://design/trainer-imagery` (white REPS wordmark, ALL CAPS, real embroidery/print). No mockups, no UI screenshots, no device frames anywhere on this page.

## Type exceptions

- **Section 3 (Manifesto):** `font-display text-[32px] lg:text-[52px]` paragraphs — NOT `SectionHeading`. This is the page's emotional centrepiece and is the only place on /about that breaks the standard scale on the body side.
- **Section 9 (Horizon close):** H2 `text-[34px] lg:text-[56px]` — NOT `SectionHeading`. Locked closing statement, brand-orange underline strip on "stronger ecosystem".

These two exceptions are page-local. Do not import them as a primitive and do not replicate on other routes.

## Compliance

- Radii: 10 (buttons), 18 (FeaturedProCard inherited), 22 (panels/stat strip/image frames), 24 (FinalCta inherited). No 14/20/28/32, no `rounded-xl/2xl/3xl`.
- Brand orange via tokens only.
- Emerald appears only via FeaturedProCard's `bg-reps-green` Verified pill (inherited from card primitive).
- No banned terms (no UK, no CIMSPA, no booking-fee, no £10k/month, no "scale to 6 figures").
- Flat buttons (`shadow-none`).
- Sections use alternating `bg-reps-ink` / `bg-reps-panel/15` / `bg-reps-panel/30`. No hairline dividers between sections.

## Out of scope (do not add)

- Team photos, founder bios, "Our position on the old REPs", press logos, device mockups, annotated UI mocks.
- Backend wiring, real data, real search.
