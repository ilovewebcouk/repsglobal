## Goal

Replace the remaining slang on `/cpd` with precise, professional terminology — keeping the contrast sharp (verified vs not) rather than going bland. Single file touched: `src/routes/cpd.tsx`.

## Replacement vocabulary (consistent across the page)

- "dodgy" (course/provider) → **"unaccredited"** (course/provider)
- "dodgy provider or coach" → **"unaccredited provider or unverified coach"**
- "chancer" → **"unaccredited operator"**
- "Bedroom PTs with no qualifications" → **"Unqualified coaches working without credentials or insurance"**
- Anchor id `dodgy-courses` → **`unaccredited-courses`** (NAV_CHIPS entry + `<section id>`)

No other copy, layout, components or imagery change. RED_FLAGS / GOOD_SIGNS bullet text stays as-is (already professional).

## Exact edits in `src/routes/cpd.tsx`

| # | Line | Field | Before | After |
|---|---|---|---|---|
| 1 | 51 | meta description | "…how to spot a **dodgy** training provider…" | "…how to spot an **unaccredited** training provider…" |
| 2 | 102 | NAV_CHIPS entry | `{ anchor: "dodgy-courses", label: "Spot a dodgy course" }` | `{ anchor: "unaccredited-courses", label: "Spot an unaccredited course" }` |
| 3 | 383 | section comment | `/* Dodgy-course red flags */` | `/* Unaccredited-course red flags */` |
| 4 | 444 | FAQ answer | "verified expert and a **chancer**" | "verified expert and an **unaccredited operator**" |
| 5 | 447 | FAQ question | "How do I report a **dodgy provider or coach**?" | "How do I report an **unaccredited provider or unverified coach**?" |
| 6 | 1136 | section comment | `/* Section: Dodgy courses */` | `/* Section: Unaccredited courses */` |
| 7 | 1142 | `<section id>` | `id="dodgy-courses"` | `id="unaccredited-courses"` |
| 8 | 1148 | eyebrow label | "Spot a **dodgy** course" | "Spot an **unaccredited** course" |
| 9 | 1209 | "Filter out the noise" body | "**Bedroom PTs with no qualifications.** Instagram "online coaches"…" | "**Unqualified coaches working without credentials or insurance.** Instagram "online coaches"…" |
| 10 | 1219 | "Charge what you're worth" body | "verified expert and a **chancer**" | "verified expert and an **unaccredited operator**" |

## Verification after edit

1. `rg -n -i 'dodgy\|chancer\|bedroom pt\|punter\|scammy\|bullshit' src/routes/cpd.tsx` returns no matches.
2. `rg -n 'dodgy-courses' src/` returns no matches (anchor fully renamed; no other route links to it).
3. Anchor scroll from the in-page nav still lands on the renamed section.

## Out of scope

- RED_FLAGS / GOOD_SIGNS bullets, hero copy, qualification cards, pathways, pricing, imagery — unchanged.
- No new sections, no layout/typography changes, no token changes.
