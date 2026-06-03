# Head-to-head pages → long-form editorial deep dives

## The problem

Current `/compare/reps-vs-*` pages are basically `/compare` with one competitor filtered in: pricing strip + add-ons block + the same feature table + FAQ. That's not a deep dive — it's a reshuffle. They won't earn SEO against "Trainerize alternative" / "MyPTHub vs …" intent because there's no original analysis a person actually wants to read.

## The fix

Rebuild `HeadToHead.tsx` as a long-form editorial template (~2,000–3,000 words per page), with original opinion, scenarios, and a verdict. Keep `/compare` as the at-a-glance hub. The two surfaces should feel completely different.

## Linking check

Verified: `/compare` cards link to the three correct routes, each head-to-head cross-links to the other two and back to `/compare`. Routes match filenames. No change needed.

## New page structure

1. **Hero** — keep current dual-logo hero + headline, tighten the standfirst to one punchy paragraph and add a 3-bullet "the verdict in 30 seconds" callout.

2. **Long-form intro (~300 words)** — narrative on what the competitor actually is, who built it, who it's for, how it positions itself. Written like a magazine review, not marketing copy. Sets up the rest of the piece honestly.

3. **The hidden cost story (~400 words)** — expand the existing add-ons block into a full editorial section. Worked examples at 5 / 15 / 30 / 60 clients with an interactive **cost calculator** (slider for client count → live competitor total vs REPs flat price). This is the wedge.

4. **Day-in-the-life workflow comparison (~400 words)** — pick 4 daily PT jobs (onboard a client, deliver a programme, log a check-in, take a payment) and walk through how each platform handles them. Two-column scannable layout. Where competitor needs a paid add-on or third-party app, call it out.

5. **Side-by-side UI** — placeholder slots for real screenshots the user will supply later. Component renders labelled empty frames + a "Screenshots coming soon" tag so the layout is final and just needs image drop-in.

6. **Three scenarios (cards)** — "Solo PT, 10 clients", "Online coach scaling to 50", "Studio with 3 trainers". Each card: monthly cost on each platform, who wins, why. Drawn from the cost data we already have.

7. **Feature parity table** — keep the 2-column table that exists, but move it lower and frame it as "the receipts" rather than the centrepiece.

8. **Weighted verdict scorecard** — 6–8 criteria (price transparency, public discoverability, AI, coaching tools, payments, UK fit, scalability), each scored REPs vs competitor, weights shown, total at the bottom. Opinionated.

9. **Migration guide (~300 words)** — "Moving from <Competitor> to REPs in a weekend": export your clients, import to REPs, port programmes, redirect your booking link, cancel the old subscription. 5-step checklist component.

10. **"When <Competitor> is the right choice" (~150 words)** — keep the credibility section so the page isn't a hit piece.

11. **Expanded FAQ** — 8–10 Q's targeting people-also-ask phrasing, not 4–6.

12. **Cross-links + CTA** — keep current.

Removed from the new layout: the standalone pricing-side-by-side card block (rolled into the cost calculator) and the duplicate hidden-add-ons block (rolled into section 3).

## Per-competitor content (the part that makes them unique)

Each page needs genuinely different prose, not a templated mad-libs. The intro, day-in-the-life, scenarios, verdict scorecard weights, and migration guide will be hand-written per competitor and live as long-form strings in `src/data/competitor-data.ts` (new fields: `editorial.intro`, `editorial.dayInTheLife[]`, `editorial.scenarios[]`, `editorial.scorecard[]`, `editorial.migration[]`, expanded `faqs[]`). The component just renders.

- **Trainerize** angle: big, US-default, strong app, but you bring your own clients and pay per branded-app tier; AI is bolt-on.
- **MyPTHub** angle: UK-friendly, cleaner pricing than Trainerize, but custom-branded app is a separate one-time fee and Check-Ins AI is a paid module.
- **PT Distinction** angle: best-in-class coaching depth, but the $6-per-extra-client model punishes growth — show the curve.

## New / changed files

- `src/data/competitor-data.ts` — add `editorial` object per competitor (intro copy, day-in-the-life rows, 3 scenarios, scorecard rows, migration steps, expanded FAQs).
- `src/components/marketing/HeadToHead.tsx` — restructured per the 12 sections above.
- `src/components/marketing/CostCalculator.tsx` — new. Slider 1–100 clients, computes competitor monthly total from tier + add-on rules, shows REPs flat line.
- `src/components/marketing/VerdictScorecard.tsx` — new. Weighted table with totals.
- `src/components/marketing/MigrationChecklist.tsx` — new. 5-step numbered list with check states for visual rhythm only (no persistence).
- `src/components/marketing/ScenarioCards.tsx` — new. 3 cards, REPs vs competitor monthly cost.
- `src/components/marketing/UiSideBySide.tsx` — new. Two labelled placeholder frames with "Screenshots coming soon" badge, ready to swap.
- `src/components/marketing/DayInTheLife.tsx` — new. 4-row, 2-column comparison.

No route file changes — the three `compare.reps-vs-*.tsx` routes keep rendering `<HeadToHeadPage slug={...} />`. No nav/footer/pricing/auth changes.

## SEO

Per-page `head()` already targets `<competitor> alternative` variants — keep. With ~2,500 words of original analysis + a calculator + a scorecard + a migration guide, these pages become genuine ranking assets rather than thin reshuffles. JSON-LD `Article` schema stays; add `FAQPage` schema for the expanded FAQ.

## Out of scope

- No real competitor screenshots until you supply them (placeholders ship now).
- No blog/CMS — these stay as static route files.
- No changes to `/compare`, nav, footer, pricing, homepage.
- No backend / auth / DB.

## What I need from you

Approve the plan. Screenshots you can drop in any time after — the layout will be ready.
