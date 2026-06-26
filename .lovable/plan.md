## What we're building

A complete rebuild of `/dashboard` for the Verified tier. The brief is no longer "fitness SaaS analytics dashboard" — it's a **calm daily command centre for the trainer's public presence on REPs**. Superhuman prioritisation, Linear dark polish, Notion/Things hierarchy, Stripe-level card craft. The first question it answers is: *"What needs my attention today?"*

Empty-state is the default state — most Verified members will land here with zeros. The dashboard must never look broken, dead, or padded with skeletons. We hide what hasn't been earned.

## New page structure (replaces current 8-tile + dual-rail grid)

```text
┌───────────────────────────────────────────────────────────┐
│ 1.  PROFILE STATUS CARD  (full width, hero)               │
│     photo · name · Verified badge · Core plan             │
│     headline · Live on REPS · Copy link · View profile    │
│     Request a review                                      │
├──────────────────────────────────┬────────────────────────┤
│ 2.  NEEDS ATTENTION TODAY        │ 4.  TRUST RAIL         │
│     ONE card, ONE primary CTA    │     · Completeness     │
│     rotates state:               │     · Verification 3/3 │
│     - 1 review needs a reply     │     · Reviews summary  │
│     - Add your first service     │     · CPD status       │
│     - Request your first review  │                        │
│     - Insurance expires soon     │                        │
│     - Add a profile photo        │                        │
│     - Profile live — share it    │                        │
│                                  │                        │
│ 3.  KPI STRIP (max 4, earned)    │                        │
│     Enquiries · Reviews ·        │                        │
│     Views · Impressions          │                        │
│     Tiles only appear once data  │                        │
│     exists; otherwise collapsed  │                        │
├──────────────────────────────────┴────────────────────────┤
│ 5.  LOWER SECTIONS (stacked, only if real)                │
│     Education & CPD                                       │
│     Reviews                                               │
│     Services                                              │
│     Recent activity (hidden if empty)                     │
├───────────────────────────────────────────────────────────┤
│ 6.  Upgrade to Pro card (footer, quiet)                   │
└───────────────────────────────────────────────────────────┘
```

## Design language

- **Hierarchy:** one hero moment (Needs Attention) — everything else is supporting. No equal-weight grids.
- **Spacing:** generous. Stripe-level card padding (24–32px), 24px gutters, no cramped 8/4 split.
- **KPIs:** 4 max, each tile shows value + 14d sparkline OR a one-line "first 30 days" coaching hint when zero. Never a bare "—".
- **Orange:** restricted to the single primary CTA inside Needs Attention + the hero "View public profile" button. Nothing else.
- **Emerald:** Verified ticks + "Live on REPS" dot only.
- **Cards:** flat, no shadows on buttons, `rounded-[18px]` standard / `rounded-[22px]` hero per the locked radius scale.
- **Motion:** subtle staggered fade-up on mount (Linear-style), count-up on KPIs once data exists, no decorative animation.

## Onboarding-first behaviour (day-one trainer)

| Card | Has data | No data |
|---|---|---|
| Profile status | normal | normal |
| Needs Attention | rotates priorities | "Your profile is live — share it today" + Copy link CTA |
| KPI strip | shows tiles with sparkline | **strip is hidden entirely**; replaced by single "Tracking starts when your first visitor lands" line |
| Reviews / Activity / Services | shown if items exist | hidden, not skeleton-padded |
| Trust rail | always shown | always shown (this is the point of Verified) |

Result: a brand-new Verified trainer sees ~3 cards (profile, needs-attention, trust rail) — focused, intentional, never empty-feeling.

## Files I'll touch

- `src/routes/_authenticated/_professional/dashboard.tsx` — full layout rewrite
- `src/components/dashboard/hub/index.tsx` — strip down to: `WelcomeBanner` (kept, tightened), `NeedsAttentionHero` (new, replaces current `NeedsAttention`), `KpiStrip` (new, ≤4, conditional), `TrustRail` (recomposes existing `CompletenessCard` + `VerificationStatusCard` + `ReviewsSnapshot` + `CpdMini`)
- Delete/retire: `DiscoverabilityStrip` (folded into KPI strip), `ActivityTimeline` (only renders when ≥1 event), the second 8-tile KPI row, stacked-rail layout
- `src/components/dashboard/hub/HeaderSparkline.tsx` — keep, reused inside KPI tiles
- No DB changes. No new server functions. Discoverability tables stay as-is.

## Out of scope (explicit)

- Pro / Studio / Admin dashboards (Verified only this pass)
- Public profile, enquire, coach shop-front (all locked)
- Any business-logic / billing / verification changes

## Quality bar

Before saying done: side-by-side screenshot vs current, day-one (zero data) AND populated states both checked, no orange outside the two allowed spots, no `rounded-xl/2xl/3xl`, no shadows on buttons, audit script green.

Used the **redesign** skill to pin taste before building, and **reps-build-compliance** as the post-flight gate.
