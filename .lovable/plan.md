# Monthly / Annual toggle on /pricing

Add a single Monthly / Annual toggle that drives all the plan cards (Free, Verified, Pro, Business) and the Studio panel. Annual = 10× monthly (2 months free, ~17% off). Founding pricing applies in both billing periods.

All work happens in `src/routes/pricing.tsx`. Visual-only, no backend.

## Toggle behaviour

- Pill toggle placed centered, just above the 4-card grid (below the Founding banner).
- Two options: **Monthly** · **Annual** with a small green/orange "Save 2 months" chip next to "Annual".
- Default selection: **Annual** (drives higher LTV; standard SaaS pricing-page default).
- Pure client state — `useState<'monthly' | 'annual'>('annual')`. No URL param, no persistence.

## Price changes per tier

All annual prices = monthly × 10. Display format on cards: headline = effective per-month price, secondary line = annual total.

| Tier | Monthly view | Annual view |
|---|---|---|
| Free Profile | £0 — Free forever | £0 — Free forever (unchanged) |
| Verified | £12/mo · "billed monthly" | £8.25/mo · "£99 billed yearly · 2 months free" |
| Pro (Founding) | ~~£39~~ £29/mo · "billed monthly" | ~~£32~~ £24/mo · "£290 billed yearly · 2 months free" |
| Business (Founding) | ~~£79~~ £59/mo · "billed monthly" | ~~£66~~ £49/mo · "£590 billed yearly · 2 months free" |
| Studio (Teams strip) | £149/mo · "billed monthly" | £124/mo · "£1,490 billed yearly · 2 months free" |
| Enterprise | Custom (unchanged in both views) | Custom (unchanged in both views) |

Founding strikethrough math: monthly standard 39/79 → annual standard becomes 32/66 (rounded from 32.50 / 65.83 for clean display).

## Data shape

Replace per-plan `price`/`period`/`priceWas` strings with a `pricing` object:

```ts
type PriceTier = {
  monthly: { price: string; was?: string; meta: string };
  annual:  { price: string; was?: string; meta: string };
};
```

Each plan card reads `plan.pricing[billing]` and renders. Free + Enterprise have identical monthly/annual entries so the toggle is a no-op for them.

## Comparison table

Adds one row at the top of the **Support** group (or its own "Billing" group — recommend a new group at the very top):

**Billing**
- Monthly price — £12 / £29 / £59 / £149
- Annual price (per month) — £8.25 / £24 / £49 / £124
- Save with annual — 2 months free / 2 months free / 2 months free / 2 months free

These don't depend on the toggle — the table is a complete reference, so it shows both. (Toggle only affects the cards above.)

## Visual / token rules

- Toggle: `rounded-full` pill group inside `border border-reps-border bg-reps-panel p-1`. Active option = `bg-reps-orange text-white`, inactive = `text-white/65 hover:text-white`. Both halves `h-9 px-5 text-[13px] font-semibold`.
- "Save 2 months" chip next to Annual: `bg-reps-orange-soft border border-reps-orange-border text-reps-orange rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`.
- Secondary price line on cards (e.g. "£290 billed yearly · 2 months free"): existing `text-[12px] text-white/55` style, no new tokens.
- All radii respect the locked system. No new colors.

## Out of scope

- No Stripe / Paddle wiring (Phase 2).
- No persistence of toggle choice across sessions.
- No URL-driven `?billing=annual` deep-link.
- No changes to Enterprise (stays "Custom" in both views).
- No changes to FAQ copy beyond optionally adding one entry: "Can I switch between monthly and annual?" → "Yes, anytime from your dashboard. Annual saves you 2 months versus monthly."
