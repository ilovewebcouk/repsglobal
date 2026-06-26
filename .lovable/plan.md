# Two display titles with supersession (Option A: hide, don't revoke)

## Goal

A Pro can display **up to two titles** on their public profile and shop-front. The **highest-tier title leads** (default), with optional manual reorder. Titles that are **superseded by another granted title** are hidden from the display picker but **kept in `pro_titles`** (reversible if the higher cert ever lapses).

Jordon's outcome: picker offers **Personal Trainer** + **Nutrition Coach** only. Fitness Instructor stays in the DB (superseded by PT) but is hidden everywhere — picker, badge, shop-front, profile.

## What we're building

### 1. Supersession as catalog data (not hand-coded cases)

Add a `supersedes: TitleSlug[]` field to each entry in `src/lib/cpd/titles-catalog.ts`. One-time rules:

- `personal-trainer` supersedes `["fitness-instructor", "group-fitness-instructor"]`
- `advanced-personal-trainer` supersedes `["personal-trainer", "fitness-instructor", "group-fitness-instructor"]`
- `strength-coach` supersedes `["fitness-instructor"]` (NOT PT — different scope)
- `accredited-sc-coach` supersedes `["strength-coach"]`
- `nutrition-coach` supersedes `[]` (different family — additive)
- `registered-nutritionist` supersedes `["nutrition-coach"]`
- `registered-dietitian` supersedes `["nutrition-coach", "registered-nutritionist"]`
- `pilates-instructor`, `yoga-teacher` supersede `[]`

Helper in the same file:

```ts
export function filterVisibleTitles(granted: TitleSlug[]): TitleSlug[]
```

Returns granted minus any slug that appears in another granted slug's `supersedes` list. Pure, deterministic, unit-testable.

### 2. Database: store the display picks

New column `professionals.secondary_title_slug TEXT NULL` (existing `primary_title_slug` already covers slot 1). Migration adds the column + a CHECK that `secondary_title_slug != primary_title_slug` when both are set.

No new tables. No data migration needed — column defaults to NULL; UI auto-derives defaults on first read.

### 3. Display-titles derivation (single source of truth)

New helper in `src/lib/cpd/titles.functions.ts`:

```ts
getDisplayTitles(): Promise<{ primary: TitleSlug | null; secondary: TitleSlug | null; visibleGranted: TitleSlug[] }>
```

Logic:
1. Load `pro_titles` (all granted) + `professionals.primary_title_slug` + `secondary_title_slug`.
2. `visibleGranted = filterVisibleTitles(granted)`.
3. If stored `primary` is in `visibleGranted` → use it; else fall back to **highest-tier** entry of `visibleGranted` (tier 1 beats 2 beats 3; ties broken by catalog order).
4. If stored `secondary` is in `visibleGranted` and ≠ primary → use it; else `null` (don't auto-pick — let the user opt in to a second title).

This is what `trust.functions.ts`, shop-front, public profile, and the badge all consume.

### 4. UI: rebuild `EarnedTitlePicker`

Current picker is single-select for primary only. New layout:

```text
Your displayed titles                    [ Save ]
─────────────────────────────────────────────────
Slot 1 — Primary           [ Personal Trainer ▾ ]
Slot 2 — Secondary         [ Nutrition Coach ▾ ] [×]
                           [ + Add a second title ]

Hidden because a higher qualification covers them:
  • Fitness Instructor — covered by Personal Trainer
```

- Both dropdowns list only `visibleGranted`.
- Slot 2 options exclude whatever's in Slot 1.
- "Hidden" list explains supersession so the trainer understands why FI disappeared.
- Save writes both `primary_title_slug` and `secondary_title_slug` via a new `setDisplayTitles` server fn.

### 5. Consumers updated to render two titles

- **`trust.functions.ts`** — return `{ primaryTitle, secondaryTitle, titles: visibleLabels }` instead of just `primaryTitle`. `titles[]` becomes the supersession-filtered list (used by `CpdMini`'s checked list).
- **Verified badge** (`/pro/$slug` + shop-front header) — subtitle reads `"Verified · Insured · Personal Trainer & Nutrition Coach"` when secondary set, else single title.
- **`CpdMini`** in dashboard hub — headline counts `visibleGranted.length` titles; pinned-Primary list shows Primary + Secondary (badged) on top, remaining visible titles below.
- **Shop-front `/c/$slug`** — hero subtitle uses primary + secondary join.
- **Search / directory cards** — already use `primary_title_slug` only; no change for slot 1, but card chips should reflect filtered list (small follow-up).

### 6. Self-healing on grant/revoke

Extend the existing `verification.functions.ts` flow that already clears `primary_title_slug` when its grant is removed:

- When a new title is granted, do NOT auto-shuffle the user's chosen slots — if a higher-tier title arrives, leave their current pick alone but surface a one-time dashboard nudge ("You're now qualified as Advanced PT — want to display it?").
- When a grant is revoked, clear the affected slot (existing behaviour for primary; mirror for secondary).
- Supersession only ever **hides** — it never deletes the `pro_titles` row.

## Out of scope

- Allowing more than 2 display titles.
- Auto-promoting a newly higher-tier title without user consent.
- Changing the rules engine (`title-rules.ts`) — supersession lives at the display layer only; grants still reflect actual qualifications held.
- Editorial rewrites of profession landing pages.

## Technical notes

Files touched:

- `src/lib/cpd/titles-catalog.ts` — add `supersedes` + `filterVisibleTitles()`.
- `src/lib/cpd/titles.functions.ts` — add `getDisplayTitles`, `setDisplayTitles`.
- `src/lib/verification/trust.functions.ts` — expose `secondaryTitle` + filtered `titles[]`.
- `src/lib/verification/verification.functions.ts` — mirror existing primary-clear logic for secondary on revoke.
- `src/components/profile/EarnedTitlePicker.tsx` — two-slot picker + hidden list.
- `src/components/cpd/EarnedTitlesPanel.tsx`, `src/components/dashboard/hub/index.tsx` (CpdMini) — render two titles.
- `src/routes/pro.$slug.index.tsx` + Verified badge component — render two-title subtitle.
- `src/lib/shop-front/shop-front.functions.ts` + `/c/$slug` route — include secondary in hero/header.
- One migration: `ALTER TABLE professionals ADD COLUMN secondary_title_slug TEXT NULL` + CHECK.

No schema changes to `pro_titles`. No backfill needed. Locked screens (homepage, /pro, /c, /in/*, /professions/*) keep their layouts — only the title subtitle string changes.
