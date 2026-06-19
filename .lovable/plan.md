# Hide all demo professionals app-wide

The user is correct: city, profession, homepage, find-a-pro, /pro/[slug] and reviews pages all carry hard-coded "demo" professionals (proJames / proSophie / proDaniel / proLaura plus matching FEATURED arrays). Those demo entries are why card images aren't real AI-cropped headshots — the cards aren't drawing from real seeded pros at all when live data is empty.

Wipe them everywhere a public visitor can land. Real seeded pros (Hannah, Daniel, etc.) keep rendering exactly as today because they come from `getFeaturedPros` / DB queries, which already enforce the AI-headshot avatar pipeline.

## Pages to clean

### 1. `/in/$location` (`src/routes/in.$location.tsx`)
- Delete the `FEATURED: FeaturedPro[]` static array (lines ~256–317).
- Drop the `fallbackImgs` array and the `featuredRowToFeaturedPro(r, fallbackImg)` fallback image arg — pass through `r.avatar_url` only (no static fallback). If `avatar_url` is null, render the existing `Monogram` initials avatar instead of a stock photo. Update `FeaturedPro.image` consumer in `FeaturedProCard` to accept `image: string | null` and render `<Monogram name={pro.name} size={...} />` when null.
- When `livePros.length === 0`, render an empty state ("No verified professionals listed in {city} yet — be the first.") inside the existing section instead of the demo grid.
- Remove the 4 `pro-*.jpg` imports.

### 2. `/professions/$profession` (`src/routes/professions.$profession.tsx`)
- Same treatment as the city page: delete static `FEATURED`, drop fallback imgs, switch to Monogram fallback, render empty state when no live pros.

### 3. `/` homepage (`src/routes/index.tsx`)
- Delete `FALLBACK_FEATURED` (line ~172) and the `: FALLBACK_FEATURED` ternary branch at line 211 — always use live featured data.
- When live data is empty, render the same Monogram-friendly empty state. (Locked-homepage rule covers layout/sections, not demo content; this is content-only.)
- Remove the 4 `pro-*.jpg` imports.

### 4. `/find-a-professional` (`src/routes/find-a-professional.tsx`)
- Remove the demo image imports and any static profile entries that reference them. Directory results already come from `searchProfessionals`; keep only the live path. Empty results → existing "no matches" UI.

### 5. `/pro/$slug` (`src/routes/pro.$slug.index.tsx`)
- Remove the static demo profile records (james-wilson / sophie-taylor / daniel-hughes / laura-bennett) and the 4 `pro-*.jpg` imports.
- If the slug isn't in the DB, return `notFound()` (404) instead of serving a demo. This means linking to a demo slug from anywhere stale will 404 — that's intentional, since those people don't exist.

### 6. `/reviews` (`src/routes/reviews.tsx`)
- Remove demo review entries that point at the static demo pros and their `pro-*.jpg` images. If the page becomes empty without real review data, render an empty state placeholder. (If `/reviews` is purely a marketing showcase with no live wiring yet, swap to a "Coming soon — once verified clients start leaving reviews, they'll appear here" panel rather than fake data.)

### 7. Shared component (`src/components/public/FeaturedProCard.tsx`)
- Loosen `FeaturedPro.image` to `string | null`.
- When null, render `<Monogram name={pro.name} size={...} />` inside the square image slot (same 18px radius, same aspect-square wrapper) instead of `<img>`.

### 8. Asset cleanup (last step)
- After all imports are gone, delete the 4 unused files: `src/assets/pro-james.jpg`, `pro-sophie.jpg`, `pro-daniel.jpg`, `pro-laura.jpg`.

## Out of scope
- Profile page mock-ups under `src/mockups/` (internal-only, not public).
- Coach shop-front `/c/$slug` — its locked mock is separate and uses a different image set.
- Dashboard demo data (`dashboard-demo.tsx`) — internal preview, not user-facing public chrome.
- Generating new headshot images. Real seeded pros already use AI-cropped headshots; demo entries are simply deleted, not regenerated.

## Verification
1. `/in/london`, `/in/manchester`, etc. — featured grid shows only DB pros with real AI headshots, or the empty-state copy.
2. `/professions/personal-trainer` — same.
3. `/` — featured strip pulls live only.
4. Visiting `/pro/james-wilson` (demo slug) → 404.
5. `/reviews` no longer shows fake testimonials with stock photos.
6. `rg "pro-james|pro-sophie|pro-daniel|pro-laura"` returns zero matches.
