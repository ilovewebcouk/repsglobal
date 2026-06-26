# /standards — REPs Standards page

Single public route that explains what being on REPs actually means. Wired into the footer slot already reserved as "Standards (soon)" and the existing in-product links from `/c/$slug` and `/` that already point to `/standards`.

## Route & file

- New file: `src/routes/standards.tsx` → `createFileRoute('/standards')`.
- Public route (no auth, indexable). `head()` with route-specific title, description, OG/Twitter text. No `og:image` for v1.
- Drop the `soon: true` flag on the Standards entry in `src/components/public/PublicFooter.tsx` so the link goes live.
- Leave the existing `<Link to="/standards">` call sites on `/`, `/c/$slug` and home-legacy untouched — they start resolving automatically.

## Tone & visual system

Sectioned marketing pillar matching the rest of the site (same family as `/about` / `/features/visibility`):

- `HeroOverlay` shared primitive for the hero wash (per `mem://design/hero-overlay-system`).
- `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `MarketingHeroEyebrow` from `src/components/marketing/` for every section header. No hand-rolled H2/H3.
- Locked vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; sections `py-20 lg:py-28`; no hairline dividers, alternate `bg-reps-panel/15` ↔ `/30` for rhythm.
- Type scale per locked rules: hero lede 16px; section lede 15–15.5px; allowed white opacities only (/45 /55 /70 /80).
- Emerald only for status semantics (verified / approved tick rows). Brand orange for primary accents and the FinalCta. No new colour tokens.
- All cards use the locked radius scale (18px content cards, 22px large panels, 10px buttons, 12px inputs).
- Global copy rules: no country qualifiers (no "UK"), no banned org names (no CIMSPA — use "Ofqual-regulated / recognised awarding body"), no booking-fee / flat-plan claims, no third-party logo-grid.
- Shared `FinalCta` at the bottom.

## Page sections (in order)

1. **Hero** — `HeroOverlay` + eyebrow "What REPs stands for" + H1 "The standard behind every REPs professional." + 16px lede explaining the page in one paragraph + two trust chips ("Independently verified", "Reviewed regularly"). No CTAs — informational page.
2. **Last checked strip** — small panel: "Last reviewed: {date}" + link "How we verify →" anchoring to the verification section. Mirrors the `/comparison-methodology` honesty pattern.
3. **Code of conduct** — `SectionHeader` + 6 conduct pillars in a 2×3 grid of cards: Client safety first, Honest marketing, Scope of practice, Safeguarding & duty of care, Inclusive practice, Confidentiality. Each: short title + 2-sentence body. Card radius 18px.
4. **Verification standards** — 3 stacked rows (Identity / Qualifications / Insurance). Each row: emerald check icon, what we check, evidence accepted, re-check cadence. Mirrors the verification UX in `/dashboard/verification` so the public claim and the back-end check line up.
5. **Qualifications framework** — table-style block: minimum level by profession (PT = L3, Group Ex = L2, S&C = L3+, Nutritionist = registered with a recognised body, Yoga/Pilates = recognised training hours). Cite "Ofqual-regulated or recognised awarding body" wording. No vendor names.
6. **Complaints & removal** — 4-step process (Raise → Acknowledge → Investigate → Outcome) using the same step-card pattern as `VerifySteps`. Followed by a "Grounds for removal" list (misrepresentation, lapsed insurance, safeguarding breach, repeated unresolved complaints, fraud).
7. **FAQ** — `MarketingFaq` with 5 Qs (Who can join? How do I report a concern? Do you ever remove pros? How often do you re-check? Is REPs a regulator?). Answer "No, REPs is a global register and standards platform" cleanly to the regulator question.
8. **FinalCta** — shared `FinalCta`: headline "Raise a concern or ask about a pro" + primary "Contact REPs" → `/contact` + secondary "Find a professional" → `/find-a-professional`.

## Out of scope (Phase 2)

- No CPD section yet — `/cpd` already covers it and CPD copy on this page would duplicate. Add a one-line "Ongoing learning is covered on /cpd →" link inside the Code of conduct intro instead.
- No DB-backed "last reviewed" — hard-coded constant in the route file for v1, easy to bump.
- No new images. Page is type-led to match `/comparison-methodology` weight while still using marketing pillar primitives.

## Compliance checklist (pre-flight)

- Use semantic tokens only, no raw hex.
- Radii from the locked 9-step scale.
- Marketing primitives for every header / eyebrow / FAQ / final CTA.
- Emerald only on verification check rows.
- No banned phrases, no country qualifiers, no third-party brand logos.
- `head()` with unique title + description + OG/Twitter text.
