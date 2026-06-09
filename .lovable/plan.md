## Goal

Take `/features/coaching` from a credible 8/10 to a genuine 10/10 pillar page that visibly out-features Trainerize, PT Distinction and TrueCoach on coaching delivery — while keeping the page honest, no buzzwords, and locked to the existing marketing primitives and design tokens.

The page positions coaching delivery as the *core* of REPs Pro: every feature a world-class coach would want to deliver, support, programme, feed, message, track and retain a client — in one workspace that's already wired into their REPs profile, Shop Front and operations.

## Scope decisions (confirmed)

- **Nutrition: full MyFitnessPal-replacement story** — macros, food log + database, barcode flow, meal plans, photo meals, hydration, weekly compliance. Own dedicated section + interactive mock. *Overrides the previous "no nutrition" rule in the locked-coaching memory; that memory will be revised.*
- **New capability sections added:** Exercise library + video demos, Habits + wearables (Apple Health / Garmin / Whoop), Messaging + voice notes, Automations / drip content.
- **Interactivity:** all major mocks become click-through (state toggles inside the mock frame).
- **AI framing:** one honest "AI drafts, you coach" section — programme draft + check-in summary. No buzzwords. Links to `/features/ai`.
- **Progress photos:** reintroduced *inside* the Progress section as a tab variant, with a consent/privacy note baked into the mock.

Out of scope this pass: real data, real auth, real integrations, mobile native app promises, group challenges, calendar/scheduling (lives on `/features/operations`).

## Page structure (final, 14 sections)

```text
Hero (locked HeroOverlay copySide="left" — unchanged)
01. Problem               — scattered stack vs one workspace (existing, light copy refresh)
02. Programme delivery    — INTERACTIVE: Week 1 / Week 4 / Week 8 inside ProgrammeMock
03. Exercise library      — NEW. INTERACTIVE: All / Lower / Upper / Conditioning filters; "+ add to programme" affordance; video-demo thumb
04. Nutrition             — NEW. INTERACTIVE tabs: Today's log / Week view / Meal plan / Photo meal review. Includes barcode + database affordance. Headline: "Replace the food-tracking app with something built for coaching."
05. Habits & wearables    — NEW. INTERACTIVE: Sleep / Steps / Water / Workouts tabs. Apple Health, Garmin, Whoop sync row (logos as text wordmarks, no third-party brand placement issues — use neutral labels w/ a small "Connected" emerald chip).
06. Check-ins             — INTERACTIVE: Pending / Replied / Flagged inbox states
07. Progress tracking     — INTERACTIVE: Strength / Body comp / Adherence / Photos tabs (Photos tab carries a consent/privacy line)
08. Messaging             — NEW. INTERACTIVE: Text thread / Voice note / Form-reply states in a single chat mock
09. Client view (portal)  — INTERACTIVE: Today / Programme / Check-in / Progress tabs (browser-portal framing kept)
10. Coaching notes & record — keep as-is (ClientRecordMock), tighten copy
11. Accountability         — INTERACTIVE: click a scenario chip → matching flag appears in mock inbox
12. Automations            — NEW. INTERACTIVE: Onboarding sequence / Re-engagement / Reminders. Honest framing: "Pre-built sequences you edit, not blast."
13. Templates              — keep, but add 2 new template types (Nutrition plan template, Automation template)
14. AI assist              — promote from callout to a proper, restrained block: programme-draft preview + check-in-summary preview, both labelled clearly. Link to `/features/ai`.
15. Verified vs Pro matrix — extend table with the new rows (Nutrition, Exercise library, Habits/wearables, Messaging, Automations)
16. Use cases              — keep, light copy refresh to mention new capabilities
17. FAQ                    — rewrite the "Does it include nutrition?" answer, add 2 new Qs (wearables, messaging migration)
18. FinalCta               — keep
```

> Hero, FinalCta, FAQ shell, Problem section structure, and the Verified-vs-Pro matrix all stay on the existing marketing primitives. No new section chrome is invented.

## Interactivity model (locked)

Single shared pattern for every interactive mock so the page feels coherent, not like a carousel zoo:

- Toggle UI: **segmented pill control inside the mock's chrome** (sits on the laptop/window top bar) — not tabs above the mock, not auto-cycling.
- State change: **instant swap** of the inner JSX (no slide/fade). Accessibility-first, zero motion sickness, fastest perceived performance.
- State: local `useState` per mock. No router, no URL params, no persistence, no data fetch. Pure presentational variants.
- Each interactive mock exposes 3–4 named states max. Default state matches the section's headline so the page reads correctly with zero interaction.
- Keyboard accessible: each segment is a real `<button>` with `aria-pressed`. Group has `role="tablist"` semantics via shadcn `ToggleGroup` (already in stack).

