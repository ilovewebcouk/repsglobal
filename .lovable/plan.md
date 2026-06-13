# 10/10 Gyms: Google Places + the 5 extras you didn't ask for

## Part A — Google Places hybrid (the core ask)

### Flow
1. Pro types in `GymPicker` → server fn `searchGyms` hits local DB first.
2. If local DB returns < 5 active matches AND query length ≥ 3, server fn fans out to **Google Places API (New)** via the existing Google Maps connector (gateway-backed, no new secret).
3. External results render below local results with a small `via Google` chip and a building icon. Visually distinct, never mixed with curated chain rows.
4. On select of an external result → server fn `importGoogleGym(placeId)`:
   - Calls Places Details for canonical name, formatted address, lat/lng, postcode, locality, types, business status.
   - Hard-rejects `business_status != OPERATIONAL` and types that aren't `gym|fitness_center|health_club|sports_club`.
   - Upserts into `gyms` by `google_place_id` (new unique column) with `status='active'`, `source='google_places'`, `claim_status='unclaimed'`, `verified_by_gym=false`, `created_by=auth.uid()`.
   - Returns the new row, then `addMyGym` is called atomically in the same handler.
5. Next pro who types the same name gets it from the local DB — **Google is hit once per gym, ever**.

### Connector
`Scott's Google Maps Platform` (`std_01ksx6ksdvf8wv7fgd0qwm32qs`) is already in the workspace and linkable. We link it on first migration. No user-supplied secret needed.

### Anti-abuse + cost control
- Server fn rate limit: max 10 Places lookups per pro per hour (in-memory + DB-backed counter on `professional_gyms` insert attempts).
- Country bias: `regionCode: GB` for now (matches £ pricing). Easily lifted when REPs goes global.
- Field mask kept minimal (`id,displayName,formattedAddress,location,addressComponents,types,businessStatus`) → ~$0.005/request, well inside the free $200/mo.

### Schema delta (one migration)
- `gyms.google_place_id text unique`
- `gyms.source text default 'curated'` — enum-ish via check (`curated|google_places|user_submission`)
- `gyms.business_status text`
- Drop the throttle trigger's blanket `pending_review` rule for `source='google_places'` (Google-sourced gyms are auto-active).
- Index on `google_place_id` for upsert speed.

### Files touched
- New: `src/lib/google-places.server.ts` (gateway wrapper, server-only).
- Edit: `src/lib/gyms.functions.ts` — add `searchGymsExternal`, `importGoogleGym`; merge into `searchGyms` response shape `{ local: GymOption[], external: ExternalGymOption[] }`.
- Edit: `src/components/profile/GymPicker.tsx` — render two `CommandGroup`s (`Verified gyms` + `Other gyms (via Google)`), wire import flow with a loading state.
- New migration: schema delta above.
- Connect Google Maps connector to project.

### Why this is the right call
- Coverage goes from ~60 venues to every operational gym in the UK overnight.
- Density math (`gym_density` view) lights up for 100% of pros, not 20%.
- Chain branding stays curated (Third Space stays Third Space, not a Google blob).
- Zero ongoing cost at current scale; deterministic upgrade path when usage grows.

---

## Part B — Brutal truth: 5 things still missing for true 10/10

These are the items that separate "a great gym picker" from "category-defining infrastructure." All small; none controversial.

### 1. Dedupe by place_id on import (mandatory)
Without it, two pros typing "PureGym Lowestoft" within seconds create duplicate rows because the Places API search runs before the local DB row exists. Fix: `INSERT ... ON CONFLICT (google_place_id) DO UPDATE RETURNING id`. Bundled in Part A migration.

### 2. Geocode the curated seed (small, high leverage)
Current 60 seeded gyms have no lat/lng. The moment we add Google-sourced gyms, the `/at/{gym}` map block and "nearest verified coach" features will look broken for chain venues but work for Google ones. One-off backfill: server fn that loops curated gyms with no lat/lng, geocodes via the connector, writes back. Run once.

### 3. Chain normalisation on Google imports
When Google returns "PureGym Birmingham New Street", we should auto-attach `chain_slug='puregym'` by regex-matching the displayName against the existing `chains` list. Otherwise the directory ends up with 200 unrelated PureGym rows that can't be grouped. ~30 lines in `importGoogleGym`.

### 4. Pro-visible "this gym was added by another pro" state
Builds trust + social proof. When pro sees a `source='google_places'` result with ≥1 other pro already attached, show a tiny `· 3 trainers here` line under the row. Same density signal that powers `/at/{gym}` later. Free win from data we'll already have.

### 5. Admin one-click "promote to curated"
`/admin/gyms` already exists. Add a `Promote` button on `source='google_places'` rows that flips `source='curated'` + lets admin paste a logo URL + tagline. This is the path by which a Google-imported "Third Space Soho" becomes a fully-branded venue. No new route; one button + one mutation.

---

## Part C — Things I'm intentionally NOT doing in this pass (and why)

- **Public `/at/{gym}` landing pages**: Phase 2.0 scope. Schema supports it from day one (slug exists), but the route can ship after Verified billing.
- **Gym claim flow**: Phase 3. The `claim_status` column is in place; UI waits.
- **Maps embed on gym pages**: Phase 2.0. We capture lat/lng now so we never have to backfill.
- **Global rollout (drop GB region bias)**: when the global launch ships. Trivial flag flip.

---

## Ship order (single sub-pass)
1. Link Google Maps connector to project.
2. Migration: `google_place_id`, `source`, `business_status`, index, throttle bypass for `google_places`.
3. `google-places.server.ts` wrapper (search + details + geocode).
4. Extend `gyms.functions.ts`: external search, import, chain auto-match, rate limit.
5. Update `GymPicker` UI to two-group result list + `via Google` chip + import-loading state.
6. Backfill server fn: geocode curated seed (run once from admin button).
7. Admin `Promote` button on `/admin/gyms`.
8. Verify: type "PureGym Lowestoft" → external result → import → chip appears → row visible in admin → second type returns local hit.

**Verdict**: with all of A + B shipped, the gyms substrate genuinely is 10/10 — every gym in the country is reachable, every gym is dedup'd, every gym carries the data Phase 2 shop-fronts and Phase 3 claims will need. Approve and I'll execute end-to-end.
