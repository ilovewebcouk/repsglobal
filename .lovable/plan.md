## Goal

Make the Basket shipping-address form (Students & Certificates → Basket tab) autocomplete-driven so trainers pick their address from a Google suggestion dropdown and every field (line 1, line 2, city, postcode, country) fills automatically.

## Approach

Reuse the existing `loadPlacesLibrary()` loader and Google Maps browser key already used by the site's search bars. Google Places (New) supports `addressComponents`, so we can parse suggestions into structured parts.

## Changes

### 1. New component: `src/components/forms/StructuredAddressAutocomplete.tsx`

- Same suggestions UI/UX as `AddressAutocomplete.tsx` (single input + dropdown, keyboard nav, MapPin icon, session token).
- Requests `["addressComponents", "formattedAddress"]` on `fetchFields`.
- Parses `addressComponents` into:
  - `addressLine1` = street_number + route (fallback: premise / subpremise + route)
  - `addressLine2` = subpremise / sublocality_level_1 (if not folded into line 1)
  - `city` = postal_town → locality → administrative_area_level_2
  - `postcode` = postal_code
  - `countryCode` = country short_name (ISO-3166 alpha-2, upper-case)
- Emits a single `onSelect(parts)` callback.
- Also exposes `value` / `onChange` so the user can still type a search string; parts only fire on a real pick.

### 2. Wire into Basket shipping section

In `src/routes/_authenticated/_professional/dashboard_.students.tsx` (`BasketTab`):

- Above the current 7 inputs, render `<StructuredAddressAutocomplete>` labelled "Search address" with a small "or enter manually below" helper.
- On select, `setAddr` merges the parsed parts into existing state (`fullName` and `companyName` untouched; `phoneNumber` untouched). If a component is missing from Google (rare for line 2), leave the existing value.
- Keep all existing manual inputs so users can still edit / correct after autofill (needed for flats, care-of names, etc.).
- Preserve the existing `localStorage` persistence and the shipping validation logic (`addressComplete`) — no changes there.

### 3. No changes elsewhere

- No new dependencies, no server-function changes, no schema changes.
- `AddressAutocomplete.tsx` (formatted-string variant) stays as-is for the search bars.
- No design token changes; input styling matches the existing `Input` component in the form.

## Verification

- Load `/dashboard/students` → Basket tab.
- Type a partial address, confirm suggestions appear, pick one, and verify line 1, city, postcode, and country all populate; line 2 is set only when Google returns a sub-premise.
- Manual edits after autofill still work and persist via `localStorage`.
- Checkout button enables once required fields are complete.
- Screenshot the filled form before declaring done.

## Out of scope

- International address quality tuning per country.
- Any redesign of the basket UI.
- Adding autocomplete to other forms (enquire page, gym signup, etc.).
