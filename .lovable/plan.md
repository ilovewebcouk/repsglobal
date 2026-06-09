## Goal

Rebuild `/features/visibility` as the definitive REPs visibility pillar page: the client's path from public directory → profile → verification → reviews → specialisms → enquiry, told from both the trainer's and the client's POV, using live REPs routes inside DeviceMockup frames and only the locked marketing primitives.

## Strategic positioning (locked into hero + Section 1)

> "Most fitness software helps you manage clients after they sign up. REPs helps you become visible *before* they choose who to contact."

Visibility = public profile, directory presence, verification, reviews, specialisms, enquiry. Not CPD, not Growth, not generic marketing.

## Final section order

```
Hero                  — top-anchored, 3 trust chips, PressMarquee
Section 1  Problem    — 50/50 "scattered today" vs "one REPs profile"
Section 2  Profile    — AnnotatedMock of /pro/james-carter (client's POV)
Section 3  Discovery  — DeviceMockup of /find + filter explainer
Section 4  Trust grid — 6 dark cards (verification / quals / insurance / CPD / reviews / specialisms)
Section 5  Reviews    — DeviceMockup of /pro/...#reviews + authenticity rules
Section 6  SEO reach  — DeviceMockup of /in/manchester (off-platform indexable visibility)
Section 7  Segments   — tabbed selector swaps example profile across 7 pro types
Section 8  Verified vs Pro — reuse ComparisonStrip-style visibility-only matrix
Section 9  FAQ        — MarketingFaq, 6 questions
Section 10 FinalCta   — shared FinalCta component
```

The current 5-capability `PillarPage` flow is replaced. We stop using `PillarPage` for visibility and build the route directly so sections aren't forced into the rigid alternating 50/50 grid. Other pillars keep `PillarPage` untouched.

## New reusable primitive

**`src/components/marketing/AnnotatedMock.tsx`**

A `DeviceMockup` (laptop or phone) wrapped in `MockupStage` with absolutely-positioned numbered orange pills (1–6) anchored to percentage coordinates, each connected to a legend list beside/below the mock. Used in Section 2 (profile anatomy) and reusable on future pages (shop-front anatomy, dashboard anatomy). Added to `/dev/section-library` with a "What NOT to do" note (no more than 6 call-outs, never cover faces or text).

No other new primitives. Section 7's segment selector uses existing shadcn `Tabs` + `DeviceMockup` — no new component.

## Per-section content + primitive map

| Section | Primitive(s) | Live route(s) inside DeviceMockup |
|---|---|---|
| Hero | hero scaffold from `PillarPage` cloned inline, `MarketingHeroEyebrow`, `PressMarquee` | — |
| 1 Problem | `SectionEyebrow` + `SectionHeading` + `BlockHeading` × 2, two flat panels | — (static "before" collage of fake IG bio / Linktree / WhatsApp screenshot vs "after" REPs profile thumbnail) |
| 2 Profile | `SectionHeader` + new `AnnotatedMock` | `/pro/james-carter` (laptop) |
| 3 Discovery | `SectionHeader` + `DeviceMockup` + 4 filter chips | `/find` (laptop) |
| 4 Trust grid | `SectionHeader` + 6 cards (existing card pattern from `/specialisms` `RegistersBlock` style) | — |
| 5 Reviews | `SectionHeader` + `DeviceMockup` + `BlockHeading` authenticity panel | `/pro/james-carter#reviews` (laptop) |
| 6 SEO reach | `SectionHeader` + `DeviceMockup` | `/in/manchester` (laptop) |
| 7 Segments | `SectionHeader` + shadcn `Tabs` + `DeviceMockup` swap | `/pro/james-carter`, `/pro/sarah-mitchell`, etc. (laptop) — uses existing seeded pros |
| 8 Verified vs Pro | `SectionHeader` + small 2-col matrix (reuses `PlansLimitsStrip` card pattern, scoped to visibility rows only) | — |
| 9 FAQ | `MarketingFaq` | — |
| 10 FinalCta | `FinalCta` | — |

## Copy (locked)

- **H1**: "Be found by clients looking for trusted fitness professionals."
- **Sub**: "Create a verified REPs profile that brings your credentials, reviews, specialisms and contact options into one public place clients can understand and act on."
- **Hero CTAs**: Join REPs / See how profiles work (→ `#profile`)
- **Hero chips**: Verified credentials · 10-minute setup · Every feature in your tier included
- **Section eyebrows** (must match `/for-professionals` casing/style via `SectionEyebrow`): "The visibility problem", "Your public REPs profile", "How clients discover you", "Trust signals that matter", "Turn reviews into public proof", "Found beyond REPs too", "Visibility for every professional", "Verified vs Pro", "Common questions".
- **FAQ Qs**: Will I rank top? · Can I hide my profile? · Who can leave a review? · Do I need Pro to be visible? · Is my profile indexed by search engines? · Can I reply to reviews?
- **Forbidden phrasing**: "guaranteed leads", "rank higher on Google", "booking fee/commission", "UK", any 15% or flat-plan language. Use "designed to help clients search, compare and contact suitable professionals with more confidence."

## Compliance contract (must pass)

- All H2s → `SectionHeading` (30→40). All in-block H3s → `BlockHeading` (28→36). Zero hand-rolled `font-display text-[Npx]` headings.
- All eyebrows → `SectionEyebrow` (chip style identical to `/for-professionals`).
- Radii: cards 18px, panels 22px, hero 24px, buttons 10px, inputs 12px. No 14/20/28/32, no `rounded-xl/2xl/3xl`.
- Buttons: `shadow-none`.
- Emerald only on the "Verified" trust-grid card; orange brand elsewhere.
- White opacities only /45 /55 /70 /80. Hero lede 16px, section lede 15–15.5px.
- All mocks are live REPs routes wrapped in `DeviceMockup` + `MockupStage`. No screenshots.
- `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` must exit 0.

## Out of scope

- Touching `PillarPage` or any other pillar route.
- New backend, search ranking logic, real review pipeline.
- New seeded pros (use what's already in `/pro/*`).
- iframe→static-screenshot migration (tracked separately).
- Editing locked routes (`/in/$location`, `/pro/$slug`, `/c/$slug`, homepage, `/for-professionals`, `/specialisms`).

## Files changed

- **NEW** `src/components/marketing/AnnotatedMock.tsx`
- **EDIT** `src/routes/features.visibility.tsx` — full rewrite, no longer uses `PillarPage`
- **EDIT** `src/routes/dev.section-library.tsx` — add `AnnotatedMock` example
- **EDIT** `docs/07_design_system.md` — document `AnnotatedMock`
- **EDIT** `mem://index.md` + new `mem://design/locked-visibility` — lock this page once approved

## Technical notes

- Section 7 tabs: client-side `useState`, `DeviceMockup` `src` swaps via key prop so the iframe reloads cleanly. No router changes.
- Section 2 `AnnotatedMock`: call-out coordinates passed as `{ x: '12%', y: '18%', label: '1', text: 'Verified badge' }[]` so the same primitive serves future anatomy sections.
- Hero retains the `PillarPage` animation timings (560/640ms, 0/80/180/260/340ms delays) per `mem://design/marketing-hero-template`.
- Section 1 "before" panel: small static composed cards (fake IG bio header, Linktree-style list, WhatsApp bubble) — pure JSX, design-token colors, no images.
