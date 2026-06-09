## Goal

Rebuild `src/routes/features.shop-front.tsx` from a 5-section, compliance-violating page into a **10-section world-class pillar page** that matches the bar of `/features/visibility`, executes your brief faithfully, and locks as `mem://design/locked-shop-front`.

## Positioning (locked for this page)

- **One-line message:** *Your fitness business website, built into REPs.*
- **Distinction from Visibility:** Visibility gets you found and trusted. Shop-front helps clients understand the offer, decide and take action.
- **Tier scope:** Pro and Studio only. Verified is mentioned only in the Verified-vs-Pro matrix to make the upsell. No Verified-lite Shop Front.
- **Avoid:** "build any website", "drag-and-drop", "replace Webflow/Wix/Squarespace", "rank higher on Google", "guaranteed leads", "15%", "booking fee", "flat plan", any UK qualifier, CIMSPA.

## Section structure (10 + chrome)

Mirrors `/features/visibility` rhythm exactly. Each `<section>` uses `border-b border-reps-border` + `py-20 lg:py-28`.

1. **Hero**
   - MarketingHeroEyebrow: "Shop-front · Your client-facing page"
   - H1: *Your fitness business website,* <accent>built into REPs.</accent>
   - Lede (16px): "Create a professional Shop Front that shows your services, credentials, reviews, packages and booking options in one client-ready page — connected to your enquiries, bookings and clients."
   - Primary CTA → `/signup` "Create your Shop Front" · Secondary `#anatomy` "See how it works"
   - 3 trust chips: "Pro & Studio", "10-minute setup", "Connected to your REPs workflow"

2. **Problem — "The scattered setup"**
   - SectionHeader: "Most fitness pros don't have a website. They have a tangle."
   - Two-column 50/50: "Today, without a Shop Front" (X chip, list: Instagram bio · Linktree · old Wix · Google Form · Calendly · Stripe link · WhatsApp · Google reviews elsewhere) vs "With a REPs Shop Front" (Check chip, list: one URL · clear offer · proof on the page · enquire/book/pay · everything lands in your REPs inbox).

3. **Anatomy — `id="anatomy"`**
   - `AnnotatedMock` of live `/c/james-wilson` (laptop frame) with 6 callouts: outcome hero, three-tier services, methodology, transformations, verified reviews, contact panel.
   - Lede: "This is an actual Pro Shop Front running on REPs — not a template preview."

4. **Sell services clearly**
   - SectionHeader: "Stop sending clients to a vague bio. Send them to a page that explains the offer."
   - 9 service-type cards in a 3-col grid: 1:1 coaching · Online coaching · Small-group training · Assessments & screening · Transformation programmes · Sports performance · Specialist services · Studio classes · Gym memberships. Each card: title + one-sentence "what your Shop Front shows for this service".

5. **Enquiry → booking → payment → CRM**
   - SectionHeader: "When someone clicks Enquire, they don't disappear into your inbox."
   - Visual: horizontal 4-step flow (Click on Shop Front → Lands in REPs leads pipeline → Booking confirmed / payment captured → Onboarded as a client). Use shadcn `Card` per step + connector arrows.
   - Right rail: 5 capability bullets (enquiry forms, booking links, consultation requests, payments, automated follow-up). Strong line at the bottom.

6. **Proof built into the page**
   - SectionHeader: "Your website shouldn't just look good. It should prove why clients can trust you."
   - 6-card grid: Verified badge (emerald accent — per status-colors rule), Credentials, CPD, Specialisms, Reviews, Insurance status. Each card pulls a real REPs concept.

7. **Purpose-built, not a blank page**
   - SectionHeader: "Designed for fitness pros — not generic websites."
   - Two-column: left = `BlockHeading` "A page built around the client journey" + 5-step horizontal mini-flow (Discover → Trust → Understand offer → Enquire → Book / pay / onboard). Right = bullet contrast: "Generic builders give you templates · REPs gives you the journey already designed".

