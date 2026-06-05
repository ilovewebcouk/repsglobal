# Plan — Dense editorial profession page

Rebuild `src/routes/professions.$profession.tsx` (anchor: `/professions/personal-trainer`) as Direction C: a compact hero followed by a buyer's-guide info grid, then featured pros, cities, trust, FAQ, related. All on the real page so images actually render.

## Section order

1. Breadcrumb — Home › Find a Professional › Personal Trainers
2. Compact hero (50/50, ~520px tall)
   - Left: tag chip ("1,284 verified · 4.9★"), H1 "Find a verified **Personal Trainer**" (profession word in brand orange), 1-line blurb, search bar (profession pre-filled + location + orange Search), 2 trust micro-lines
   - Right: full-height coaching photo, 18px radius, single tonal overlay (no Ken Burns)
3. **"What to expect from a verified Personal Trainer"** — 3-column info grid (the C differentiator)
   - **Qualifications** — Level 3 PT (RQF), Level 4 Specialist, First Aid (current), Insurance + DBS
   - **Typical specialisms** — Strength · Fat Loss · Hypertrophy · Pre & Postnatal · Older Adults · Sports Performance
   - **Pricing & format** — £45–£85/hr typical · 1:1 in-person or online · 30/45/60 min sessions · No REPs booking fee
4. Specialism pill strip (horizontal, hover → orange border)
5. Featured pros — 4 locked cards (unchanged shape, real `<img>`)
6. Cities grid — 4×2 with counts
7. Trust band (dark) — Verified Credentials · Recognised Training · Insurance & DBS · Real Reviews
8. FAQ — 4 collapsed accordion items
9. Related professions — pill links

## Image sourcing

Reuse the existing trainer imagery already in `src/assets/` (the same set used on the homepage and `/pro/$slug`). Hero photo: pick the dark-gym coaching shot already in the assets pipeline with the REPS wordmark visible. No new image generation in this pass — keeps the page rendering real pixels immediately.

## Technical

- Single route file: `src/routes/professions.$profession.tsx`
- Reuse `PROFESSIONS` data map — no per-slug code forks; the 3-column "what to expect" block is driven by fields on the profession object (qualifications[], specialisms[], pricing string). Add those fields if missing, with sensible defaults for the 6 slugs.
- Reuse existing components where they exist: featured pro card, cities grid, trust band, FAQ accordion, related pills. Extract a small `ProfessionInfoGrid` component if the 3-column block grows past ~80 lines.
- Tokens only: `bg-brand-orange`, `text-brand-orange`, semantic ink/ivory. No hex.
- Radii: hero 24px, info-grid cards 22px, featured/pro cards 18px, cities 16px, FAQ 16px, pills full, buttons 10px, inputs 12px. No 14/20/28/32 or `rounded-xl/2xl/3xl`.
- Flat buttons (`shadow-none`), orange (never gold) stars, staggered fade-up only (80ms stagger, 560–640ms).
- Per-slug `head()` — title, description, og:title, og:description, og:image = hero photo.

## QA before handoff

- `/professions/personal-trainer` at 1366 + 390 — every image renders, no broken slots
- Spot-check `/professions/nutritionist` and `/professions/pilates-instructor` — data fallback works
- Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0
- Confirm no homepage edits leaked in (homepage is locked)

## Out of scope

Real search, map, per-city pages, profile redesign, homepage edits, new image generation, auth, DB.
