# Make `/professions/<slug>` world-class

Lift the profession landing pages (currently 6: personal-trainer, pilates-instructor, yoga-teacher, nutritionist, strength-coach, online-coach) to match the homepage's editorial bar. Today's page is functional but flat — small text hero, no imagery, generic "at a glance" card, weak hierarchy after the featured-pros row.

## What's locked (does NOT change)

- Palette, type, radius, button rules, header/footer, brand orange — already pinned by `mem://design/source-of-truth` and the locked homepage.
- The 6 profession slugs and their static data in `professions.$profession.tsx` (qualifications, specialisms, avg rate, count, related).
- Featured-pros card style (same component family as homepage's "Featured REPs Professionals").
- Phase 1 scope: static only. No real search, no DB-backed trainer list, no map.

## Approach: 3 rendered design directions → user picks → I build

Because taste is already locked across the project, I'm skipping the palette/type/layout preference round and going straight to **three structural directions** that vary in composition, density, and editorial register — not in colour or font.

### Direction brief (sent to create_directions)

- **Target:** the full profession page, anchored on the personal-trainer slug as the reference render.
- **Product contract:** hero with profession-specific imagery + headline + qualifying claim + search; an "authority" moment (qualifications + rate + verified count) that reads like a credential, not a stat card; specialisms as a navigable strip; featured pros (4-up, locked card); cities (2×4 grid, locked); a "why every <profession> on REPs is verified" trust band; an FAQ; related professions footer.
- **Energy:** premium, credential-led, trustworthy — same register as the homepage hero. Not wellness-soft, not generic directory.
- **References:** the homepage hero/CTA band, the locked profile page, editorial sports publications (Men's Health, GQ Sport).
- **Motion:** match the locked marketing hero template — staggered fade-up only, no Ken Burns, no parallax.

### Three flavors I'll generate

1. **Editorial** — full-bleed hero image of the profession in action (PT coaching, Pilates reformer, etc.), large display headline, qualifying line, search lives in a floating dark card overlapping the hero base. "At a glance" becomes an inline credential strip under the hero, not a sidebar card.
2. **Split-credential** — left column: headline + blurb + search. Right column: large profession photo with a glass credential card pinned to the bottom-right (rate, count, rating, top 3 qualifications). Specialisms strip sits flush below as a single horizontal band.
3. **Dense magazine** — compact hero (image + headline side-by-side, photo ~40% width), then immediately a 3-column "what to expect" grid (Qualifications · Typical specialisms · Pricing & format) before featured pros. Highest content density, closest to a Wirecutter-style buyer's guide.

All three keep the existing section ORDER below the hero (featured pros → cities → why verified → FAQ → related) but the hero + authority moment is what varies.

## Flow

1. Call `design--create_directions` with the brief above + the full-page screenshot I just captured.
2. Surface the three rendered prototypes via `ask_questions` (type: prototype). You pick one.
3. I implement the chosen direction in `src/routes/professions.$profession.tsx`, reusing existing card primitives. All 6 profession slugs inherit the new layout via the existing `PROFESSIONS` map — no per-slug forks.
4. QA across mobile (390), tablet (768), desktop (1366). Lock the result with a `mem://design/locked-profession-page` entry once approved.

## Out of scope

- Real search / map / DB queries.
- New imagery generation beyond what's needed for the chosen direction (decide after pick).
- Per-city pages (`/professions/<slug>/in/<city>`) — separate request.
- Touching the homepage, profile page, or any other route.

## Files likely touched (after pick)

- `src/routes/professions.$profession.tsx` (layout rewrite, data untouched)
- Possibly 1–2 new small components under `src/components/marketing/` if the chosen direction warrants a reusable credential strip
- `mem://design/locked-profession-page` (new, post-approval)
- `mem://index.md` (add reference)
