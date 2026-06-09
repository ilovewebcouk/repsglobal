# Marketing-page anti-drift governance

Source-of-truth enforcement pass only. No redesigns, no route changes, no token / colour / radius / typography / pricing / backend / auth / payments / DB / AI changes. Just docs + an audit script.

## 1. Create `src/components/marketing/README.md`

A single canonical reference for every approved marketing primitive. For each, document **purpose / where used / what it replaces / permitted variants / what NOT to hand-roll**:

- `SectionHeading` — section H2 (30 → 40px). Replaces hand-rolled `<h2 className="font-display text-[Npx]">`.
- `SectionEyebrow` — small uppercase label above headings.
- `SectionHeader` — eyebrow + heading + optional lede composite.
- `BlockHeading` — 50/50 in-block H3 (28 → 36px). Replaces hand-rolled `<h3 className="font-display text-[Npx]">`.
- `MarketingHeroEyebrow` — hero kicker.
- `ProductBlock` — canonical 50/50 product/feature block (copy + media).
- `MarketingFaq` — accordion FAQ block.
- `FinalCta` — single end-of-page CTA (see `mem://design/final-cta`).
- `VerifySteps` — 3-step verify strip.
- `RegisterProof` — register stat / trust block.
- `ReplacedStackBoard` — "replaces X tools" board.
- `PillarTabs` — pillar tab nav.
- `ComparisonStrip` — short comparison strip.
- `TrainerToPlatformComposite` — cinematic trainer + REPs UI cards (3 compositions: card-trail / device-and-stats / single-hero). See `mem://design/trainer-to-platform-composite`.
- `HeroDeviceCluster` — device cluster used in hero positions.
- `UseCaseTriad` — 3-up use-case tile row.
- `WeekWithReps` — "a week with REPs" narrative block.
- `AiCommandCentreMock` — AI command-centre mock-up tile.
- `PressMarquee` — editorial wordmark marquee.

Then a **Rules** section listing the explicit do/don't items from the brief (no hand-rolled headings; no `text-[32px]/[40px]/[48px]` in route files; use SectionHeading / BlockHeading / SectionEyebrow; 50/50 = ProductBlock; mockups = shared components; locked memories remain authoritative).

A short **Reading order** pointer to `mem://design/source-of-truth`, `mem://design/marketing-section-primitives`, and the locked-page memories.

I'll grep `src/components/marketing/` first to confirm every primitive listed actually exists; any that don't will be flagged in the report rather than invented.

## 2. Create `scripts/audit-marketing-primitives.mjs`

Pure Node ESM script, no deps. Glob via `fs` + recursive walk.

**Scan scope:**
- `src/routes/for-professionals*.tsx`
- `src/routes/features*.tsx`
- `src/routes/cpd*.tsx`
- `src/routes/compare*.tsx`
- `src/components/marketing/**/*.tsx`
- `src/components/features/**/*.tsx`

**Hard violations (exit 1):**
- Banned pricing copy (case-insensitive): `15% booking fee`, `booking commission`, `one flat plan`, `single flat plan`, `£29 Pro`, `Free Profile` (as a pricing card label).
- In **route files only** (`src/routes/...`): `font-display text-[`, `font-heading text-[`, or any of `text-[32px]`, `text-[36px]`, `text-[40px]`, `text-[44px]`, `text-[48px]` co-occurring with `font-display` / `font-heading` on the same element.
- Obvious placeholder panels in route files: `TODO`, `Placeholder`, `Coming soon` inside JSX text (allowlist a small set of legitimate uses if any are found during dry-run).

**Soft warnings (exit 0, printed):**
- Same heading patterns inside `src/components/marketing/` or `src/components/features/` (these primitives are allowed to define the canonical sizes).
- Route-file `<h2>` / `<h3>` that don't reference `SectionHeading` / `BlockHeading` import.

**Output format per finding:**
```
[HARD|WARN] path:line  <matched snippet>
  → use <recommended primitive>
```

Final summary: `N hard, M warn`. Non-zero exit only on hard violations.

## 3. Update `package.json`

Append script (do not modify existing scripts, do not wire into build):
```
"audit:marketing": "node scripts/audit-marketing-primitives.mjs"
```

## 4. Update build status doc

Append a short section to `docs/06_build_status.md` (or whichever current build-status doc exists — I'll confirm during exploration) noting:
- Marketing primitives are documented in `src/components/marketing/README.md`.
- `npm run audit:marketing` checks for drift.
- Future marketing pages must consume approved primitives.
- Tailwind tokens alone don't enforce semantic typography — primitives + audit do.

## 5. No ESLint rule

Skip ESLint per brief.

## Process

1. Explore `src/components/marketing/` to confirm exported primitive names.
2. Dry-run the audit logic mentally against `src/routes/features.visibility.tsx`, `features.shop-front.tsx`, `features.ai.tsx`, `for-professionals.tsx`, `cpd.tsx`, `compare.*.tsx` to calibrate hard vs warn thresholds (avoid noisy first run).
3. Write README → write script → update package.json → update build-status doc.
4. Run `node scripts/audit-marketing-primitives.mjs` and capture real output for the report.
5. If the first run produces hard violations, list them in the final report — do **not** fix them in this pass (that's a follow-up). The brief is governance-only.

## Final report sections

1. Files created
2. Files updated
3. README coverage
4. Audit checks
5. Example output (real, from running the script)
6. Current failures (if any)
7. Confirmation: no visual or functional changes
