# /cpd-v2 — trim duplicates, elevate the verification beat

## What changes

**1. Cut `RegisterProofBand`** (the "Your public profile" section).
- `BeforeAfterTeardown` already makes the public-profile point with stronger proof. Two sections in a row saying "this shows up on your profile" reads as repetition.
- Remove the section function and the `<RegisterProofBand />` line from `CpdV2Page`. Leave `RegisterProof` itself (the component) untouched — it's used elsewhere.

**2. Cut `AiRecommendations`** (the "AI · Preview · Phase 1" section).
- You already have three course-discovery beats (`LearningPathways`, `CpdDiscovery`, `SpecialistAreas`) plus `TrainingProvidersBand`. A fourth is overkill, and "Preview · Phase 1" labelling weakens the page's authority.
- Remove the section function, the `<AiRecommendations />` line, and its supporting constants (`FOCUS_OPTIONS`, `STAGE_OPTIONS`, `RECS_BY_FOCUS`, `RecCard`, `Recommendation` type) so nothing dangles.

**3. Rebuild `VerifyStrip` as the page's signature beat — "The CPD verification chain"**

Right now `VerifyStrip` is a generic four-step trust strip that could live on any page. To make this page the best, it should be the only page on the site that owns the CPD verification mechanism end-to-end — and it should sit immediately before `BeforeAfterTeardown` so it reads as **the engine** that produces the after-state.

New section (replaces `VerifyStrip` on this page only — the shared marketing primitive stays untouched for other pages):

- **Eyebrow**: "The CPD verification chain"
- **Heading**: "Every point you earn is signed off by the body that issued it."
- **Lede**: One sentence: most platforms accept a self-typed CPD number. REPs verifies each point at source before it touches your public profile.
- **The chain** — four nodes connected by a thin orange thread, animated subtly into view:
  1. **Course completed** — provider issues a digital credential (icon + provider name slot)
  2. **Awarding body confirms** — points are signed by the recognised awarding body (Ofqual-regulated language, per memory)
  3. **REPs logs the CPD** — entry lands in your CPD log with provenance metadata (date, provider, points, evidence link)
  4. **Public profile updates** — the verified count on your profile changes the same day
- **Right rail** (desktop) / **below chain** (mobile): a small "What this prevents" card — three crisp lines: "Inflated CPD claims · Lapsed credentials shown as current · Unverifiable certificates from unrecognised bodies." Emerald-only-for-status tokens used for the "verified" pip on each node, per status-colors memory.
- **Footer line**: "Same standard applies to qualifications, insurance and identity — see the Trust page." (Link to existing trust page if one exists; otherwise plain text.)

This turns the strip from a trust footer into the *mechanism reveal* — and `BeforeAfterTeardown` directly after now reads as "…and this is what that mechanism produces over 12 months."

## New section order

```text
Hero
ProofCards
DevelopmentPassport
CPD verification chain    ← rebuilt VerifyStrip, page-specific
BeforeAfterTeardown
LearningPathways
CpdDiscovery
SpecialistAreas
TrainingProvidersBand
FaqBlock
FinalCta
```

(`RegisterProofBand` and `AiRecommendations` removed.)

## Technical notes

- File touched: `src/routes/cpd-v2.tsx` only.
- The page currently uses the shared `VerifySteps` primitive via `VerifyStrip`. The replacement is a page-local component (`CpdVerificationChain`) defined in `cpd-v2.tsx` — does not modify the shared `VerifySteps` primitive used by other marketing pages.
- All copy follows existing rules: no CIMSPA name, no UK qualifier, "Ofqual-regulated / recognised awarding body" only, emerald used only for the verified status pips, orange for the connecting thread.
- Radius: nodes use `rounded-[16px]` (std card), the surrounding panel uses `rounded-[22px]` (large panel), per the radius system.
- Removed dead imports (`Brain`, ToggleGroup if no longer used, etc.) get pruned so the file stays clean.
- No route changes, no data changes, no schema changes.

## Out of scope

- The shared `VerifySteps` primitive used on other marketing pages — untouched.
- The standalone `/verify/$id` page and `VerificationCard` — untouched.
- Any change to other pages.
