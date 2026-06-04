## Brutal read of what's there now

The current proof band is **better than the two-strip version it replaced, but it's still not world-class**. Honest problems:

1. **Three columns of disconnected information.** "Trusted since 2009" sits left, four generic bullets sit middle, six press logos sit right. The eye scans three separate things and walks away with no single takeaway. Stripe, Linear, Vercel never do this — they pick ONE proof and weaponise it.

2. **The bullets are landing-page filler.** "Verified pro badge — backed by the register", "Reviews on the public record", "Built for fitness, not general CRM", "One platform — no paid bolt-ons". These are claims the rest of the page already makes louder. Repeating them here in tiny text adds visual weight, not persuasion.

3. **"Trusted since 2009" is the strongest asset and we're whispering it.** 16 years of register heritage in a category where competitors are 5–8 years old is the single most defensible claim REPs has. It deserves to be the hero of this band, not a side column at 34px.

4. **Press logos are decoration, not endorsement.** Six monochrome SVGs in a 3×2 grid with no quote, no context, no link. The reader registers "some logos" and moves on. Real press proof is one pull-quote with the masthead, or logos linked to actual coverage on `/press`.

5. **No fitness-industry texture anywhere.** This is a fitness app. There is nothing in this band that couldn't appear on a tax-software landing page. No mention of PTs, gyms, coaches, the actual humans on the register. Generic-SaaS energy in a category that should feel physical and human.

6. **Visual rhythm is flat.** One panel, three equal-ish columns, hairline dividers, same type weight throughout. Nothing pulls the eye. Premium SaaS proof bands have a clear focal point (a number, a face, a quote) and supporting evidence around it.

## What world-class looks like for THIS product

For a fitness coaching SaaS with 16 years of register heritage, the proof band should answer ONE question in the first 0.5 seconds: **"Why should I, a working PT, trust REPs over Trainerize?"**

The answer is **heritage + public trust + press**, framed as a single confident statement, not three columns of bullets.

I'd take inspiration from:
- **Linear's "Built for…" band** — one big statement, supporting logos beneath
- **Vercel's stat band** — three large numbers, no bullets
- **Stripe's customer wall** — one quote + face, logos as a quiet supporting row

## The plan — one band, one focal point, two supporting rows

```text
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ★ THE UK'S VERIFIED FITNESS REGISTER · SINCE 2009                  │
│                                                                      │
│   The register the public already searches when                      │
│   they're looking for a qualified fitness pro.                       │
│                                                                      │
│   ──────────────────────────────────────────────────────────────     │
│                                                                      │
│   AS FEATURED IN                                                     │
│   [Times]   [BBC Sport]   [Men's Health]   [GQ]   [W.Fitness] [RW]  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Three deliberate moves:**

### 1. Kill the middle "Why pros join" column

Those four bullets duplicate Act 1, Act 2, the comparison strip, and the FAQ. Delete them from the proof band. Trust bullets belong inside Act blocks, not stacked under the hero where they steal attention from the heritage anchor.

### 2. Make heritage the hero of the band

Centre-aligned, full width, one confident line in display type:

> **The UK's verified fitness register. Since 2009.**

Subline (one sentence, not three bullets):
> *The register the public already searches when they're looking for a qualified fitness pro — now with the tools to run the whole practice.*

A single orange star/shield glyph above the line as a focal anchor. Type set at ~36–42px on desktop, ~26px on mobile. This is the only piece of text in the band that needs to be loud.

### 3. Press as a quiet, premium supporting row

- Hairline divider under the heritage block
- Eyebrow "AS FEATURED IN" in muted white (not orange — orange is reserved for the heritage anchor so it stays the single focal point)
- All six logos in a single row on desktop (`flex` with generous `gap-10`), 28–32px tall, 80% opacity → 100% on hover
- On tablet wrap to two rows of three; on mobile a 2-column grid
- Each logo wraps a `<Link to="/press">` so they're functional, not decorative

### 4. Visual treatment

- One `rounded-[22px]` panel on `bg-reps-panel/40` with a subtle orange radial glow centred behind the heritage line (not off to the left)
- Generous internal padding (`py-14 lg:py-16`) so the band breathes — currently it feels cramped
- Subtle ring (`ring-1 ring-reps-border/60`) instead of the current border for a softer premium edge
- No vertical dividers (no longer needed — single column)

## Why this beats the current version

- **One focal point.** Heritage. Everything else supports it.
- **Removes the bullet duplication** with Act 1/2/3 content below.
- **Press becomes endorsement, not decoration** — bigger logos, linked, properly anchored under the heritage claim.
- **Fitness-specific.** "The register the public searches for a qualified fitness pro" only makes sense in this category — no SaaS template feel.
- **Centred layout reads as confident.** Three-column grids read as "we have to list things." A single statement reads as "we are the standard."

## Files to change

- `src/routes/for-professionals.tsx` — replace lines 139–207 (the proof band block) with the new single-focal-point band. No new components, no new assets, press logos already imported.

## Scope guardrails

- Hero, header, footer, nav, routes, pricing, backend untouched
- No new claims beyond "Since 2009" (factual)
- Press logos stay the six already imported
- No new components — inline JSX since it appears once
- Phase 1 presentational only

## Open question for you before I build

Do you want me to **also add a single pull-quote** from a named PT below the heritage line (e.g. *"REPs is the only platform built for how I actually run my coaching business." — Name, PT, City*) — or keep the band copy-light and let the testimonial sections later in the page carry the human voice?

My recommendation: **keep it copy-light here.** A quote in this band would compete with the heritage statement for focus. The Testimonial Feature block lower down is where a quote lands hardest. Let this band be one claim, period.
