## Brutal honest opinion first

**Yes to everything, but with one strong pushback on "Home / private studio".**

- **4 max instead of 3** — fine. Realistically most PTs work out of 1–3 places; 4 is the honest upper bound before it starts to look padded. I wouldn't go higher.
- **Home / private studio option** — makes total sense (mobile PTs, garage gyms, small studio operators genuinely need this) *but* it should be its own chip type, not a "gym". Reasons:
  - Home addresses **must never** be exposed publicly. If we let people search for it in the gym picker it'll end up in the `gyms` table with real coordinates and leak into directory search.
  - No Google link, no address line, no map pin behaviour — it's just a label.
  - So: treat it as a **separate "training base" type** stored on the professional (not in `gyms`). Options: `Home / private studio` and `Client's home / mobile`. Pick one or both, they render as chips with no address.
- **Link real gyms to Google Business profile** — good move, adds trust and lets clients check reviews/directions. Use `https://www.google.com/maps/place/?q=place_id:{google_place_id}` (canonical Google-recommended URL), `target="_blank" rel="noopener"`. Only render as a link when `google_place_id` exists — some `gyms` rows are internally added and won't have one.
- **Name + address on the public site** — yes, upgrade from "London" to real street address. Third Space Soho → "67 Brewer St, London W1F 9US" is way more useful than "London".
- **Orange pins** — agreed, `text-reps-orange` on the venue-card and coaching-reach chip pins. Keep the *dashboard editor* pins muted grey (chrome, not content).

One thing I'd flag but not block on: showing the full street address publicly is a small privacy nudge for boutique/1-person studios. For chain gyms it's obviously fine. If we want to be careful we can show address only when the venue is a chain/verified gym and fall back to "City" for solo studios. Happy to skip that unless you want it.

## Plan

### 1. Bump cap 3 → 4
`src/components/profile/GymPicker.tsx`
- `const full = mine.length >= 4` and update the "You've added the maximum of 3 gyms" copy.
`src/routes/_authenticated/_professional/dashboard_.website.tsx`
- Panel label `"Trains at (optional · max 3)"` → `max 4`, help text `"Add up to 3"` → `"Add up to 4"`.

### 2. Add "Home / private studio" as a separate training-base type
- **DB (migration):** add two boolean columns on `professionals` — `trains_at_home_studio` and `trains_at_clients_home` (both default `false`). No new table; these are properties of the pro, not gyms.
- **Editor:** in `WhereITrainPanel`, above the `GymPicker`, add a small 2-checkbox row ("Home / private studio", "Client's home / mobile"). Wire into the existing save flow that already writes `professionals`.
- **Public site (`VenuesSection` in `src/routes/c.$slug.index.tsx`):** render these as venue cards alongside real gyms, with no address subline and no Google link (label only). They count toward the "does the coach have any in-person venue?" check but don't add to the 4-gym cap (that cap stays on `professional_gyms`).
- **Shop-front loader (`src/lib/shop-front/shop-front.functions.ts`):** extend the `venues` shape to `{ name; address?; googlePlaceId?; kind: "gym" | "home_studio" | "mobile" }` and merge the two flags in.

### 3. Link real gyms to their Google Business profile
- **Loader:** include `google_place_id` when reading `professional_gyms → gyms` in `shop-front.functions.ts` (and the profile loader if it feeds the same section).
- **Public render:** in `VenuesSection`, if `googlePlaceId` is present, wrap the venue card in an `<a href={"https://www.google.com/maps/place/?q=place_id:" + id} target="_blank" rel="noopener noreferrer">` with a subtle hover state (border → `reps-orange-border`, no colour flip on the text). Non-linked (home/studio/mobile, or gyms missing a place_id) stay as plain `<div>`.

### 4. Show name + street address, not just city
- **Loader:** select `gyms.address` (or `formatted_address` — whichever column exists; if only `area`/`city`, fall back to `${area}, ${city}`) and pass through as `venue.address`.
- **Public render:** venue card shows `name` on line 1, `address ?? city` on line 2 in `text-white/55`.
- **Fallback:** if address is missing, keep the current city string.

### 5. Orange pins on the public site
- In `VenuesSection` (`src/routes/c.$slug.index.tsx`), change the venue-card `<MapPin>` and the coaching-reach chip `<MapPin>` / `<Globe>` from `text-reps-muted` → `text-reps-orange`.
- Dashboard editor pins stay grey (they're chrome).

### Out of scope
- Fetching fresh Google address/hours at render time (we already store address on import — no live Google call needed per page view).
- Redesigning the venue cards beyond adding the address line + link affordance.
- Removing the current gym-editor pin colour.

### Files touched
- `supabase/migrations/<new>.sql` — 2 columns on `professionals` + grants unchanged (existing table).
- `src/components/profile/GymPicker.tsx` — cap + copy.
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — panel copy, 2 new checkboxes, save wiring.
- `src/lib/shop-front/shop-front.functions.ts` — venue shape + loader.
- `src/routes/c.$slug.index.tsx` — `VenuesSection`: address line, Google link, orange pins, home/mobile chips.

### Open question before I build

Do you want **both** "Home / private studio" *and* "Client's home / mobile" as separate toggles, or just the single "Home / private studio" option you mentioned? They mean different things to clients (fixed private space vs mobile-to-you), so I'd lean toward both — but happy to ship one if you'd rather keep it simple.
