## Goal

Lift `/cpd` from a CPD-only page into the REPs **Education** hub it should be: REPs accredits *courses* — most of which are CPD, but the framing also covers initial qualifications and the Pilates/Yoga teacher-training market that's core to REPs' reach. Tone moves from punchy/marketing to professional.

No URL change. No new sections. Edits live in `src/routes/cpd.tsx` only.

---

## 1. Hero — new image, new H1, single CTA

**Image swap.** The current hero (`cpd-hero-v5.jpg`) is replaced by the editorial workshop photo currently used in `TutorMoment` (`cpd-tutor-moment.jpg.asset.json`). This is the image the user pointed at — a real teaching environment reads as "education", not "fitness marketing".

**Copy rewrite (professional register).**

- Eyebrow chip: `CPD & Education` → `Education & accredited courses`
- H1: `A certificate is only as good as the people behind it.` → `The standard for accredited education in fitness, sport and movement.`
- Sub: rewritten to name the three pillars REPs accredits — initial qualifications, ongoing CPD, and teacher training in Pilates and yoga. Drops the "isn't worth the paper it's printed on" line.
- Trust chips: kept (Identity verified · CPD logged quarterly · Verified-provider hours count) but the third softened to `Accredited providers only`.
- Body registers strip: kept (Ofqual · REPs · AfN · HCPC · YAP) — already covers Pilates/Yoga via YAP.

**CTA simplification.** Two buttons collapse to one primary: **`Find verified training providers →`** anchored to `#verified-providers`. The secondary "How REPs runs CPD" button is removed (it competes with the primary action and reinforces the CPD-only framing).

---

## 2. Remove the now-orphan TutorMoment band

`TutorMoment` (the dark band with the pull-quote "The honest providers are already here…") used the image we're promoting to hero. With the image gone, the band is removed from the page stack in `CpdPage()`. The associated `cpdTutorMomentAsset` import becomes the new hero image source, so no asset is orphaned.

(The old `cpd-hero-v5.jpg` asset stays in the codebase for now — not deleting in case other pages reference it; can prune in a follow-up.)

---

## 3. Tone pass — "education", not just "CPD"

Targeted copy edits, no structural changes:

| Section | Change |
|---|---|
| `WhatCpdIs` heading | "What CPD actually is" → "What 'accredited' actually means" (CPD covered as one mode of accredited learning). |
| `RepsCpdSystem` heading | "How REPs runs CPD" → "How REPs accredits education". Subcopy reframed: courses, CPD, teacher training. |
| `Qualifications` intro | Tightened, drops "industry runs on acronyms" colloquialism; opens with "REPs accredits qualifications across four pathways" (Fitness, Nutrition, Pilates, Yoga). |
| `VerifiedProviders` | Heading kept; subcopy reframed so Pilates/Yoga teacher-training schools are explicitly named alongside L2/L3 awarding bodies. |
| `DodgyCourses` | Kept (this is the page's teeth) but two flippant lines softened: "earn £5k a month" example trimmed, "print shop for certificates" pull-quote removed (it left with TutorMoment anyway). |
| `ProviderCtaBand` | CTA label aligned to "Find verified training providers". |
| `FaqBlock` | First Q broadened: "What is CPD?" stays, but a new lead Q is added: "What does it mean for a course to be accredited by REPs?" — pulls Pilates/Yoga into the answer. |
| `JoinRepsCta` | Final CTA aligned to "Find verified training providers" (primary) with "Apply to be a verified provider" as the professional-side secondary. |

Anywhere the page currently says "the CPD page" or "this is about CPD" implicitly, the language shifts to "accredited education" / "courses and CPD" / "training providers".

No data arrays change (Fitness / Nutrition / Pilates / Yoga ladders, providers, FAQs all stay). No new components. No new assets. No route or nav-label changes.

---

## Out of scope (flagged for later)

- Renaming the route from `/cpd` → `/education` and updating header nav. Mentioning so you can decide separately; not doing it here unless you say so.
- Pruning the unused `cpd-hero-v5.jpg` asset.
- Long-form copy revisions inside `RED_FLAGS` / `GOOD_SIGNS` beyond the two flippant lines noted above.
