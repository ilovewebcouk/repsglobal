# Broaden /cpd → /education and rebalance the page

## The honest problem

The page is about **fitness/nutrition/movement education** — qualifications, providers, CPD, and how to spot a worthless course. CPD is *one quarter* of the content but owns the URL, the H1 area copy, the eyebrow, the section order, the FAQ, and the meta tags. That's why it reads narrow. Two fixes do 80% of the work: change the URL, and reorder so qualifications come first.

## 1. URL move: `/cpd` → `/education`

- New leaf route: `src/routes/education.tsx` (file-based routing). Content is the existing `CpdPage` body, renamed `EducationPage`, with the rebalances below applied.
- Keep `src/routes/cpd.tsx` as a thin redirect leaf so old links don't 404 and search picks up the move:
  - `beforeLoad: () => { throw redirect({ to: "/education", code: 301 }) }`
  - Strip its `head()` of canonical/og — the redirect happens before anything renders.
- `head()` on `/education`:
  - Title: `"Fitness education that actually counts — qualifications, providers, CPD | REPs"`
  - Description: `"Regulated qualifications, REPs-verified training providers, ongoing CPD — and how to spot a worthless course before you spend a penny."`
  - Canonical: `https://staging.repsuk.org/education` (this project's published domain per the head-meta rules)
  - og:url + og:title + og:description mirror the above
  - Keep the `FAQPage` JSON-LD block; questions broaden per §4.
- Update every link that points at `/cpd`:
  - `src/components/public/nav-config.ts` → `{ to: "/education", label: "Education" }`
  - `src/components/public/PublicHeader.tsx` active-state check (`pathname.startsWith("/cpd")` → `"/education"`)
  - `src/components/public/PublicFooter.tsx` → `{ label: "Education", to: "/education" }`
  - `src/routes/specialisms.tsx:996` → `{ label: "Qualifications & education", to: "/education" }`
  - `src/routes/sitemap[.]xml.ts` → swap `/cpd` entry for `/education`

Out of scope for this pass: `src/routes/admin_.cpd.tsx`, `src/routes/dashboard_.cpd.tsx`, `src/components/dashboard/{ProShell,AdminShell}.tsx`, `src/components/marketing/VenueMarquee.tsx`. Those reference *dashboard* CPD logging (the product feature) — different URL space, leave alone.

## 2. Hero rebalance (copy only, layout untouched)

The TutorMoment image stays as the LCP hero. Copy changes:

- **Eyebrow chip:** `"CPD & Education"` → `"Education & standards"`
- **H1:** keep `"The honest providers are already here. The rest are running a print shop for certificates."` — it's already provider/education-shaped, not CPD-specific.
- **Subhead:**
  > "REPs is the global standard for verified education in fitness, nutrition and movement — regulated qualifications, vetted training providers, and CPD that's logged and audited."
- **Primary CTA:** `"Browse verified providers"` (unchanged target `#verified-providers`)
- **Secondary CTA:** `"How REPs runs CPD"` → `"How the standard works"` pointing at `#how-the-standard-works` (rename `RepsCpdSystem`'s anchor to match)
- **Trust chips:** keep the three; reword middle chip from "CPD logged quarterly, audited annually" to "Quals, insurance & CPD all evidenced" so they cover the full standard, not just CPD.

## 3. Section reorder + rename (hierarchy honesty)

Approved order: **Quals → Providers → CPD → Spotting bad courses.**

New `CpdPage` (becomes `EducationPage`) render order:

```
Hero
ProfileScreenshot                       (subhead re-pointed off CPD-only — see §3a)
WhatEducationIs                          (renamed/widened from WhatCpdIs)
Qualifications                          (moved up — the foundation)
VerifiedProviders                       (where you go to get qualified)
RepsCpdSystem                           (how the qualification stays current)
DodgyCourses                            (consumer-protection layer)
RaiseTheStandard
ProviderCtaBand
RegistersBlock
VerifyStrip
FaqBlock
JoinRepsCta
```

### 3a. `ProfileScreenshot` (the credentials screenshot)
- Eyebrow: `"On the profile"` (keep)
- H2: `"This is what verified credentials look like to your clients."` (was "verified CPD")
- Body: drop CPD-only framing; describe quals + insurance + CPD all visible.
- Bullets:
  - `"Qualifications, insurance & CPD — all evidenced"`
  - `"Verified-provider hours auto-count toward CPD"`
  - `"Specialisms appear once the awarding body confirms"`

### 3b. `WhatCpdIs` → `WhatEducationIs`
- Eyebrow: `"What real education looks like"`
- H2: `"Qualified. Verified. Kept current."`
- Lede explains the three-layer model: (1) regulated qualifications, (2) verified provider, (3) ongoing CPD.
- Replace the two-column "What counts as CPD / What doesn't" with two columns that cover education broadly:
  - **What counts:** Regulated qualifications (Ofqual/RQF); REPs-endorsed CPD; accredited conferences & workshops; peer-reviewed reading with notes; supervised mentoring.
  - **What doesn't:** Unregulated "diplomas" with no awarding body; vendor product demos dressed as education; sales webinars from supplement/app companies; free "mini-CPDs" bundled with a sales course; anything self-marked with no external check.

### 3c. `RepsCpdSystem`
- Anchor id: `how-reps-runs-it` → `how-the-standard-works`
- Eyebrow stays "How REPs runs CPD" (still accurate for this section).
- Lede tweak: open with "Qualifications get you in the door. CPD keeps them current. Here's the system every REPs professional signs up to." — anchors CPD as one mechanic of the standard.
- Four pillars unchanged.

## 4. FAQ broadening

Current FAQ is 9-of-10 CPD. Add three education questions at the top and keep the strong CPD ones; trim two of the weakest CPD entries to keep total length sensible.

New order (target 10 entries):
1. **NEW:** "What qualifications do I actually need to work as a personal trainer?" — L2 Gym Instructor / L3 PT baseline, Ofqual/RQF, why REPs cross-checks them.
2. **NEW:** "What's a regulated qualification, and why does it matter?" — Ofqual/RQF explained in plain English.
3. **NEW:** "How do I know a training provider is legitimate before I pay them?" — links to provider checks + `#worthless-courses`.
4. "What is CPD?" (keep)
5. "How many CPD hours do I need per year on REPs?" (keep)
6. "Does the L3 PT course I'm considering need to be from a REPs-verified provider?" (keep)
7. "Why are some big-name training providers not on REPs?" (keep)
8. "What's the difference between a Nutritionist and a Dietitian?" (keep)
9. "Can CPD upgrade me to a new specialism?" (keep)
10. "How do I report a predatory provider or coach?" (keep)

Drop: "What happens if I miss a CPD quarter?" and "Does being verified on REPs let me charge more?" (the latter is covered by `RaiseTheStandard` on-page; the former is dashboard-detail).

`FAQS_FOR_JSONLD()` automatically reflects the new array.

## 5. Out of scope (explicitly)

- No changes to homepage `/`, profile, city, enquire, shop-front, /for-professionals, /specialisms layouts beyond the single link relabel in §1.
- No design token, radius, or component-library changes.
- No new images.
- Dashboard/admin CPD tooling routes untouched.

## Technical notes

- The route file rename means `routeTree.gen.ts` will auto-regenerate; don't edit it.
- `createFileRoute("/education")(...)` for the new leaf; `createFileRoute("/cpd")(...)` stays in `cpd.tsx` but its component becomes a no-op (`redirect` thrown in `beforeLoad`).
- Keep the existing image assets (`cpd-tutor-moment`, `cpd-profile-screenshot`) — they're still correct; renaming the files is unnecessary churn.
- All section anchor links updated in one file (`education.tsx`), so the secondary CTA's `#how-the-standard-works` hash and the `RepsCpdSystem` section id stay in sync.

## Section anchor / link reference

| Anchor | Section |
| --- | --- |
| `#what-education-is` | WhatEducationIs |
| `#qualifications` | Qualifications |
| `#verified-providers` | VerifiedProviders |
| `#how-the-standard-works` | RepsCpdSystem |
| `#worthless-courses` | DodgyCourses |
| `#raise-the-standard` | RaiseTheStandard |
