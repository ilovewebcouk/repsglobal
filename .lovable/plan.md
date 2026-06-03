## 1. Header-style REPs wordmark in the feature-by-feature table

`src/components/marketing/CompetitorCompare.tsx`: replace the plain `"REPs"` text in the first column header (`COLS[0]`) with the existing `<RepsWordmark>` component at `h-[22px] text-white`, matching the header. Other three columns continue to render competitor `<img>` logos at current sizes so visual weight stays balanced.

## 2. Tier wordmarks (Verified / Pro / Studio) from the uploaded SVGs

The three uploads are inline white-fill outlined paths. Treat them as brand assets, not data — copy them into the repo so they tree-shake and inherit `currentColor`.

- Copy and normalise each into `src/assets/brand/` as `reps-verified.svg`, `reps-pro.svg`, `reps-studio.svg`. Strip the embedded `<style>` + `.cls-1` class and set `fill="currentColor"` on the root.
- Create `src/components/brand/RepsTierWordmark.tsx` exposing `<RepsTierWordmark tier="verified" | "pro" | "studio" className="..." />`. Renders the chosen SVG inline so it inherits text colour via Tailwind. `aria-label="REPs {Tier}"`.
- `src/components/marketing/PlansLimitsSummary.tsx`: replace the `"REPs Pro"` text span in the recommended row with `<RepsTierWordmark tier="pro" className="h-[18px] text-white" />`.
- Verified + Studio components are built in this pass but not yet placed — they slot in when we wire the pricing page tier headers / vs-pages in a follow-up (or now, if you want).

## 3. Q&A pass — `/compare` and the three `/compare/reps-vs-*` siblings

Read-only audit, no code changes. Output is a written report per page covering:

- **Content accuracy vs locked rules**: no "15%", no "booking fee", no "flat plan", REPs = 3-tier ladder, "publicly available" not "legally scraped", correct prices (£99 / £59 founding / £149), methodology link + "Last checked" present.
- **Cross-page consistency**: Trainerize / MyPTHub / PT Distinction add-on counts, client caps and entry prices match between `competitor-data.ts`, `PlansLimitsSummary`, `CompetitorCompare` feature matrix and each vs-page.
- **Copy quality**: headlines, sub-decks, CTA wording, tone, duplication between hub and vs-pages.
- **Visual / layout** at 1318px and mobile: sticky table behaviour, head-to-head card grid, hero spacing, header/footer rhythm.
- **SEO**: title <60, meta <160, single H1, og:image on vs-pages, canonical correct.
- **Links**: internal links resolve, methodology link present on every vs-page, "Last checked" date wired from `DATA_VERIFIED_DATE`.

Findings grouped per page as Must-fix · Should-fix · Nice-to-have, each with a concrete proposed change. No edits made in this step — once reviewed, we pick which fixes to ship.

## Order once approved

1. Wordmark swap in feature table.
2. Tier wordmark component + Pro swap in plans summary.
3. Q&A audit report delivered as a chat message; then triage fixes.

## Out of scope

- Pricing-page tier card swap to the new tier wordmarks (follow-up once component is signed off).
- Footer / auth wordmark changes (already done previously).
- Data, RLS, server-fn or routing work — visuals + copy only.
