# /pro/$slug — Mockup v2 Rebuild

Single-file edit to `src/routes/pro.$slug.index.tsx`. No data model changes. Radii on the locked 6/8/10/12/16/18/22/24/full scale.

## Hero (top-of-page changes only)

- Trim About prose out of the hero. Keep italic bio to max 2 lines with a "Read more" reveal.
- Add `From £{minPrice} / session` price anchor under the CTA row (derived from services, no new field).
- Sub-nav: already removed in previous pass — confirm gone.
- Right sticky "Get in touch" card: unchanged content, add `sticky top-[88px]` behaviour so it persists on scroll and the sidebar Trust card doesn't visually duplicate it.

## New: "Who I help" strip

- Full-width warm-cream panel (`bg-reps-warm-ivory`, `rounded-[22px]`), sits directly under the trust-strip, above the 2-column grid.
- Left label "Who I help — I work best with people who:" + 4 icon+text columns.
- Data source: reuse existing `who_i_help` array on the professional profile if present; otherwise render 4 sensible defaults derived from specialisms (fallback content, not new schema).
- Icons: `Dumbbell`, `UserPlus`, `Home`, `Compass` from lucide, orange outline.

## 2-column spine (main / sticky sidebar)

Grid: `lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]`, `gap-8`.

### Main column (left)

1. **Services & Pricing** — swap current light cards for dark navy cards matching `/c/$slug`:
   - `bg-reps-panel`, `rounded-[18px]`, orange icon top-left, price large, tick bullets, orange "Enquire about this" button.
   - Middle card = "Most popular" ribbon (orange glow), only when a service is marked `is_featured`.
2. Soft cream "Not sure which option is right for you?" banner unchanged.
3. **Qualifications & Credentials** — keep current card, no restyle.
4. **What Clients Say** — keep current, no fake padding.
5. **FAQ** — accordion, first item open by default.

### Sticky sidebar (right, `lg:sticky lg:top-[88px]`)

1. **Location & Coverage** card:
   - "Based in {town}, covering:" + green-tick list of nearby towns (from existing coverage data).
   - Map: switch from Google red-pin to a **coverage radius overlay** — draw a dashed orange `google.maps.Circle` at lat/lng with radius from `service_radius_km` (or 15km default). Remove the marker. Update `src/components/pro/LocationMap.tsx` to accept `radiusKm?: number` and render Circle instead of Marker when provided.
   - Postcode check input + black "Check" button (client-side only for now — button wires to existing coverage check if implemented, otherwise disabled with tooltip "Coming soon").
2. **Quick Details** card: existing chip data reformatted as label/value rows (Specialisms, Age groups, Training style, Availability, Equipment).
3. **Trust & Assurance** compact checklist card — 4 lines, "View full verification →" link. Replaces the hero-duplicate trust card.

## Removals

- Standalone "Trust & Assurance" full card in main column (moved to sidebar).
- Duplicate hero "trust strip" stays as the top summary, but the sidebar Trust card takes over the detail role.
- Platform stat band ("25,000+ Verified Professionals / 120+ Countries") — belongs on `/`, not on a personal profile. Remove from the profile route only.
- Any remnants of Specialisms/Trains-at chip-lists as separate cards (absorbed into Quick Details + sidebar).

## Files touched

- `src/routes/pro.$slug.index.tsx` — main restructure.
- `src/components/pro/LocationMap.tsx` — add optional `radiusKm` prop, render dashed orange `google.maps.Circle` instead of marker when set.
- No new components unless a `<ProfileSidebar>` extraction naturally falls out during the edit.

## Scope guardrail

- No hero photo/copy changes beyond bio truncation + price anchor.
- No changes to `/c/$slug`, `/pro/$slug/enquire`, homepage, professions, cities.
- No data model / schema / server function changes.
- All colours via tokens; radii from the locked scale (services 18, cards 22, buttons 10).

## Verification

1. Typecheck clean.
2. Playwright screenshot at 1280 + 375 against `/pro/jordon-gumbley`, confirm:
   - Hero has price anchor, no sub-nav.
   - "Who I help" strip renders 4 columns.
   - Services are dark navy with "Most popular" ribbon on Hybrid.
   - Map shows dashed orange radius, not red pin.
   - Sidebar sticks on scroll; no duplicate Trust card.
3. Manual scroll check: "Get in touch" hero card stays sticky; sidebar Trust card is compact.
