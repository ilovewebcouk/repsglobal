
# Coaching pillar — full rebuild

The current page is a 1,000+ line scrapyard of 17 overlapping sections built around "we have exercises and AI meals." We throw it out and rebuild around one positioning:

**H1: Coach clients with structured training and nutrition plans.**

Coaching is the *delivery* pillar (programmes, exercises, sessions, check-ins, progress, habits, nutrition, adjustments). Operations is the *business* pillar. We will not blur the two.

## Positioning rules (locked for this rebuild)

- Page is about a connected coaching workspace, not a feature list.
- ExerciseDB is never named publicly — it shows up as "a structured exercise library inside your programme builder."
- Nutrition is **AI-assisted, coach-reviewed**. Never "AI writes diets." Hard ban (page-level) on: medical, clinical, dietitian, disease-specific, diabetes, eating disorder, treatment plan. We will say "coach-reviewed nutrition guidance, meal plan templates and client habit targets within your professional scope."
- AI is a *coaching assistant*, never a replacement coach.
- Pro+Studio tier feature (matches shop-front/operations pillar tier rules).

## New page structure (10 sections, in order)

1. **Hero** — H1 above. Sub: "Build programmes, assign workouts, support nutrition, track progress and keep every client moving toward their goal from one connected coaching workspace." Standard `HeroOverlay`, top-anchored copy per the marketing hero template, 3 universal trust chips, PressMarquee. Visual: the existing `ProgrammeMock` (programme builder is the strongest single shot).

2. **The problem** — disconnected tools: spreadsheets, link dumps, copy-pasted meal docs, check-ins lost in DMs. Reuse the strikethrough/clean two-column pattern already used on `/features/operations` and `/features/shop-front` (no new primitive).

3. **Programme builder** — first product section, the spine of the page. Reuse `ProgrammeMock` in an `AnnotatedMock`. Bullets: training blocks, weekly schedule, sets/reps/tempo/rest, coach notes, progression, goal-linked. Tagline: "Build the plan once, then adjust it as the client progresses."

4. **Exercise library** — `ExerciseLibraryMock` inside the programme workflow framing. Filters called out: body part, target muscle, equipment, difficulty, goal, movement pattern. Never names ExerciseDB.

5. **Client workout delivery** — what the client sees. Reuse `ClientPortalInteractiveMock`. Tagline: "Clients shouldn't have to search through messages to know what to do next." Today's session, instructions, sets/reps, coach notes, completion, feedback, history.

6. **Progress tracking & check-ins** — combines current Progress + Check-ins into one outcome-credibility block. Reuse `ProgressMock` + `CheckInsInboxMock` side-by-side. Covers weight, measurements, photos, performance, adherence, mood/energy, sleep, pain notes, weekly check-ins, coach feedback.

7. **Nutrition coaching** — `NutritionMock` (already centred + 3-beat strip from last pass). Rewrite the copy to the coach-reviewed framing. Feature list: meal plan templates, calorie/macro targets, dietary preferences, allergies/exclusions, shopping list, meal swaps, habit targets, **coach approval before sending**, client feedback, adherence tracking. Pinned line: "AI helps draft the plan. The coach stays in control." Add a small scope-of-practice line (no medical/clinical claims).

8. **AI coaching assistant** — `AiAssistMock`. Reframe as practical assistant, not hype. Concrete uses: draft a training block, suggest regressions/progressions, adapt around equipment, summarise check-ins, draft client feedback, generate meal plan drafts, suggest habit targets, flag clients needing attention. Tagline: "A coaching assistant, not a replacement coach."

9. **Connected to the full REPs platform** — narrative band tying Visibility → Shop Front → Operations → Coaching as one client journey. 4 small linked tiles back to those pillar pages. No new visual — text + tile grid.

10. **Final CTA** — shared `FinalCta` primitive. Title: "Deliver training and nutrition coaching from one connected workspace." Sub: "Build programmes, assign workouts, support nutrition and track client progress inside REPs Pro." Primary: Start using REPs Pro. Secondary: Explore all features.

## Sections being dropped

These exist today and are cut: Habits (folded into §6 progress/check-ins), Messaging, Client record, Accountability, Automations, Templates, Tier comparison matrix, Use cases, separate Check-ins, separate Progress. The page becomes a delivery-system story, not a feature inventory.

## Implementation notes (technical)

- `src/routes/features.coaching.tsx` — rewrite the route. Keep `Route` definition, `head()`, JSON-LD shape, and route-level structure compliant with the locked marketing primitives:
  - `HeroOverlay`, `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `MarketingHeroEyebrow`, `VerifySteps` (where relevant), `MarketingFaq` (FAQ section optional — confirm below), `FinalCta`.
  - Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`, sections `py-20 lg:py-28`, `border-b border-reps-border` on every post-hero section.
  - Type scale: `SectionHeading` / `BlockHeading` — no hand-rolled `text-[Npx]` H2s.
  - Tokens only (`bg-brand-orange`, `text-brand-orange`), radius from the 9-step scale, no `rounded-xl/2xl/3xl`, no button shadows. Emerald only for status semantics.
- `src/components/marketing/coaching/InteractiveMocks.tsx` — keep `ProgrammeMock`, `ExerciseLibraryMock`, `NutritionMock`, `ClientPortalInteractiveMock`, `ProgressMock`, `CheckInsInboxMock`, `AiAssistMock`. Remove or stop exporting unused ones (`HabitsMock`, `MessagingMock`, `AccountabilityMock`, `AutomationsMock`) only if nothing else in the repo imports them — verify with `rg` before deletion; otherwise leave the file alone and just don't import them.
- `head()` metadata: title ≤ 60 chars with "coaching" + REPs; meta description ≤ 160 chars; og:title / og:description matching new H1; og:image = the hero composite if available, else omit.
- Update `mem://design/locked-...` only after the user signs off visually — not in this pass.

## Open question before I touch code

I want one confirmation before I write a single line, because they materially change the page:

- **FAQ at the bottom?** Other pillar pages end on FAQ → FinalCta. Adding §11 FAQ keeps that pattern; skipping it makes Coaching the only pillar without one. Default: include FAQ (6 items, scope/safety/tier/data) just before FinalCta.

If you say "do it" without answering, I will include the FAQ and ship the 10-section plan above with FAQ inserted as §11.
