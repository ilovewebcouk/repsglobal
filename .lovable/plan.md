# Lock `/pro/$slug/enquire`

Apply the same unify → QA → lock pass we ran on `/professions/$profession` and `/in/$location`, then freeze the route.

## What's already correct (no change)

- Radii on scale: button `10px`, inputs/field wrappers `12px`, service cards `16px`, summary panels `22px`. The one `14px` is the scaled-down pro photo in the summary card — already the **memory-allowed exception**.
- Brand orange via `reps-orange` tokens; no raw hex.
- Buttons are flat (`shadow-none`).
- No "UK"/"United Kingdom" copy. "central London" is a city, not a country qualifier — fine.
- SEO: `noindex` + canonical already set (correct for a transactional form).

## Changes (small, surgical)

1. **shadcn primitives pass** (active skill requires it). Replace hand-rolled controls with shadcn equivalents, keeping the exact visual:
   - Native `<input type="radio">` service cards → shadcn `RadioGroup` + `RadioGroupItem` (keep the card wrapper styling).
   - Goal chips' `<input type="checkbox">` → shadcn `Checkbox` (visually hidden, chip stays the toggle).
   - Three filter selects (Frequency / Start by / Budget guide) → shadcn `Select`.
   - Textarea → shadcn `Textarea`. Text inputs → shadcn `Input`. Terms checkbox → shadcn `Checkbox`.
   - "Verified" pill → shadcn `Badge` with brand-orange/green variant.
   - "Private to {name}…" caption + "Booking on REPs is safe" rows → keep markup, but wrap the safety items in shadcn `Tooltip` only if it adds value; otherwise leave (avoid noise).

2. **Copy sweep (global voice)**:
   - Textarea placeholder currently says "central {pro.city}" — keep (city-level is fine).
   - No other country qualifiers to strip. Confirm nothing slips in via the shadcn refactor.

3. **No structural / layout changes.** Section order, two-column grid, sticky summary, step indicator, "What happens next", trust block — all frozen as-is.

## QA

- Visual diff at 1366 desktop and 390 mobile against current preview — must be pixel-equivalent.
- `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` exits 0 (the existing `14px` on the pro photo is the memory-allowed exception and stays).
- Manual: tab through the form, confirm focus rings, confirm Select dropdowns open, confirm radio/checkbox state toggles, confirm "Send enquiry" remains a non-submitting `type="button"` (Phase 1 static).

## Lock

- Create `mem://design/locked-enquire` capturing: section order, radius map (with the 14px photo exception called out), shadcn primitives in use, no-commission/no-fee copy rules, `noindex` SEO.
- Add a Core line to `mem://index.md`: `/pro/$slug/enquire` LOCKED — see `mem://design/locked-enquire`.
- Update `docs/07_phase1_build_status.md`: set enquire route to **Locked — Phase 1 approved** with 2026-06-05 lock-log entry.

## Out of scope (Phase 1 guardrail)

No form submission wiring, no validation library, no email/notification backend, no auth gate, no rate limiting, no analytics events. Pure static high-fidelity screen.

## Files touched

- `src/routes/pro.$slug.enquire.tsx` (shadcn primitives swap only)
- `mem://design/locked-enquire` (new)
- `mem://index.md` (Core entry)
- `docs/07_phase1_build_status.md` (status + log)
