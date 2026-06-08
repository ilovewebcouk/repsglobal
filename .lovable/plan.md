# Rebuild `/education`

The current page is 13 sections and ~1,460 lines. Four sections do work other sections already do, the tone has drifted into manifesto territory, and "CPD" still dominates. This rewrites the page to a single job: **help a buyer or learner understand qualifications, then send them to find a verified training provider.**

## Final section order (7 blocks, was 13)

```text
1. Hero                  — Education & standards. Single primary CTA: Browse providers.
2. WhatEducationIs       — "What counts / what doesn't" two-column. Sets the frame.
3. Qualifications        — Fitness / Nutrition / Movement ladders (unchanged content,
                           tooltips stay — this absorbs the RegistersBlock job).
4. CpdInOneSection       — NEW: tight single block. "Quals get you in. CPD keeps you
                           current." 3 mechanics, no audit theatre, no orange callout strip.
5. VerifiedProviders     — Merged with DodgyCourses. Left col: 4 provider checks.
                           Right col: red flags vs. good signs (compact).
6. ProviderDirectoryCTA  — The page's real destination. "Coming soon" directory + 
                           secondary "Report a provider".
7. FaqBlock              — Trimmed from 11 → 6 questions. Quals-led, not CPD-led.
8. JoinRepsCta           — Existing pro-conversion band. Unchanged.
```

## What gets cut and why

| Cut | Reason |
|---|---|
| `ProfileScreenshot` | Pulls focus to the pro profile, not to finding a provider. The verification story is already carried by `VerifiedProviders` + `Qualifications`. |
| `RepsCpdSystem` (current 4-card block + orange suspension strip) | Replaced by a tighter `CpdInOneSection` mid-page. Drops "audited annually", "miss a quarter" — operational noise. |
| `DodgyCourses` (standalone) | Folded into `VerifiedProviders` as a right-column "red flags / good signs" panel. Same content, half the real estate. |
| `RaiseTheStandard` | Homepage manifesto. Off-tone for an educational page. Delete. |
| `RegistersBlock` (8 acronym cards) | Duplicates the qualification tooltips and the hero trust strip. Delete; promote AfN/HCPC/YAP into the nutrition + movement subsections where they're actually relevant. |
| `VerifyStrip` (3-step verify) | Belongs on `/for-professionals` / `/verify`, not here. Delete. |

## Hero rewrite

- Eyebrow stays `Education & standards`.
- H1: replace the "print shop for certificates" line — it's a snipe, not an explainer. New H1: **"Know what the letters mean. Then pick a provider that earns them."**
- Subhead: one line, no "global standard" rhetoric. *"Regulated qualifications, REPs-verified training providers, and CPD that's logged — explained in plain English so you spend on the right course, or hire the right professional."*
- Primary CTA: **Browse verified providers** → `#verified-providers`.
- Secondary CTA: **Decode the qualifications** → `#qualifications` (was "How the standard works").
- Trust strip below: unchanged (Ofqual · REPs · AfN · HCPC · YAP — cross-checked at source).

## New `CpdInOneSection` (replaces `RepsCpdSystem`)

- Eyebrow: `Staying current`.
- H2: **"Qualifications get you in the door. CPD keeps them current."**
- One short paragraph (2 sentences).
- 3 mechanics (was 4): **Logged quarterly · Verified-provider hours auto-count · Stack toward Level 4 specialisms**.
- No orange "miss a quarter, badge suspends" callout — that's operational, lives in the dashboard.

## `VerifiedProviders` merge

- Keep left column copy ("If the provider isn't on REPs, ask them why").
- Right column becomes a tabbed/stacked card: **Red flags** above, **What good looks like** below — using existing `RED_FLAGS` and `GOOD_SIGNS` arrays (trim to top 5 each).
- The 4 `PROVIDER_CHECKS` cards move below as a 4-up row (current layout has them right of the copy and they get cramped).

## FAQ trim (11 → 6)

Keep, in order:
1. What qualifications do I actually need to work as a personal trainer?
2. What's a regulated qualification, and why does it matter?
3. How do I know a training provider is legitimate before I pay them?
4. What's the difference between a Nutritionist and a Dietitian?
5. What is CPD? *(one CPD question, not five)*
6. Why are some big-name providers not on REPs?

Cut: "How many CPD hours…", "Does the L3 PT need a REPs provider", "Can CPD upgrade me…", "How do I report a predatory provider" (the report CTA lives in the provider band), "Miss a quarter" (operational).

## Tone pass

- Drop snipes: "running a print shop for certificates", "47 multiple-choice questions you can re-take until you pass", "help-desk that goes silent". Replace with neutral, declarative copy that matches `/for-professionals` and `/specialisms`.
- "REPs is the global standard for…" → "REPs is the global register that verifies…". Stop self-mythologising.
- Remove every instance of "Full stop." and "No theatre."

## Out of scope

- No route changes — page stays at `/education` (the `/cpd` redirect added last turn stays).
- No new images, no new design tokens, no radius changes.
- No homepage / `/for-professionals` / `/specialisms` / nav changes.
- No new components — all work is in `src/routes/education.tsx` and the cuts to its in-file section components.
- JSON-LD `FAQPage` schema stays; the array just shrinks to the 6 kept questions.

## Files touched

- `src/routes/education.tsx` — section order, 4 section deletions, `RepsCpdSystem` → `CpdInOneSection` rewrite, `VerifiedProviders` + `DodgyCourses` merge, FAQ trim, hero copy, JSON-LD reflects trimmed FAQ array.

Expected size after: ~750–800 lines (down from 1,464).
