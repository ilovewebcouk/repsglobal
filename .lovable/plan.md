## Goal

Rebuild `/features/ai` as a true 10/10 pillar page: **"The AI operating layer for fitness professionals."** Embedded intelligence across the platform, threaded with the principle **"AI suggests. The professional decides."**

Domain variants of the principle, repeated in their section:
- Nutrition → "AI drafts. The trainer reviews. The trainer approves."
- Coaching → "AI supports the coach, not instead of the coach."
- Business → "AI highlights what needs attention. The professional chooses the action."

## Rollback safety

The current page is preserved in chat history — if this build doesn't land, revert to this message and the previous page returns instantly. No backup file needed in the repo.

## Architecture (no sticky in-page nav — explicit user request)

Standalone route, same shape as locked `/features/operations` / `/features/visibility` pillars, with four bespoke sections that lift it above template-feel:

```
PublicHeader
  Hero — bespoke "intelligence layer" composite (NEW, not AiCommandCentreMock-in-laptop)
  1.  Problem
  2.  Anatomy of an AI suggestion  ← NEW, the page's signature moment
  3.  Workflow strip — AI across the REPs journey (10 stages)
  4.  Day in the life: before / with REPs AI  ← NEW, narrative bridge
  5.  AI for client attention (AnnotatedMock)
  6.  AI for check-ins & progress (50/50)
  7.  AI for programmes & coaching delivery (50/50)
  8.  AI for meal planning & nutrition + safety note (50/50)
  9.  AI for operations & admin (50/50)
  10. AI for profile & Shop Front (50/50)
  11. AI Command Centre — full-bleed AnnotatedMock
  12. Human control & professional boundaries (4 principle tiles)
  13. What REPs AI will never do  ← NEW, anti-pattern section
  14. Data & trust strip  ← NEW, table-stakes for AI in 2026
  15. Use cases (6 ProductBlock cards)
  16. Verified vs Pro (2 × TierCard)
  17. FAQ (MarketingFaq)
  18. FinalCta
PublicFooter
```

## The four bespoke sections (what makes it 10/10)

**Hero — bespoke intelligence-layer composite**
- Not "mock-in-laptop." A layered scene: dim REPs dashboard at the back, three semi-transparent AI suggestion cards floating in front (suggested reply / draft meal plan / client-at-risk), each connected by a hairline arc to the underlying row it's acting on. Approve / Edit / Dismiss controls visible on one card. Built in JSX with absolute-positioned cards over a dashboard frame, fade-up staggered (560ms / 0-340ms delays per locked hero template).
- H1: "The AI operating layer for fitness professionals."
- Lede (16px): "Use REPs AI to summarise client updates, draft next actions, review check-ins, support meal planning, improve your profile and stay on top of the work that keeps your business moving."
- CTAs: "Start using REPs Pro" → `/pricing` · "Explore AI features" → anchor `#command-centre`
- Trust chips: "AI suggests. You decide." · "Built around professional control." · "Nutrition drafts approved by the trainer."

**Section 2 — Anatomy of an AI suggestion**
- The page's signature visual. A single large card, broken into 4 numbered zones with arrows:
  1. **What it read** — a real client check-in excerpt
  2. **What it noticed** — "Mood down 2 weeks · adherence 54%"
  3. **What it drafted** — a short empathetic coach reply
  4. **You decide** — Approve · Edit · Dismiss controls + "Logged to client record" footnote
- Heading: "Every AI suggestion shows its working."
- Sub: "You see what it read, what it noticed and what it drafted — then you approve, edit or dismiss. Nothing reaches a client without you."

**Section 4 — Day in the life: before / with REPs AI**
- Two-column comparison (locked dark panel each side). Same six time-stamps down both columns (06:45 / 09:10 / 12:00 / 15:30 / 18:00 / 21:00). Left side = scattered, missed, late. Right side = AI summary cards already waiting, drafts queued, attention list ranked. Adapts the existing `DayInTheLife` primitive's pattern.

**Section 13 — What REPs AI will never do**
- 4 tiles, plain-spoken:
  1. Send anything to clients without you approving it
  2. Diagnose, prescribe or treat medical or clinical conditions
  3. Replace your coaching judgement on programme or nutrition decisions
  4. Train on your client records to improve other people's models
- Heading: "Lines REPs AI won't cross."

**Section 14 — Data & trust strip**
- Single tight horizontal strip, six chips with icons: EU infrastructure · You own your data · No training on your records · Audit log on every action · Per-client AI toggle · Delete on request
- One-line lede: "Your clients' trust is your business. We treat it like ours."

