# Directory trust layer — production plan (v2)

Your tightening is right and I'm adopting it wholesale. This is the plan that gets us to a real 10/10.

## Guiding principle

The directory is the trust layer. Wrong name, fake distance, fake reviews → the whole platform reads as a prototype. Fix identity, fix location, make distance honest, kill mocked review numbers. In that order.

## Phase 1 — Identity fix (ship first, smallest change)

- `find-a-professional.tsx:281`: `r.full_name || "REPS Professional"` (was `r.trading_name`).
- `pro.$slug.index.tsx:209-210`: `row.full_name`; `firstName` derived from `full_name.split(" ")[0]`.
- `public-profile.functions.ts`:
  - `getPublicProfileBySlug` + `listPublishedProfessionals` join `profiles` and return `full_name` (and keep `avatar_url`).
  - Drop `trading_name` from both selects.
- `dashboard_.profile.tsx`: remove the "Business / gym name" Field, the `trading_name` form key, dirty-check, and submit payload.
- `dashboard-profile.functions.ts`: stop reading/writing `trading_name`.
- DB: `trading_name` stays. Add a SQL comment `COMMENT ON COLUMN professionals.trading_name IS 'DEPRECATED — Studio/Org model will replace; do not read on public surfaces'`. Studio accounts later get a proper `organisations` model.

Acceptance: every public card and `/pro/$slug` shows the trainer's full name. No business/gym label anywhere on a trainer profile.

## Phase 2 — Location model (`professional_locations`)

New table — single migration with grants + RLS:

```
professional_locations
  id uuid pk
  professional_id uuid fk → professionals(id) on delete cascade
  label text                       -- "Main gym", "Park sessions", etc.
  type text check in ('primary','gym','outdoor','service_area','online')
  postcode text                    -- FULL postcode, never exposed publicly
  postcode_outward text            -- e.g. "NR32"
  town text
  region text
  country_code text default 'GB'
  latitude double precision
  longitude double precision
  service_radius_miles integer
  is_primary boolean default false
  is_public boolean default true
  created_at, updated_at
```

RLS:
- `authenticated` SELECT/INSERT/UPDATE/DELETE WHERE `professional_id = auth.uid()`.
- `anon` + `authenticated` SELECT WHERE `is_public = true` AND owning pro is published — but the public read goes through a server fn that **only projects `town`, `region`, `postcode_outward`, `latitude`, `longitude`, `type`, `service_radius_miles`**. Never project `postcode`.
- `service_role` ALL.
- Partial unique index: one `is_primary=true` per pro.

Dashboard form:
- Field label: **"Primary training postcode"** (not "Postcode").
- Helper: *"We use this to calculate distance and show your town/area. Your full postcode is never shown publicly."*
- On save, `createServerFn` calls **postcodes.io** (free, no key, UK-only) → resolves `{latitude, longitude, admin_district, region, outcode}` → upserts the pro's `is_primary=true` row.
- Validates UK format with Zod; rejects 404 with friendly error.

Public reads:
- `listPublishedProfessionals` + `getPublicProfileBySlug` join `professional_locations` on `is_primary=true AND is_public=true`, projecting only the safe columns above.
- Card label shows `town` (fallback `postcode_outward`). Existing `professionals.city` becomes a final display fallback only.

Why a separate table now: trainers later add multiple venues, outdoor spots, online-only, service radius, and Studio brings org-level locations. Patching columns onto `professionals` would trap us.

## Phase 3 — Directory origin (make distance honest)

- New "Set your location" affordance in the directory filter row (shadcn `Popover` + `Input` + `Button`):
  1. "Use my location" → `navigator.geolocation.getCurrentPosition` → reverse via postcodes.io `/postcodes?lon=&lat=` → town + outward.
  2. Enter postcode → forward resolve.
- Persist `{ lat, lng, label }` in `localStorage` under `reps:viewerOrigin`.
- Active state chip: **"Searching from NR32 · Change"**.
- Haversine in a new `src/lib/geo.ts`; no library.
- Card distance suffix `"{town} · {n.n} mi"` **only when origin exists**. Otherwise just `town`.
- Sort dropdown:
  - Default sort: **Recommended** (verified-first, then most-complete profile, then most recent activity).
  - Other options: **Recently verified**, **Highest rated** (hidden until real reviews exist).
  - **Nearest** option is hidden until viewer origin is set; once set, it appears and becomes selectable.
- **No forced location prompt.** Browsing works without it; distance is the reward for setting one.

Static seed pros in `find-a-professional.tsx`: give them real lat/lng constants so the mock-up density still demonstrates distance once an origin is set.

## Phase 4 — Reviews honesty

- Remove hardcoded `rating: 5.0` / `reviews: 0` on live cards. Render **"No reviews yet"** when zero.
- `/pro/$slug` rating distribution block (`RATING_DIST` at line 191): hide entirely when there are no real review rows.
- Keep mocked review content on the 4 hardcoded template pros (`james-wilson`, `sophie-taylor`, `daniel-okafor`, `laura-finch`) — those are visual mock data, clearly demo. Live DB pros get zero-state.
- "Highest rated" sort hidden until a real `reviews` table exists (later phase).

## Phase 5 — Public QA matrix (post-build verification)

Walk every public-facing field, dashboard → DB → card → `/pro/$slug`:

| Field | Source | Expected |
|---|---|---|
| Name | `profiles.full_name` | Full name, never trading_name |
| Avatar | `profiles.avatar_url` (AI portrait) | Wired |
| Verified badge | `professionals.verification_status` | Wired |
| Town / location | `professional_locations` (primary, public) | town shown; full postcode never shown |
| Distance | client haversine vs viewer origin | only shown when origin set |
| In-person / Online | `professionals.in_person_available` + `online_available` | Wired |
| Specialisms | `professionals.specialisms[]` | Wired |
| Reviews | none yet | "No reviews yet" zero-state |
| Bio | `professionals.bio` | Wired |
| Services | template fallback | Deferred to credits/AI phase |
| Profile URL | `professionals.slug` (from full_name) | Wired |
| Dashboard edit flow | round-trip | Every edit reflects on card + profile |

## Build order (this is the order I'll ship in)

1. **Identity fix** (smallest diff, biggest trust win) — Phase 1 above.
2. **`professional_locations` migration + dashboard postcode field** — Phase 2.
3. **Directory viewer origin + honest distance + sort cleanup** — Phase 3.
4. **Reviews zero-state + remove fake ratings on live cards** — Phase 4.
5. **QA matrix walk-through** — Phase 5.

## Explicitly out of scope

- Credits-for-AI-features billing (your next phase).
- Real services CRUD on `/pro/$slug` (revisit with credits phase).
- Real reviews system (later).
- Map view of directory results.
- Studio / Organisation model (later, will reuse `trading_name` + `professional_locations`).
- International postcodes (postcodes.io is UK-only; we add a Google fallback when we expand — `country_code` column is already in place).

## Open question

One thing I want to lock before building Phase 3: **the default sort label.** I'm proposing "Recommended" (verified-first → completeness → recency). The alternative is "Recently verified" as the literal default so the logic is fully transparent. I'd pick "Recommended" — it gives us room to tune the ranking without changing the label. OK to proceed with that?