## Goal

Make Google-Places-backed gyms and the training postcode part of the **Website** tab (they drive the public `/c/$slug` page and distance search). Remove the duplicate free-text "Venues" list on the Website tab, and remove the postcode + gym picker from the **Profile** tab.

## Why

- The Website tab today has a plain "Venue name + address" free-text list stored in `shop_fronts.venues` — no validation, no map, no consistency.
- The Profile tab has the real gym picker (`GymPicker`, Google Places–backed, writes to `professional_gyms`) and the primary postcode (drives distance search on the public page).
- These belong to the coach's public website, not their internal profile.

## Changes

### 1. Website tab — `src/routes/_authenticated/_professional/dashboard_.website.tsx`
Replace the current "Where I train" panel body with:
- **Primary training postcode** field (moved from Profile) — same input, hint, `Public location: …` line, and same `savePostcode` server function.
- **Trains at (optional · max 3)** — render `<GymPicker />` (same conditional: only when `in_person_available`; otherwise show the "online-only" empty state).
- Keep **Cities** and **Online worldwide** as-is — those are reach chips, distinct from the gym list.
- Delete the free-text venue add/remove UI, the local `venues` state, and the `venues` field from `onSaveVenues`.

### 2. Profile tab — `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
- Remove the "Primary training postcode" block (lines ~1278–1295) and the "Trains at" block (lines ~1296–1307).
- Remove the now-unused `postcode` state, `initialPostcode`, `postcodeDirty`, the `savePostcode` call inside `handleSave`, the `postcode` error, the `GymPicker` import, and the `MapPin` icon if unused elsewhere.
- `dirty` becomes `profileDirty` only.

### 3. Public shop-front — make `professional_gyms` the source of truth for gym chips
So removing the free-text venues on the Website tab doesn't wipe out gyms on `/c/$slug`.
- In `src/lib/shop-front/shop-front.functions.ts`, inside `getShopFrontBySlug` and `resolveProfessionalShopFront`: after loading the shop-front row, load `professional_gyms` (join `gyms(name, city, region)`) for the same professional. If any exist, use them as the returned `venues[]` (`{ name, address: city/region }`) — overriding the DB `venues` column. If none exist, fall back to `sfRow.venues` for backward compatibility.
- No schema change. The `shop_fronts.venues` column stays but is effectively deprecated for new writes.

### 4. Save wiring
- `onSaveVenues` on the Website tab keeps saving `cities` + `online_worldwide` only.
- Postcode continues to save via the existing `savePostcode` server function on blur / dedicated Save.
- Gym add/remove already saves itself inside `GymPicker` — no extra wiring.

## Out of scope
- No changes to `GymPicker.tsx` itself.
- No migration to drop `shop_fronts.venues` — leave it in place; new saves just stop touching it.
- No visual change to the public `/c/$slug` page beyond swapping the data source.

## Files touched
- `src/routes/_authenticated/_professional/dashboard_.website.tsx`
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
- `src/lib/shop-front/shop-front.functions.ts`
