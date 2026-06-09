---
name: locked-coaching
description: /features/coaching frozen 2026-06-09 — 16-section interactive Pro pillar that out-features Trainerize / PT Distinction on coaching delivery
type: design
---

# /features/coaching — LOCKED 2026-06-09

The Coaching pillar page is the **most feature-dense page on the site** and the proof that REPs Pro delivers an end-to-end coaching workspace world-class trainers actually want. Do not redesign without an explicit, section-named request.

## Tier

Pro (£59/mo Founding) and Studio only. Verified is excluded from every coaching-delivery row in the comparison matrix.

## Section order (LOCKED)

```text
Hero (HeroOverlay copySide="left")
01. Problem               — 6-app fragmented stack vs one workspace
02. Programme delivery    — INTERACTIVE: Wk 1 / Wk 4 / Wk 8 (ProgrammeMock)
03. Exercise library      — INTERACTIVE: All / Lower / Upper / Cond. (ExerciseLibraryMock)
04. Nutrition             — INTERACTIVE: Today / Week / Plan / Photo (NutritionMock) — explicit MFP replacement
05. Habits & wearables    — INTERACTIVE: Sleep / Steps / Water / Training (HabitsMock) + Apple/Garmin/Whoop/Fitbit chips
06. Check-ins             — INTERACTIVE: Pending / Replied / Flagged (CheckInsInboxMock)
07. Progress              — INTERACTIVE: Strength / Body / Adherence / Photos (ProgressMock); Photos tab has consent line
08. Messaging             — INTERACTIVE: Text / Voice / Form (MessagingMock); voice notes up to 3 min
09. Client view           — INTERACTIVE: Today / Programme / Check-in / Progress (ClientPortalInteractiveMock); browser portal
10. Client record & notes — static ClientRecordMock (kept from previous build)
11. Accountability        — INTERACTIVE: scenario chip drives the featured flag (AccountabilityMock)
12. Automations           — INTERACTIVE: Onboarding / Re-engage / Reminders (AutomationsMock)
13. Templates             — 6 cards inc. Nutrition plan template + Automation template
14. AI assist             — AiAssistMock + bullets; "drafts the first version, you coach the result"; links to /features/ai
15. Verified vs Pro       — TierCard + 13-row matrix (every coaching row Verified=—, Pro=✓)
16. Use cases             — 6 coaching archetypes
FAQ                       — 6 items inc. Trainerize comparison, MFP replacement, wearables, AI hype
FinalCta
```

## Interactivity (LOCKED)

All 10 interactive mocks live in `src/components/marketing/coaching/InteractiveMocks.tsx` and share the `MockShell` component:

- **Toggle UI**: segmented pill control INSIDE the laptop chrome (top bar), right side
- **State change**: instant swap (no animation, no crossfade)
- **State**: local `useState` per mock, no router/URL/persistence
- **Accessibility**: real `<button>` with `aria-pressed` + `role="tab"`; toggle group has `role="tablist"`
- **Default state** is chosen so the section reads correctly with zero clicks
- Each mock has 3–4 named states max (Accountability has 5)

No other interactivity pattern is permitted on this page.

## Scope decisions (LOCKED)

- **Nutrition: full MyFitnessPal-replacement story** — macros, food database, barcode, meal plans, photo meal review, weekly compliance. Headline: *"Replace the food-tracking app with something built for coaching."*
- **Wearables**: Apple Health / Garmin / Whoop / Fitbit named as text only with emerald "live" chip — NO third-party logos rendered. These are device platforms, not partner brands.
- **Progress photos**: in-scope but inside Progress tab with explicit consent + "client-only by default" line, encrypted, never on public profile.
- **AI**: positioned as "drafts, you coach" — no buzzwords, every output is an editable draft.
- **Client view**: framed as browser portal accessed by magic link. No native mobile app promise.
- **Messaging**: voice notes max 3 min; replaces WhatsApp/IG/text juggle.
- **Automations**: pre-built sequences you edit before send — "never blasted".

## Forbidden on this page

- Booking commission / booking fee / flat plan / one flat price language
- CIMSPA name; any third-party brand placement (training providers, registries)
- "UK" / "United Kingdom" qualifiers in copy
- Native mobile app claims
- Any "AI does coaching for you" framing
- Re-implementing HeroOverlay inline (use `<HeroOverlay copySide="left" />`)
- Hand-rolled section H2s (must use `SectionHeader` / `SectionHeading` / `BlockHeading`)
- Decorative emerald — emerald is for status semantics only (Live sync, Active, Online, Connected)

## Components owned by this page

- `src/components/marketing/coaching/InteractiveMocks.tsx` — all 10 interactive mocks + `MockShell` wrapper
- `src/components/marketing/CoachingMocks.tsx` — retains `ClientRecordMock` (used in section 10) and legacy `CoachingDashboardMock`/`ClientPortalMock` (not currently consumed by the route; kept for backwards compat)

## Files touched

- `src/routes/features.coaching.tsx`
- `src/components/marketing/coaching/InteractiveMocks.tsx` (new)
- `src/components/marketing/CoachingMocks.tsx` (kept)