8. **Verified vs Pro**
   - Two `TierCard`s (re-use the visibility-page pattern) + 8-row comparison matrix scoped to Shop-front capabilities (public page at /c/, services, reviews, qualifications display, enquiry form, booking, payments, CRM pipeline). Verified column mostly em-dashes; Pro all ticks. Pro card is `highlighted`.

9. **Use cases**
   - SectionHeader: "What your Shop Front looks like for…"
   - 8 cards (shadcn `Card`): PT · Online coach · Strength coach · Pilates instructor · Yoga teacher · Small studio · Sports coach · Specialist coach. Each card: 1-line offer description + 2 example service rows. Cards link to /c/james-wilson when relevant (placeholder for now).

10. **FAQ**
    - `MarketingFaq`, 6 Qs: Do I need design skills? · Can I use my own brand colour? · Is this a separate website or part of my profile? · What happens when someone enquires? · Do I need Pro to publish a Shop Front? · Can I share one URL on Instagram? Answers in plain voice, no "guaranteed".

11. **FinalCta** (shared component)
    - heading: "Build a Shop Front clients can" · accent: "understand, trust and act on."
    - lede: "Create a professional website page connected to your REPs profile, services, bookings and client workflow."
    - primary `/signup` "Create your Shop Front" · secondary `/pricing` "Explore REPs Pro"

## Components reused (no new primitives)

- `MarketingHeroEyebrow`, `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `BlockHeading`
- `AnnotatedMock` + `DeviceMockup` (laptop iframe of `/c/james-wilson`)
- `MarketingFaq`, `FinalCta`
- `TierCard` — extract the existing one from `features.visibility.tsx` into `src/components/marketing/TierCard.tsx` so both pages share it (small refactor; visibility import path updates).
- shadcn: `Card`, `Badge`, `Separator` where appropriate.

## Compliance (REPs build compliance)

- Rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; every section `py-20 lg:py-28`. No `lg:py-24`.
- Dividers: hero no border; every other section `border-b border-reps-border`.
- Radii: cards 18px, panels 22px, buttons 10px, pills full. No 14/20/28/32px or rounded-xl/2xl/3xl.
- Tokens: only `bg-reps-orange*`, `text-reps-orange*`, semantic emerald-for-status. No hex.
- Type: all section headings via `SectionHeading`/`SectionHeader`/`BlockHeading`. No hand-rolled `<h2 className="font-display text-[30px]...">`.
- White opacities: only /45 /55 /70 /80.
- Buttons: `shadow-none`.

## File changes

| File | Change |
| --- | --- |
| `src/routes/features.shop-front.tsx` | Full rewrite (drop `FeatureGroupLayout`, render PublicHeader + 10 sections + PublicFooter standalone like visibility). |
| `src/components/marketing/TierCard.tsx` | New — extract from visibility. |
| `src/routes/features.visibility.tsx` | Import TierCard from new shared module; remove inline copy. |

## Verification

1. `bash /tmp/audit.sh` exits 0 (allow the documented 14px enquire exception).
2. Visual flip-through 390 / 820 / 1280: hero rhythm, dividers, anatomy callouts, matrix, FAQ chevrons all line up with `/features/visibility`.
3. The AnnotatedMock iframe loads `/c/james-wilson` correctly (laptop frame, scale 0.5).
4. Open graph metadata: title "Shop-front — Your fitness business website, built into REPs · REPs", description rewritten to match new positioning, `og:image` = a real screenshot or `coachJamesCoaching` asset.

## Memory updates

- **New file `mem://design/locked-shop-front`** — locks 11-block structure, positioning sentence, banned phrases, Pro+Studio-only tier scope, TierCard shared-component note. Dated 2026-06-09.
- **`mem://index.md` → Memories list** — add bullet linking to the new locked file.
- **Core: nothing new** — page consumes existing rules.

## Out of scope

- No new functionality, no auth, no real enquiry submission.
- No new screenshots / generated trainer imagery in this turn — page reuses `coachJamesCoaching` and live `/c/james-wilson` iframe.
- `/features/operations`, `/features/coaching`, `/features/growth` rebuilds — flagged as future work in the same pillar-quality bar.
- No changes to `/c/james-wilson` itself (locked).
