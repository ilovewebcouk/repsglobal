## Goal

Rebuild `src/routes/features.coaching.tsx` to follow the PDF spec end-to-end, but **keep the existing `NutritionSection`** (Sarah K. ribbon → Manual / Templates / AI-draft triad → "AI should speed up…" quote → Client intake → AI draft → Trainer edits → Trainer approves → Client sees plan strip) exactly as it is today.

The PDF expands Coaching from a "static screens" pillar into the full client-delivery layer of REPs Pro, with 16 distinct sections (vs. today's 11–12). Most of the PDF copy is sharper than what's live now — we use it verbatim where it doesn't break memory rules.

## Final section order

1. Hero — "Deliver better coaching from **one connected platform.**" + 3 trust chips (REPs Pro · Connected to your client record · No extra add-ons). Uses `HeroOverlay copySide="left"` over an existing coach photo.
2. Problem split — "Most coaches don't struggle to coach. They struggle to deliver consistently." with the two-column "Six apps. One overwhelmed coach." vs "One workspace. Every client connected." card pair.
3. Programme delivery — "Build structured coaching plans clients can actually follow." + 6-bullet capability list + AnnotatedMock of the programme builder (block / week / session).
4. Exercise library — "10,000+ exercises with video demos — built into the programme builder." + filter/category grid mock + 6-bullet list.
5. **Nutrition — UNCHANGED.** Existing `NutritionSection` (Sarah K. ribbon, 3 MealModeCards, quote, ApprovalStrip). Re-using the locked component byte-for-byte.
6. Habits & wearables — "Sleep, steps and training data flow into the check-in — automatically." + Apple Health / Garmin / Whoop / Fitbit chips + weekly-view mock.
7. Client check-ins — "One inbox. Every client's week, in order of priority." + tabbed Pending / Replied / Flagged inbox mock + bullet list.
8. Progress tracking — "Four lenses on one client. One source of truth." + 4 lens tabs (Strength / Body / Adherence / Photos) with the sparkline grid we already have, lightly relabelled.
9. Messaging — "One thread per client." + thread mock (text + voice-note + form-reply chips).
10. Client portal view — "What the client sees, on purpose." + 4-tile mobile-portal mock (What's next / My programme / My check-in / My progress).
11. Coaching notes & client context — "One record per client. Every session, every note." + timeline mock (goals → injuries → notes → programme → progress).
12. Accountability & next actions — "Retention is built between sessions, not during them." + 5 scenario chips (Check-in overdue, Low adherence, Quiet client, Milestone hit, Programme ending).
13. Automations — "Set it once, edit before it sends — never blasted." + onboarding / re-engagement / reminder cards.
14. Templates & repeatable delivery — 6-tile grid (programme, nutrition, onboarding, check-in, automation, message templates).
15. AI assist — "An assistant, not a substitute." + 6 bullets, emerald "Trainer reviews · Trainer approves" status chip strip (re-uses the emerald-status token already used in NutritionSection).
16. Verified vs Pro matrix — 13-row capability table using the shared `TierCard` + comparison-matrix primitive from `/features/shop-front`. Pricing comes from memory (Verified £99/yr, Pro £59/mo Founding) — **NOT the PDF's £90 / £50, which is stale.**
17. Built for every coaching model — 6 use-case cards (PT, Online, Strength, Transformation, Small-group, Studio teams).
18. FAQ — `MarketingFaq` with the 6 PDF questions.
19. FinalCta — "Deliver coaching clients can follow, track and stay engaged with." + Start using REPs Pro / Explore all features buttons.

## Reuse vs. new

Reuse (no changes):
- `HeroOverlay`, `SectionHeader`, `SectionEyebrow`, `MarketingFaq`, `FinalCta` from `src/components/marketing/`.
- `TierCard` + matrix primitive from the shop-front pillar.
- Current `NutritionSection`, `MealModeCard`, `SarahRibbon`, `ApprovalStrip` — moved unchanged into the new file order.
- Existing programme / check-in / progress / portal mock blocks where they already match the PDF spec; copy refreshed only.

New (local to this route, not promoted to shared primitives yet):
- `FragmentedStackSplit` — two-column "Six apps vs One workspace" comparator.
- `ExerciseLibraryMock` — filter-rail + 6-tile video-card grid.
- `WearablesStrip` — 4 vendor chips + weekly-view mock card.
- `MessagingThreadMock` — single client thread with voice-note + form-reply chips.
- `ClientPortalMock` — 4-tile mobile portal frame.
- `ClientContextTimeline` — timestamped timeline mock.
- `AccountabilityQueue` — 5 scenario flag chips.
- `AutomationsGrid`, `TemplatesGrid`, `AiAssistBlock`, `UseCasesGrid` — small content grids built from the marketing primitives.

## Guardrails applied during the rebuild

- All section headers via `SectionHeader` / `SectionEyebrow` (no hand-rolled H2/H3 sizes).
- Vertical rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; every other section `py-20 lg:py-28`; one optional proof strip directly under hero only.
- Dividers: hero has none; every later section uses `border-b border-reps-border`.
- Hero overlay uses `<HeroOverlay copySide="left" />` — no inline 5-layer wash.
- Radii pulled from the locked scale (button 10, input 12, card 16, large panel 22, hero 24). No 14/20/28/32 anywhere except the existing 14px photo exception.
- Colours: brand orange via tokens; emerald only on the approval / on-track / "Trainer approves" status chips (NutritionSection + AI Assist). Nothing decorative.
- Copy: drop "UK" qualifiers; never name CIMSPA; never claim booking commissions; no "10,000+" inflated against reality — keep the PDF's "10,000+" only if we already display a library that scales (acceptable for a mock).
- Pricing: Verified £99/yr, Pro £59/mo Founding (memory wins over PDF's £90 / £50). Studio £149/mo not referenced because Coaching is Pro-only.
- shadcn primitives for any tabbed mock (Tabs), any tooltip, any badge.

## Out of scope

- No new shared primitives promoted to `src/components/marketing/` in this pass.
- No real wearable / messaging / AI integrations — Phase-1 static mocks only.
- No changes to `/features/shop-front`, `/features/operations`, `/features/visibility`, `/for-professionals` or the locked `/c/$slug`.
- No imagery regeneration unless an existing hero asset can't carry the new headline; if needed, I'll flag it and stop before generating.

## Memory update on completion

Replace `mem://design/locked-coaching` with the new 19-section order and explicitly record that section 5 reuses the locked `NutritionSection` so future passes don't overwrite it.
