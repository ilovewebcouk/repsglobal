## Goal

Verify our competitor data is current via Firecrawl, patch any drift, then audit each of the three `/compare/reps-vs-*` pages section-by-section. Output is **(a)** safe in-place data/copy patches and **(b)** a separate structural-issues triage list for you to decide on.

## Phase 1 — Firecrawl scrape (internal evidence only)

Scrape **public pricing pages only** for each competitor. Never publish raw HTML or vendor screenshots — memory rule.

| Competitor | Target pages |
|---|---|
| Trainerize | `/pricing` (+ `/features` if pricing references add-ons there) |
| MyPTHub | `/pricing` |
| PT Distinction | `/pricing` |

For each, extract via Firecrawl `scrape` (formats: `markdown`, plus a `json` extraction with a fixed schema) and capture:

- Entry tier name + monthly price + client cap
- Top tier name + monthly price + client cap
- Free trial length
- Transaction / booking / payment fees (and whether Stripe is "included" or surcharged)
- Named paid add-ons + cost (branded app, Check-Ins AI, Meal Planner, AI Program Builder, extra trainers, Stripe Payments, etc.)
- Annual discount if shown

Output: a single internal `/tmp/competitor-snapshot.json` (not committed). I'll diff it against `src/data/competitor-data.ts`.

## Phase 2 — Reconcile `src/data/competitor-data.ts`

For each of the three competitors, surgically patch only fields that drifted:

- `tiers[].price` / `tiers[].clientCap`
- `freeTrial`
- `transactionFees`
- `addOns[]` (add new, remove discontinued, update costs)
- Bump `DATA_VERIFIED_DATE` to today.

If a field is unchanged, leave it untouched (no churn). `REPS_SIDE` already locked to Pro — not touched.

## Phase 3 — Editorial reconciliation `src/data/competitor-editorial.ts`

For each competitor:
- Re-check every numeric claim in `scenarios[].competitorCost`, `costStory`, and FAQs against the new snapshot.
- Update only drifted numbers. Preserve Pro-only framing (memory rule).
- Keep negations like "REPs does not charge a booking commission" untouched.

## Phase 4 — Per-page audit (Trainerize, MyPTHub, PT Distinction)

For each `/compare/reps-vs-*` page, walk the rendered sections in order and check against an audit checklist:

1. Hero — Pro framing, no banned phrases, correct competitor name
2. `PlansLimitsStrip` — entry/top prices match scrape, add-on list ≤4 highest-impact, Verified aside present
3. Feature matrix (`FEATURE_GROUPS`) — cells still defensible vs scraped feature lists
4. `CostCalculator` — `pickRepsTier` returns Pro for every client count, competitor cost math matches new prices
5. Scenarios — three scenarios per competitor, all `repsCost` = `REPs Pro £59/mo`
6. FAQs — Pro-only, no Free/Studio framing, founding price referenced
7. `VerdictScorecard` — weighting still honest with the new data
8. Methodology link + "Last checked" date visible
9. Banned-phrase sweep (memory list) — every match either negation or unrelated numeric

**Output split:**

- **Patches I'll apply directly**: factual corrections (price, add-on cost, trial length), Pro-framing tightening, banned-phrase fixes, "Last checked" date bump.
- **Structural triage list (no edits)**: anything bigger — e.g. "Trainerize scorecard over-weights AI", "PT Distinction scenario 3 no longer realistic", "feature-matrix row X is now misleading after their Nov update". You decide which to action in a follow-up.

## Phase 5 — Memory + skills lock

- Update `mem://content/comparison-rules.md` only if Phase 4 surfaces a new durable rule.
- Add a one-line dated note to `.lovable/plan.md` recording the snapshot date.

## Out of scope

- `pricing-data.ts`, `/pricing`, `PricingPlans`, `PricingCompare`, `FoundingBanner` — already locked correct.
- Stripe, billing functions, auth, DB, AI, design tokens, nav, footer, homepage.
- `/comparison-methodology` and `/faq` copy (already aligned).
- No new components, no layout/visual changes — Phase 1 visual lock holds.
- No publishing of raw scraped HTML or vendor screenshots anywhere in the codebase.

## Technical notes

- Firecrawl connector is now linked (`FIRECRAWL_API_KEY` available). Calls go through the connector gateway at `https://connector-gateway.lovable.dev/firecrawl/v2/scrape` with `Authorization: Bearer $LOVABLE_API_KEY` + `X-Connection-Api-Key: $FIRECRAWL_API_KEY`.
- All scraping done from `code--exec` in build mode; snapshot stored at `/tmp/competitor-snapshot.json` (not in repo).
- If a competitor pricing page is JS-heavy, add `waitFor: 2000` to the scrape.
- Diff + patch happens via small surgical `code--line_replace` edits on `competitor-data.ts` and `competitor-editorial.ts`. No file rewrites.
