# Rebuild `/features/coaching` as the Coaching Delivery pillar

## Goal

Replace the current 36-line stub (which uses the generic `FeatureGroupLayout` and old "Trainerize-class / nutrition" framing) with a standalone pillar page that is the equal of `/features/operations`, `/features/visibility` and `/features/shop-front` — but narrowly scoped to **what happens after someone becomes a client**: programme delivery, check-ins, progress, accountability, retention.

## Hard scope rules (what this page is NOT)

- Not a public profile / SEO / discovery page → that's `/features/visibility`
- Not a shop-front / enquire-book-pay page → that's `/features/shop-front`
- Not admin / pipeline / payments / forms → that's `/features/operations`
- Not an AI hype page → that's `/features/ai` (linked, not repeated)
- Not a nutrition app, not a workout-builder, not a "transformation guarantee"

The page owns one sentence: **"Deliver better coaching from one connected platform."**

## Positioning decisions (locking these now)

- **H1**: *Deliver better coaching from one connected platform.*
- **Tier**: Pro pillar (with Studio for multi-coach). Verified does NOT include coaching delivery.
- **Nutrition**: appears only as one bullet inside Check-ins ("nutrition or habit reflections"). No standalone nutrition section, no macro tracker.
- **Progress photos**: omitted from v1 copy (consent/storage UX not built). Progress = measurements, lifts, adherence, milestones, history.
- **Client app**: framed as a **client view** (magic-link browser portal) not a native mobile app.
- **AI**: a single 2-line callout linking to `/features/ai` instead of a full section.
- **Hero visual**: photo-led hero (consistent with locked Operations hero), reusing existing `heroCoaching` image + `HeroOverlay`. The "coaching command centre" mock lives in Section 2 as an `AnnotatedMock`, not in the hero.

## Section structure (final)

1. **Hero** — `HeroOverlay copySide="left"`, photo right. H1 + 32-word lede + dual CTA (`Start with REPs Pro` / `See coaching tools`). Eyebrow: "Coaching delivery".
2. **The problem** — short narrative + 4 fragmentation chips ("Programmes in one app", "Check-ins on WhatsApp", "Progress in camera roll", "Accountability from memory"). Closes on: *"Your coaching should not depend on scattered messages, screenshots and memory."*
3. **Programme delivery** (`AnnotatedMock`) — annotated coaching dashboard / programme builder mock: weekly structure, exercises with sets×reps×tempo×rest, video/exercise guidance, client-specific adaptations, reusable templates. Message: *"Build structured coaching plans clients can actually follow."*
4. **Client check-ins** (`UiSideBySide`) — left: trainer check-in review screen; right: client check-in form (goals, mood/energy/adherence, weight/measurements, training feedback, habits, coach notes). Anchor line: *"Check-ins turn coaching from a programme into a relationship."*
5. **Progress tracking** — 4-card grid: measurements, strength progress, adherence/attendance, milestones & history. Line: *"Clients stay more engaged when they can see progress, not just feel it."*
6. **Client view** — annotated client portal mock (their programme, next session, tasks, check-ins due, messages, progress, documents, package status). Message: *"Give clients a clear place to see what they need to do next."*
7. **Coaching notes & client context** — single client-record mock with goals, training history, injuries, coach notes, check-in history, programme history, progress timeline. Line: *"Coach with context, not guesswork."*
8. **Accountability & next actions** — 8 alert chips (check-in overdue, low adherence, missed session, no progress update, programme ending, review due, client inactive, milestone reached). Line: *"The best coaching systems show you who needs support before they disappear."*
9. **Templates & repeatable delivery** — 6-tile grid (programme / onboarding / check-in / assessment / review / message templates). Line: *"Create a repeatable coaching standard without making every client feel generic."*
10. **AI support callout** (one-liner card, NOT a full section) — *"AI should support the coach, not replace the coach."* Single CTA → `/features/ai`.
11. **Verified vs Pro matrix** — reuse `TierCard`. Verified = profile/visibility/reviews. Pro = full coaching delivery stack (this page). Studio = multi-coach consistency.
12. **Use cases** — `UseCaseTriad` (or 2 rows of 3): Personal trainers, Online coaches, Strength coaches, Transformation coaches, Small-group coaches, Studio teams.
13. **FAQ** — `MarketingFaq` × 6 (programme building, client experience, check-in cadence, data export, multi-coach, migration from Trainerize/TrueCoach).
14. **FinalCta** — *"Deliver coaching clients can follow, track and stay engaged with."* CTAs: `Start with REPs Pro` / `Explore all features`.

(Section 10 deliberately doesn't get its own numbered slot in the visual rhythm — it's an inline card between 9 and 11.)

## Components to reuse

`HeroOverlay`, `MarketingHeroEyebrow`, `SectionHeader`, `SectionHeading`, `BlockHeading`, `AnnotatedMock`, `UiSideBySide`, `TierCard`, `UseCaseTriad`, `MarketingFaq`, `FinalCta`, `PressMarquee` (optional under hero).

## Components to create (small, scoped)

- `CoachingDashboardMock` — static JSX coaching dashboard used by Section 3 (programme list, weekly grid, exercise rows).
- `ClientPortalMock` — static JSX client-view used by Section 6.
- `ClientRecordMock` — static JSX record card used by Section 7.

All three are static design-only components, no data, no logic — same pattern as Visibility's annotated profile and Operations' annotated pipeline.

## What I'll delete / migrate

- Remove dependency on `FeatureGroupLayout` for this route (page becomes standalone, like the other pillars).
- Old metadata copy (Trainerize / nutrition framing) replaced with new H1-aligned copy.

## What I will NOT touch

- `FeatureGroupLayout` itself (other routes still use it).
- The hero image asset.
- `/features/ai`, `/features/operations`, `/features/shop-front`, `/features/visibility`, `/c/james-wilson`.
- Pricing copy, tier prices, comparison pages.

## Lock + memory

After build, add `mem://design/locked-coaching` and append it to `mem://index.md` Core, mirroring the locked-operations / locked-shop-front / locked-visibility entries.

## Open questions before I build

1. Confirm "client view" is positioned as **browser portal**, not native app. (Recommended — we don't have an app.)
2. Confirm **no nutrition section** and **no progress photos** in v1 copy. (Recommended — keeps promises credible.)
3. Confirm the **AI section is a one-line callout**, not a full block. (Recommended — `/features/ai` already exists.)
4. Section 11 framing: Verified is genuinely **excluded** from coaching delivery (it's profile/visibility only), correct? Or should Verified get a "view-only" mention?

Once those four are answered I'll build the page end-to-end in one pass and lock it.
