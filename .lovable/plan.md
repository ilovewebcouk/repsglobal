# Featured Pro Card v2 — world-class pass

Goal: lift the rail from "directory tile" to "marketplace hero card" — the same bar as Airbnb, Resy, Booksy, Treatwell. Pricing + rating become first-class signals. Featured rail enforces visual diversity.

## 1. Data model (migration)

Add to `public.professionals`:

| Column | Type | Notes |
| --- | --- | --- |
| `from_price_pennies` | `integer` | Nullable. Starting session price in pence. Source-of-truth for "from £X". |
| `price_currency` | `text` default `'GBP'` | Future-proofing for global. |
| `years_experience` | `smallint` | Nullable. Used as proof when reviews = 0. |
| `value_prop` | `text` | Nullable, ~60 char. One-line replacement for "Personal Trainer" (e.g. "Strength coach for women returning post-baby"). |

Rating already lives via `reviews` table — confirm `rating_avg` + `rating_count` are computed (add trigger / view if missing). No new columns needed.

Backfill seed pros (`demo-verified@…`, James Wilson, Katie Gibbs, Hannah Thompson, Daniel Hughes) with realistic price + value_prop in the same migration.

## 2. Featured eligibility — additional rule

Update `src/lib/directory/featured.functions.ts`:

- Existing gates (avatar, identity_approved, quality≥60, headline, ≥1 specialism) — keep.
- **New: avatar de-dup.** Reject a candidate if its `avatar_url` perceptual hash (or, pragmatically, exact URL match) is already in the rail. Phase 1: exact URL dedupe is enough — James + Daniel sharing a generated face is the obvious failure mode. Long term: pHash.
- **New: require `value_prop`** when `quality_score < 75` (forces good copy on weaker pros).

## 3. Card rebuild (`src/components/public/FeaturedProCard.tsx`)

Final anatomy, top→bottom:

```
┌───────────────────────────────┐
│  ┌─────────────────────────┐  │  18px radius card, warm ivory bg
│  │                         │  │
│  │      4:5 headshot       │  │  object-cover object-top
│  │                         │  │  hover: scale-[1.03]
│  │ [Verified]      [Save]  │  │  top row, glass pills
│  │                         │  │
│  │           ★ 4.9 (128)   │  │  bottom-left glass pill
│  └─────────────────────────┘  │  (hidden when reviews = 0; falls back
│                                │   to "5 yrs experience" pill)
│  Hannah Thompson               │  18px font-display bold
│  Strength coach for women      │  14px charcoal, 2-line clamp
│  returning post-baby           │
│                                │
│  📍 Clerkenwell  ·  From £65   │  13px muted, single row
│                                │
│  Pre/post-natal   Rehab        │  outlined chips, sentence case, max 2
│                                │
│  ┌─────────────────────────┐  │
│  │  View profile        →  │  │  h-10, GHOST (border + charcoal text)
│  └─────────────────────────┘  │  hover: fills brand orange
└───────────────────────────────┘
```

Key changes vs current:

| Element | Current | v2 |
| --- | --- | --- |
| Subtitle | "Personal Trainer" hardcoded | `value_prop`, fallback to title |
| Proof | nothing when reviews=0 | rating overlay on photo, OR `{years} yrs experience` pill |
| Price | none | `From £{from_price}` in location row |
| Mode pill | "Hybrid" right-aligned in location row | **removed** — clients don't parse it; moved into profile page |
| Tags | kebab-case, 1–2 rows, unequal heights | sentence case, hard-capped at 2, single row, `+N` overflow |
| CTA | solid orange full-width | ghost outline, fills orange on hover |
| Card heights | variable (1 vs 2 tag rows) | **equal** via `flex flex-col` + `mt-auto` on CTA block |

Locked tokens (per `mem://design/source-of-truth` + reps-build-compliance):
- Card radius 18px, button 10px, input 12px
- No button shadow
- Brand orange via `bg-brand-orange` / `text-brand-orange` tokens
- Verified pill stays emerald (status-only accent, per `mem://design/status-colors`)

## 4. Rail header polish

In `in.$location.tsx` and `professions.$profession.tsx`:

- "See all →" → neutral charcoal with chevron, not orange (stops competing with CTAs).
- Subtitle copy: "Hand-picked, verified and accepting new clients." (drop "REPS-" — see core memory: no UK qualifier, brand is "REPs" everywhere else).

## 5. Out of scope

- Homepage Featured rail (locked).
- Save/bookmark wiring (icon only, no DB).
- pHash dedupe (exact-URL only for now).
- Rating computation pipeline if `rating_avg` doesn't already exist — flag and ask before adding.
- Any change to result-card or profile-card components.

## 6. Files touched

- `supabase/migrations/<new>.sql` — columns + seed backfill
- `src/lib/directory/featured.functions.ts` — dedupe rule, select new columns
- `src/components/public/FeaturedProCard.tsx` — full rebuild
- `src/routes/in.$location.tsx` — header polish
- `src/routes/professions.$profession.tsx` — header polish

## 7. Verification

1. `/in/london`, `/in/leeds`, `/professions/personal-trainer` — 4 cards, equal height, no two same face, rating OR years on every card, price on every card.
2. `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` exits 0.
3. Typecheck clean.
4. Screenshot before/after for the user.

## Technical notes

- Migration must include GRANTs (none new — columns on existing table, but verify policies still pass).
- `value_prop` lives on `professionals`; pro can edit later from dashboard (out of scope here — show a TODO comment).
- Rating overlay uses `bg-black/55 backdrop-blur-sm` glass pill, white text, `★` in brand orange (NOT yellow — per audit rule).
- Equal-height enforcement: card is `flex flex-col`; the meta+CTA block uses `mt-auto`; tags row has fixed `min-h-[28px]`.