This pattern is reused across **9 interactive mocks** (sections 02–09, 11, 12) so the component cost compounds.

## New components

All under `src/components/marketing/`:

- `MockToggle.tsx` — the shared in-frame pill toggle (wraps shadcn `ToggleGroup`).
- `coaching/` subfolder (new) holding the section-specific mocks:
  - `ProgrammeMock.tsx` — Week 1/4/8 progression
  - `ExerciseLibraryMock.tsx` — filterable grid w/ video-demo thumbs
  - `NutritionMock.tsx` — Today / Week / Meal plan / Photo states (the MFP-replacement hero mock of the page)
  - `HabitsWearablesMock.tsx` — Sleep / Steps / Water / Workouts + connected-source row
  - `CheckInsInboxMock.tsx` — Pending / Replied / Flagged
  - `ProgressMock.tsx` — Strength / Body / Adherence / Photos (Photos = blurred placeholder cards + consent line; no real images)
  - `MessagingMock.tsx` — Text / Voice / Form-reply
  - `ClientPortalMock.tsx` — extend existing to add Today / Programme / Check-in / Progress tabs
  - `AccountabilityMock.tsx` — inbox of flags, driven by clicked scenario chip
  - `AutomationsMock.tsx` — sequence builder w/ Onboarding / Re-engagement / Reminders

Existing `CoachingDashboardMock` / `ClientRecordMock` stay; `ClientPortalMock` is upgraded in place.

## Files touched

| File | Change |
|---|---|
| `src/routes/features.coaching.tsx` | Major: new section order, new sections, swap static mocks for interactive ones, refreshed FAQ + matrix |
| `src/components/marketing/CoachingMocks.tsx` | Keep `CoachingDashboardMock` + `ClientRecordMock`; split portal into `coaching/ClientPortalMock.tsx` |
| `src/components/marketing/MockToggle.tsx` | New shared in-frame toggle |
| `src/components/marketing/coaching/*.tsx` | 9 new interactive mock components (list above) |
| `.lovable/memories/design/locked-coaching.md` | Rewrite: new section list, interactivity rule, nutrition + wearables + messaging + automations now in scope. Remove the "no nutrition / no progress photos / no app promise" lines (the no-buzzword / no-native-app rules stay). |
| `.lovable/memories/index.md` | Update the locked-coaching one-liner to reflect new scope. |

No changes to: `HeroOverlay`, `MarketingHeroEyebrow`, `SectionHeader`, `MarketingFaq`, `FinalCta`, `TierCard`, `HeroOverlay`, `PublicHeader`, `PublicFooter`, design tokens, hero image, hero copy.

## Copy hooks (anchors only — full copy written during build)

- Nutrition headline: *"Replace the food-tracking app with something built for coaching."*
- Wearables headline: *"Sleep, steps and training data flow into the check-in — automatically."*
- Messaging headline: *"One thread per client. Text, voice and form replies in the same place."*
- Automations headline: *"The repeatable parts of coaching, on a schedule you wrote."*
- AI section headline: *"AI drafts the first version. You coach the result."*

## Non-negotiables (carry-overs from project memory)

- Pro+Studio tier only; Verified excluded from every coaching-delivery row.
- £59/mo Pro Founding pricing language only; never "flat plan / one flat price / no booking fee" framing.
- No CIMSPA, no third-party brand placement (wearable section uses neutral labels — Apple Health / Garmin / Whoop are device-platform names, not partner brands, so they're allowed as plain text; no logos rendered).
- All section headings use `SectionHeader` / `SectionHeading` / `BlockHeading` primitives.
- Marketing rhythm: `py-20 lg:py-28` per section; every section after hero has `border-b border-reps-border`.
- Radius system respected: mocks use 18px for cards, 22px for the laptop/window panel.
- Emerald only for status semantics (Connected, Synced, Active) — nowhere decorative.
- No new client-side state libraries; pure `useState`.

## Validation after build

1. Visual sweep on desktop + mobile of all 9 interactive mocks: every state renders, no overflow, toggle stays inside the mock chrome.
2. Keyboard tab through each mock toggle group; confirm `aria-pressed` flips.
3. Confirm no third-party logos rendered; wearable labels are text only.
4. Confirm no "flat plan / booking fee / CIMSPA / UK" strings reintroduced.
5. Re-screenshot hero at 1464px and 390px to confirm HeroOverlay still locks correctly with the page's new length.

## Expected outcome

A coaching page that — section by section — visibly answers "what would a world-class coach want?" with a working-feeling mock instead of a bullet list. Nutrition, wearables, messaging and automations close the three remaining gaps vs Trainerize / PTD on the marketing surface. Interactivity converts the page from "feature list" to "product demo without signup."
