## Goal

Take `/education` from a strong 7/10 to a credible standard-setter. Cut redundant "the system" framing, fix the hero voice, demote the glossary, surface the proof that's currently buried.

## Final section order (7, down from 12)

```
1. Hero                       (rewritten)
2. ProfileScreenshot          (kept — moved to position 6)
3. Qualifications             (now position 2 — the ladder leads)
4. HowTheStandardWorks        (NEW — merges WhatEducationIs + RepsCpdSystem + RaiseTheStandard)
5. VerifiedProviders          (kept — with RegistersBlock folded in as expandable)
6. ProfileScreenshot          (proof shot, after the explanation)
7. DodgyCourses               (kept — absorbs the "print shop" pull-quote from old hero)
8. FaqBlock + JoinRepsCta     (kept — single closing CTA)
```

Removed entirely: `WhatEducationIs`, `RepsCpdSystem` (merged), `RaiseTheStandard` (merged), `ProviderCtaBand` (redundant with JoinRepsCta), `RegistersBlock` (collapsed into VerifiedProviders disclosure), `VerifyStrip` (third trust band — already covered by hero chips + provider checks).

Net: 12 sections → 7. Three CTAs → one closing CTA (plus hero CTAs).

## Hero rewrite

Drop the "print shop for certificates" H1. It reads as a takedown blog, not a regulator. Move that line into `DodgyCourses` as a pull-quote where it belongs.

New H1 (standard-setter voice):
> **Regulated qualifications. Verified providers. CPD that's logged and audited.**
> *The standard behind every REPs professional.*

Promote the credibility strip ("Ofqual · REPs · AfN · HCPC · YAP — cross-checked at source") from 11px under-everything to a real sub-hero band directly under the H1, same weight as the CTA row.

Keep: eyebrow "Education & standards", subhead, the two CTAs, the three trust chips. Trim subhead to one sentence.

## New: `HowTheStandardWorks` (merges 3 sections)

Single block, three columns, one mechanic per column — no more re-stating the system:

| Column | Headline | Body |
|---|---|---|
| Qualified | Regulated qualifications only | RQF / Ofqual baseline. Awarding body named on every profile. |
| Verified | Providers checked end-to-end | Accreditation, tutor credentials, assessment integrity, refund + complaints. |
| Current | CPD logged and audited | Quarterly log, verified-provider hours only, random annual audit, badge auto-suspends if missed. |

Closes with the existing orange "Miss a quarter, the badge auto-suspends" callout. Kills the "Four mechanics. No theatre." headline (drops "no theatre" — that's the snipey voice).

## Qualifications block — give nutrition + movement equal weight

Currently fitness ladder is rendered in full, nutrition is a compact 3-row table, movement is a 5-item chip list. Rebalance so all three ladders use the same card treatment (Level / Title / Scope / Recognised quals), inside a `Tabs` switcher: **Fitness · Nutrition · Yoga & Pilates**. Same visual weight regardless of which is selected.

## VerifiedProviders — fold the glossary in

`RegistersBlock` (8 awarding bodies) becomes an expandable disclosure inside `VerifiedProviders`:
> "Bodies we cross-check against (Ofqual, AfN, HCPC, YAP, Active IQ, YMCA Awards, Focus Awards, REPs) — expand for full list."

Saves a whole scroll-stop. Keeps the credibility evidence one click away.

## DodgyCourses — absorb the pull-quote

Add the old hero line as a styled pull-quote inside this section:
> *"The honest providers are already here. The rest are running a print shop for certificates."*

Lands once, in the right context, instead of being the page's opening salvo.

## Proof additions (one per major section)

- **Hero band:** keep "cross-checked at source" — promoted to sub-hero.
- **HowTheStandardWorks:** add small inline stat — "Every CPD entry includes provider, awarding body and issue date — visible on the public profile."
- **VerifiedProviders:** named awarding bodies appear inline in the checks copy (e.g. "Ofqual-regulated or endorsed by REPs / AfN / YAP").
- **DodgyCourses:** keep the red-flag list; add a one-line "What to ask a provider before you pay" mini-checklist (3 bullets) so the section gives the reader an action, not just a warning.

## FAQ trim

Currently 11 FAQs. Cut to 8 — drop:
- "How many CPD hours do I need per year on REPs?" (vague answer, hurts credibility)
- "Why are some big-name training providers not on REPs?" (defensive)
- "How do I report a predatory provider or coach?" (move to a small footer line in DodgyCourses)

Keep the 3 strongest education questions at the top (PT qualifications, regulated definition, how to vet a provider), then CPD, then nutrition.

## Files touched

- `src/routes/education.tsx` — section reorder, hero rewrite, merge 3 components into `HowTheStandardWorks`, promote sub-hero credibility band, tabs in `Qualifications`, expandable disclosure in `VerifiedProviders`, pull-quote + checklist in `DodgyCourses`, FAQ trim, delete `RaiseTheStandard` / `ProviderCtaBand` / `VerifyStrip` / `RegistersBlock` (as standalone) / `WhatEducationIs` / `RepsCpdSystem` (merged).

No new images, no design-token changes, no route changes, no backend, no FAQ JSON-LD structure change (still drives off `FAQS` array).

## Out of scope

- Homepage, profile, city, enquire, shop-front, `/for-professionals`, `/specialisms` — untouched.
- No new hero image (current `cpd-tutor-moment.jpg` stays).
- Nutrition / movement copy is rebalanced into the same card shape — not rewritten from scratch.
- No real audit numbers invented; proof points only use facts already on the page.