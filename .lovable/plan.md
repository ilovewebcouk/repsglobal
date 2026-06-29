## Problem

Jordon Gumbley's card on the homepage (`/`) shows only "Personal Trainer" even though he has both `primary_title_slug = personal-trainer` and `secondary_title_slug = nutrition-coach`. The previous dual-title fix was wired into `/find-a-professional`, `/in/$location`, and `/professions/$profession` — but the homepage's "Featured REPS Professionals" rail was missed.

## Root cause

`src/routes/index.tsx` derives the card label from `r.primary_profession` only:

```ts
// rowToHomeCard()
const role = r.primary_profession
  ? (PROFESSION_LABEL_HOME[r.primary_profession] ?? "Fitness Professional")
  : "Fitness Professional";
```

`FeaturedProRow` already includes `primary_title_slug` and `secondary_title_slug`, but `rowToHomeCard` never reads them.

## Fix

Update `rowToHomeCard` in `src/routes/index.tsx` to mirror the dual-title logic used by the other directory routes:

1. Import `getTitleLabel` from `@/lib/cpd/titles-catalog`.
2. Resolve `primaryLabel = getTitleLabel(r.primary_title_slug) ?? PROFESSION_LABEL_HOME[r.primary_profession] ?? "Fitness Professional"`.
3. Resolve `secondaryLabel = getTitleLabel(r.secondary_title_slug)`.
4. If `secondaryLabel` exists and differs from `primaryLabel`, set `role = \`${primaryLabel} · ${secondaryLabel}\``; otherwise use `primaryLabel`.

No other files change. `about.tsx` uses hard-coded demo cards and doesn't need updating. `FeaturedProCard` already renders whatever `role` string we pass.

## Verification

- Reload `/`. Jordon's card reads "Personal Trainer · Nutrition Coach".
- Single-title pros (e.g. Sophie/James) keep their existing single label.
- No fallback regression for legacy rows missing `primary_title_slug`.
