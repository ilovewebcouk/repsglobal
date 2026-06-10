
## Brutal honest answer

Your spec is **strategically 9/10**. It correctly repositions Coaching from "workout builder" to "client delivery layer" — that's the right position to outflank Trainerize / My PT Hub / PT Distinction without sounding like a clone.

Shipped exactly as written it lands at ~8.5/10. To make it a true 10/10 I'm baking in three additions the best coaching pages (PT Distinction 2025, Everfit, CoachAccountable) all do:

1. **One hero composition that earns the page** — a single anchored mock showing training + nutrition + check-in feeding the *same* client record, with a real name and real adherence number. Not three separate panels floating.
2. **One named end-to-end client story** ("Sarah — 12-week fat-loss client") threaded through sections 4, 5, 7, 8 so the reader sees one person being assessed → programmed → meal-planned → checked in → adjusted. That's what makes a coaching page *feel* like coaching instead of SaaS.
3. **Explicit "what REPs refuses to be"** in the safety section, plus a quiet "compared to a workout-only app" line. A 10/10 page is as confident about its boundaries as its features.

Everything else in your spec is preserved verbatim.

---

## Exercise data — Option A (confirmed)

- Use the RapidAPI AscendAPI EDB **once, offline**, to pull ~30 representative exercises (mix of compounds, accessories, machine, dumbbell, kettlebell, bodyweight, mobility) covering all major muscle groups + equipment filters.
- Save as static `src/data/exercise-library.sample.json` — name, primary muscle, equipment, level, GIF/image URL, cue notes.
- Mock-ups in sections 4 + 6 + 9 read from this JSON, so the exercise library, programme builder and client portal show *real* exercises, not lorem-ipsum.
- **No runtime API call, no key in the repo, no server function.** Live integration deferred to Phase 2.
- **Action for you:** rotate the RapidAPI key you pasted (it's now in chat logs) before any Phase-2 work starts.

## What we're building

A bespoke `/features/coaching` route, replacing today's 36-line `FeatureGroupLayout` stub. Same architecture, primitives, type scale, vertical rhythm, dividers, hero overlay, FAQ and FinalCta as the three locked pillars — so it slots cleanly into the marketing system.

After approval this page becomes **LOCKED** as `mem://design/locked-coaching` with a Core line in the index.

## Page structure (final, in build order)

```text
1.  Hero — image-backed, HeroOverlay copySide="left"
2.  The problem — fragmented delivery
3.  One connected coaching workflow — 7-step pipeline (Assess → Retain)
4.  Programme delivery + exercise library — AnnotatedMock of builder
5.  Meal planning + nutrition support — Manual / Templates / AI draft triad
6.  Client portal experience — desktop coach + phone client side-by-side
7.  Check-ins + accountability — AnnotatedMock of check-in review
8.  Progress tracking — dashboard mock
9.  Coaching notes + client context — client record timeline
10. AI coaching support — "AI drafts. Trainer reviews. Trainer approves."
11. Templates + repeatable coaching systems — 8-template grid
12. Verified vs Pro matrix — TierCard pair
13. Use cases — 6 cards (PT / online / strength / transformation / small group / studio)
14. Safety + scope — calm, professional
15. MarketingFaq → FinalCta
```

Threaded through sections 4, 5, 7, 8: **"Sarah K. — 12-week fat-loss client, 3×/week, 145g protein target."** Same adherence numbers, same meal plan, same check-in entry referenced across the page.

## Section-by-section spec

**1. Hero**
- H1: *Deliver better coaching* / *from one connected platform.* (white + orange split via the locked pattern)
- Sub: your exact subheading
- CTAs: "Start using REPs Pro" → `/for-professionals`, "Explore coaching tools" → `#workflow`
- Background: full-bleed coaching scene (coach + tablet showing REPs UI; REPS wordmark white on tee per `mem://design/trainer-imagery`). Reuses or replaces `hero-coaching-bg.jpg` depending on quality check.
- Overlay: `<HeroOverlay copySide="left" />`
- Trust chips: "Used by Pro-tier coaches" · "Training + nutrition + check-ins" · "One client record"

**2. The problem**
- Eyebrow "The reality of delivery", H2 from your spec, your exact paragraph
- Pull-line in a panel: *"Your coaching should not depend on scattered messages, screenshots and five different tools."*
- Visual: 5 greyed-out tiles (WhatsApp / Notes app / PDF / Camera Roll / Spreadsheet) → one orange-bordered REPs panel

**3. One connected coaching workflow** (`id="workflow"`)
- 7-stage horizontal pipeline, same visual language as the Operations 6-stage pipeline
- Stages: Assess → Plan → Deliver → Check in → Track → Adjust → Retain
- Each stage chips the REPs features you listed (assessment, programme builder, exercise library, meal builder, check-ins, progress, notes, AI next actions, client portal)
- This section is the page's TOC

**4. Programme delivery + exercise library**
- `AnnotatedMock` of Programme Builder using real exercises from `exercise-library.sample.json`
- Callouts: search, muscle filter, equipment filter, video/image, sets/reps/tempo/rest, coaching notes, alternatives, favourites, **custom trainer exercises**
- One-line frame: *"A deep exercise library you can extend — every coach can add their own exercises and cues."* (AscendAPI not named on the marketing page — it's an implementation detail)

**5. Meal planning + nutrition support**
- 3-column comparison: **Manual builder · Templates · AI-assisted draft**, each a mini mock
- Pull-quote: *"AI should speed up meal planning, not replace professional judgement."*
- Approval flow ribbon: Client intake → AI draft → Trainer edits → **Trainer approves** (emerald status badge) → Client sees plan

**6. Client portal experience**
- Split mock: desktop coach view + phone client view using `LaptopFrame` + `PhoneFrame`
- Phone callouts: today's workout, weekly programme, meal plan + swaps, check-in form, coach feedback, tasks, documents, next steps

**7. Check-ins + accountability**
- `AnnotatedMock` of a check-in review for Sarah (training adherence, meal adherence, mood/energy/sleep, weight, measurements, photos, habits, coach notes, next actions)
- Pull-quote: *"Check-ins turn a plan into a coaching relationship."*

**8. Progress tracking**
- Sarah's progress dashboard mock: strength trend, attendance, workout adherence, meal adherence, weight trend, measurement trend, habits, milestones, check-in history, client timeline
- Cautious line: *"When progress is visible, coaching decisions become clearer."* — no transformation claims

**9. Coaching notes + client context**
- Client record timeline mock: goals, onboarding answers, dietary prefs, allergies, training history, injuries, programme history, meal plan history, check-in history, coach notes, upcoming review
- Frame: *"Coach with context, not guesswork."*

**10. AI coaching support**
- Sub: *"AI support for the coach, not instead of the coach."*
- 8-tile grid (drafts, swaps, summaries, attention-needed clients, adherence patterns, feedback drafts, review points, structured next actions)
- Standalone rule panel: **"AI drafts. The trainer reviews. The trainer approves."**

**11. Templates + repeatable coaching systems**
- 8-template grid: programme, exercise, meal plan, check-in, onboarding, assessment, feedback, workflow
- Frame: scaling quality without making every client feel generic

**12. Verified vs Pro matrix**
- Two `TierCard`s — copy exactly per your spec. No pricing repetition beyond the canonical "Founding £59/mo".

**13. Use cases**
- 6 cards, exact copy from your spec.

**14. Safety + scope**
- Calm, professional. Three sub-blocks:
  - Statement of scope
  - **"REPs is not a replacement for"** list (medical diagnosis, treatment, registered nutrition advice for diagnosed conditions, eating disorder care)
  - Trainer-controlled safeguards (allergies, medical flags, ED history, pregnancy, diabetes, referral, trainer approval before client delivery)

**15. FAQ → FinalCta**
- `MarketingFaq` — 6 Qs: Does REPs replace Trainerize / My PT Hub? Can I bring my own exercises? How does the AI meal-plan workflow work? What can clients see vs what stays internal? Do I need Pro for nutrition? Is this medical nutrition advice?
- `FinalCta` with your exact H2 + sub + dual CTAs.

## Components — reuse vs new

**Reuse (no new shared primitives):**
- `HeroOverlay`, `SectionHeader`, `SectionHeading`, `BlockHeading`, `AnnotatedMock`, `TierCard`, `MarketingFaq`, `FinalCta`, `PhoneFrame`, `LaptopFrame`, `BrowserFrame`, `MarketingHeroEyebrow`

**New, scoped to this route file:**
- `CoachingWorkflowPipeline` — 7-stage stepper (mirrors Operations 6-stage)
- `MealPlanModesTriad` — 3-column block
- `AIApprovalStrip` — small approval ribbon used twice (sections 5 + 10)
- `ScatteredStackVisual` — section 2 problem visual
- `SarahClientRibbon` — tiny chip rendered above sections 4/5/7/8 saying *"Following Sarah K. — 12-week fat-loss client"* so the threaded story is explicit

## Technical details

- Rewrite in place: `src/routes/features.coaching.tsx` (36 → ~900 lines)
- New data file: `src/data/exercise-library.sample.json` (offline pull, committed)
- `head()` updated: new title *"Coaching delivery — One connected platform · REPs"*, new meta description matching the new positioning, og:image points at hero asset
- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; every other section `py-20 lg:py-28`; `border-b border-reps-border` on each non-hero section
- Type scale: `SectionHeading` for section H2s, `BlockHeading` for in-block H3s — no hand-rolled font-display sizes
- Emerald only on "Trainer approves" badge (sections 5 + 10) — meets the status-only rule
- All tokens from `src/styles.css`; radii per the locked system
- shadcn primitives for any chrome (Card, Badge, Tooltip, Separator)
- After build: create `mem://design/locked-coaching` + add a Core line to the index

## Validation before declaring done

1. Build passes (typecheck + Vite)
2. Live preview screenshots at 1440×900 and 390×844 for hero + sections 3, 5, 6, 8, 12, 15
3. Hero overlay legibility zoom-checked per the locked overlay rule
4. Divider hairline check at hero bottom
5. Memory + index updated

## Out of scope (explicit)

- No runtime AscendAPI call, no RapidAPI key in the repo
- No real programme/meal/AI/portal logic — visuals only
- No pricing changes — pricing lives on `/pricing`
- No edits to other pillar pages or new shared primitives
- No CIMSPA / banned-org names; no UK qualifiers; no booking-fee / 15% copy

---

If you approve, I'll build it top-to-bottom in one pass, screenshot-verify each section, then lock it in memory.