## Standard sections (briefly)

**1. Problem** — `SectionHeader` "Most trainers don't need more apps. They need a clearer view of what needs attention." + 3 problem tiles + strong line "The value of AI is not another chat box. It is knowing what to do next."

**3. Workflow strip** — Horizontal 10-stage strip: Profile → Shop Front → Leads → Onboarding → Coaching → Nutrition → Check-ins → Progress → Reviews → Retention. Each stage = card with one AI capability sentence.

**5. Client attention** — `SectionHeader` "See who needs attention first." + 8-signal bullet list + `AnnotatedMock` of an attention list.

**6. Check-ins & progress** — 50/50 BlockHeading "Turn client updates into clear coaching actions." + 8 bullets + summarised check-in mock card. Accountability line.

**7. Programmes & coaching** — BlockHeading "Draft faster. Coach with more context." + 7 bullets + "AI gives the trainer a starting point, not the final answer."

**8. Meal planning & nutrition** — BlockHeading "AI-assisted meal planning, approved by the trainer." + 8 bullets + amber Alert callout with the mandatory safety note + "AI drafts. The trainer reviews. The trainer approves." ribbon.

**9. Operations & admin** — BlockHeading "Reduce the admin work around every client." + 10 bullets + strong line.

**10. Profile & Shop Front** — BlockHeading "Improve the way clients understand your business." + 8 bullets + guarded promise (no SEO claims).

**11. AI Command Centre** (id="command-centre") — Full-bleed `AnnotatedMock` over `AiCommandCentreMock` with 7 callouts. Heading "Your next actions, brought into one view."

**12. Human control & professional boundaries** — 4-tile principles grid + "AI should make professional judgement easier to apply, not replace it."

**15. Use cases** — 6 cards (PT / Online / Strength / Transformation / Studio team / New pro), each as a small `ProductBlock`-style block with mini mock.

**16. Verified vs Pro** — 2 × `TierCard`. Verified = no AI. Pro = full AI layer. Pushes Pro.

**17. FAQ** — `MarketingFaq` × 8: who's in control · what data the AI uses · can clients see drafts · can I turn AI off per client · nutrition safety · programme accuracy · tier requirements · how it differs from ChatGPT.

**18. FinalCta** — H2 "Run your fitness business with clearer next actions." Sub-copy from brief. CTAs: "Start using REPs Pro" · "Explore all features."

## Technical details

- Full rewrite of `src/routes/features.ai.tsx`. Current 3-section `FeatureGroupLayout` shell deleted.
- All section components inline in the route file (matches operations/visibility/shop-front pattern).
- Reuse primitives only: `HeroOverlay`, `MarketingHeroEyebrow`, `SectionHeader`, `SectionHeading`, `BlockHeading`, `AnnotatedMock`, `TierCard`, `MarketingFaq`, `FinalCta`, `AiCommandCentreMock`, `DayInTheLife` (pattern reference).
- shadcn primitives: `Alert` for the nutrition safety callout, `Badge` for capability chips, `Tooltip` on principle tiles, `Separator` inside TierCard panels.
- Tokens only — no hex. Allowed radii: 10/12/16/18/22/24. No hairline section dividers. Standard rhythm `py-20 lg:py-28`. Hero `pt-24 pb-20 lg:pt-28 lg:pb-24`.
- All headings via `SectionHeading` / `BlockHeading` — no hand-rolled `font-display text-[Npx]`.
- **No sticky in-page nav** (explicit user direction).
- Meta: title "REPs AI — The AI operating layer for fitness professionals"; description rewritten around the operating-layer positioning; OG image stays `heroAi`.

## Out of scope

- No real AI wiring, model calls, or Lovable AI Gateway integration (Phase 1 = static screens).
- No chatbot composer UI.
- No changes to shared `AI_FEATURES` config (other pages may still use it).
- No memory file changes during the build — only after user signs off, a new "Locked /features/ai" memory entry.

## Verification

1. Preview at desktop + mobile; confirm hero composite renders cleanly, no hairline dividers, navbar shadow holds.
2. `rg "AI suggests|trainer reviews|professional control"` shows the principle in ≥3 sections.
3. Safety Alert is amber and visually distinct from standard panels.
4. Lighthouse-style spot-check: H1 unique, single H1, meta description set, OG image set.
5. Confirm "What REPs AI will never do" + Data & trust strip are present and read as plain-spoken, not legalese.

If the build doesn't land as 10/10 on first view, revert to the message above this one — the current page comes back instantly.
