
# Hero rewrite — /for-professionals

Replaces the current hero (define-by-negation headline + small scaled-iframe device cluster) with a heritage-anchored hero featuring one verifiable register number and a 2× larger, art-directed product showcase.

Scope: hero section only (lines 80–176 of `src/routes/for-professionals.tsx`) plus one new component. Rest of page unchanged.

## The new hero, written out

```text
[Eyebrow]      THE REGISTER  ·  SINCE 2009

[Headline]     Verified fitness professionals
               have lived here for {N years}.
               Now the software lives here too.

[Subhead]      Get found on the register {X} clients search every month.
               Run the rest of your practice on the platform built around it —
               leads, bookings, programmes, check-ins, payments, AI.

[CTAs]         [ Join REPs → ]   [ See how it works ]

[Trust row]    ✓ Verified since 2009     ✓ Every feature included     ✓ Founding pricing — locked for life
```

Why this works where the current hero doesn't:

- **Headline names the unfakeable asset first** (16+ year register heritage), then re-positions the software as the new thing — not the other way round. No competitor can copy the heritage line. Anyone can claim "operating system."
- **One verifiable number** in the subhead does the work three vague benefit-bullets do today.
- **"See how it works"** as secondary CTA scrolls to / links into the 6-pillar grid below — the page's actual deep dive — instead of dumping users on `/features`.
- **Trust row** trades the generic "Verified · Trusted · Booked" chip for three specific, defensible claims (heritage, scope, pricing).

## The one verifiable number — **need your input**

I will not fabricate a stat. Pick one of these to anchor on (or supply your own):

1. **Monthly traffic** — *"the register {X,XXX} clients search every month"* (strongest if you have it from analytics).
2. **Register size** — *"join {X,XXX}+ verified professionals already listed"* (works if you have a real headcount; weaker if Phase 1 is light).
3. **Heritage years only** — *"the verified register since 2009 — {17} years on the public record"* (always true, no analytics needed; weakest of the three but always available).

If you don't have option 1 or 2 today, I'll ship with option 3 and we swap in a real number the moment it's confirmed. Tell me which to use.

## The new product showcase (replaces `HeroDeviceCluster`)

New component: `src/components/marketing/HeroProductShowcase.tsx`.

Three layered elements, 2× the current visual weight:

```text
                     ┌──────────────────────────────────────┐
                     │  ▢ ▢ ▢   reps.app/dashboard          │ ← Large laptop, ~1.5× current scale
                     │                                       │   Bespoke product still, not live iframe
                     │   [Dashboard art-directed shot]       │   Generated once, saved as .asset.json
                     │                                       │
                     └──────────────────────────────────────┘
                                                  ┌────────┐
                                       ┌──────────│ Phone  │ ← Floating, larger, offset bottom-right
                                       │ Verified │ Portal │   Same bespoke-still approach
                                       │  Badge   │        │
                                       └──────────└────────┘
                                                                  ↑
                                                Third floating element:
                                                "Verified · CPD current"
                                                credential card, bottom-left
                                                of laptop. Sells the heritage
                                                claim visually.
```

Implementation choice — pick one in feedback:

- **A. Bespoke product stills** (recommended): use the bundled product-shot skill to generate two polished PNGs (laptop dashboard, phone portal) with shadow + mesh-gradient background, upload via `lovable-assets`, embed as static `<img>`. Pros: premium, fast to load, no iframe scaling artefacts, art-directable. Cons: stills don't update if `/dashboard` changes.
- **B. Keep live iframes, just scale up + add the floating credential card.** Pros: stays in sync with product. Cons: still looks like a scaled iframe, slower, more brittle.

I recommend **A** — this is the move that takes the hero from "competent" to "premium." Stills can be regenerated in 1 minute when the dashboard changes.

The new floating credential card is a small `Card` with `BadgeCheck` + "Verified · CPD current · Insured" — three lines, sells the heritage claim *visually* so it isn't just a copy claim.

## Technical changes

Files touched:

| File | Change |
|---|---|
| `src/routes/for-professionals.tsx` | Replace hero section (lines 80–176) with new copy + new component import. Drop the `Sparkles`, `BadgeCheck`, `Zap`, `Check` icon imports no longer used in the hero (re-import only what's still used). |
| `src/components/marketing/HeroProductShowcase.tsx` | **New.** Renders large laptop + floating phone + floating credential card. Uses bespoke `.asset.json` stills if option A picked, else wraps `ScaledFrame` at 1.5× scale. |
| `src/assets/hero-dashboard-shot.png.asset.json` | **New** (option A only). Generated product still of `/dashboard`. |
| `src/assets/hero-portal-shot.png.asset.json` | **New** (option A only). Generated product still of `/portal/today`. |

The existing `HeroDeviceCluster` component is left in place (still used elsewhere); the for-pros hero just stops importing it.

Hero anchoring rules from memory honoured: `justify-start`, `items-start`, `lg:pt-24`. Animation timings preserved (560/640 ms, 0/80/180/260/340 ms delays). No changes outside the hero `<section>`.

## What I need from you to ship

1. **Which number** (1, 2, or 3 above)? If 1 or 2, supply the figure.
2. **Showcase implementation A or B?** I recommend A.
3. **Headline check:** I've drafted *"Verified fitness professionals have lived here for {N years}. Now the software lives here too."* — approve, or send a tweak. I can also draft 2 alternatives if you want options.

Once those three are confirmed I implement in one pass.
