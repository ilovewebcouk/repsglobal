
## Verdict

The page is strong on craft (hero, press marquee, AI moment, comparison, FAQ) and the new Act 2 grid correctly lists all **six pillars**: Visibility, Shop-front, Operations, Coaching, REPs AI, Growth.

But the **deep-dive sections below Act 2 still use the old 5-pillar numbering** and don't marry up:

| Section as labelled now | Real pillar | Issue |
|---|---|---|
| Visibility Showcase (no pillar tag) | Visibility | Not labelled as a pillar — reads as a one-off |
| Pillar · Shop-front | Shop-front | ✅ |
| Pillar 1 · Leads CRM | Operations (sub-feature) | Mis-numbered, treated as its own pillar |
| Pillar 2 · Coaching | Coaching | ✅ pillar, but number is wrong |
| Pillar 3 · Bookings & payments | Operations (sub-feature) | Mis-numbered; duplicates Pillar 1's pillar |
| Pillar 4 · Client portal | Coaching (sub-feature) | Mis-numbered |
| Pillar 5 · REPs AI | AI | ✅ pillar, but number is wrong |
| (missing) | **Growth** | No deep-dive at all — biggest gap |

Other QA issues:
- Hero "Explore features" → `/features` redirects back to `/for-professionals` (circular).
- AI section says "AI assistance included in every paid tier" — true at a high level, but per `feature-config.ts` four AI capabilities (Command Centre, Risk Alerts, Revenue Insights, Content Studio) are Business/Studio only. Wording should be softer.
- "Pillar 4 · Client portal" CTA links to `/features/coaching`, which is fine, but the section reads like a standalone pillar rather than part of Coaching.
- Two consecutive comparison-style sections (`ComparisonStrip` + `ReplacedStackBoard`) — the second is on-message, but they could be visually differentiated more strongly.

## Plan

Single file: `src/routes/for-professionals.tsx`. No new components, no logic changes — copy + section restructure only, to make the page mirror the 6 canonical pillars in order.

### 1. Re-label and re-order deep-dives to 6 pillars

Rename eyebrows so the page reads top-to-bottom as the same 6 pillars shown in the Act 2 grid:

1. **Pillar 1 · Visibility** — keep existing "Verified profile" ProductBlock, add eyebrow `Pillar 1 · Visibility`.
2. **Pillar 2 · Shop-front** — current "Pillar · Shop-front" section, renumber.
3. **Pillar 3 · Operations** — **merge** the current "Pillar 1 · Leads CRM" and "Pillar 3 · Bookings & payments" framing into one Operations pillar block:
   - Keep the Leads ProductBlock as the primary visual (it's the strongest mockup).
   - Add a compact 3-up sub-feature strip under it: Leads · Bookings & calendar · Payments & subscriptions (using existing icons from `feature-config.ts`), each linking to `/features/operations`.
   - Remove the standalone "Pillar 3 · Bookings & payments" ProductBlock (its bullets fold into the strip).
4. **Pillar 4 · Coaching** — keep `PillarTabs` section, renumber. Fold the "Pillar 4 · Client portal" ProductBlock into this section as a secondary block underneath the tabs (it's a Coaching sub-feature, not its own pillar).
5. **Pillar 5 · REPs AI** — keep as-is, renumber correctly (currently labelled "Pillar 5" but only because of mis-counting; will stay Pillar 5).
6. **Pillar 6 · Growth** — **NEW section** (currently missing). ProductBlock pointing at `/features/growth`:
   - Eyebrow: `Pillar 6 · Growth`
   - Title: "The single move to grow this month."
   - Body: revenue, retention, churn risk and renewal forecasting surfaced as a Monday-morning card.
   - Bullets pulled from `AI_FEATURES` Growth items + `FEATURES` insights entry.
   - Mockup: `{ device: "laptop", src: "/dashboard/reports", title: "Growth insights preview" }`.
   - CTA: "Explore Growth" → `/features/growth`.

### 2. Fix Act 2 transition copy

Update the Act 2 intro paragraph to reflect that all six pillars are detailed below, not just "the rest" after Visibility.

### 3. Smaller QA fixes

- Hero "Explore features" link: change `to="/features"` → `to="/for-professionals#pillars"` (anchor to Act 2) OR `to="/pricing"`. Recommend the anchor so it scrolls into the pillar grid on the same page.
- AI moment chip: change "AI assistance included in every paid tier" → "AI built into every paid tier — full suite on Business and Studio." Matches `feature-config.ts` tier mapping.
- Add `id="pillars"` to the Act 2 section for the hero anchor link.

### 4. Final section order (after changes)

```text
Hero
PressMarquee
Act 1 — Register (intro)
Pillar 1 · Visibility           (ProductBlock)
Act 2 — "Six pillars" grid       (id="pillars")
Pillar 2 · Shop-front           (ProductBlock, live /c/james-wilson)
Pillar 3 · Operations           (Leads ProductBlock + Bookings/Payments strip)
TestimonialFeature
Pillar 4 · Coaching             (PillarTabs + Client portal sub-block)
ComparisonStrip
ReplacedStackBoard + TestimonialTriad
UseCaseTriad
Pillar 5 · REPs AI              (hero moment + 6 AI caps)
Pillar 6 · Growth               (NEW ProductBlock)
WeekWithReps
FAQ
Final CTA
```

### Out of scope

- No new components, no design-token changes, no copy rewrites beyond eyebrows/intros listed above.
- No changes to `feature-config.ts`, `PillarTabs`, `ReplacedStackBoard`, or any pillar deep-dive route.
- No Phase 2 work (auth, DB, payments, AI wiring).

Used the **reps-build-compliance** skill (Phase 1 static-screens scope; no token or radius changes proposed; mock-up reference: `reps_fullpage_professional_dashboard_v1.png` for the new Growth block mockup framing).
