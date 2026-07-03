
# Pro profile header refresh

Scope: header block of `src/routes/pro.$slug.index.tsx` only (photo card + name column + Get in touch card, plus the trust strip directly beneath). Everything below the trust strip (sub-nav, About, Services, etc.) is untouched. All other locked pages untouched.

## What changes

**Name column, new vertical order:**

1. Verified pill — `REPS VERIFIED PROFESSIONAL` (unchanged, kept green outline style already in use).
2. H1 name (unchanged).
3. Profession line — `Personal Trainer & Nutrition Coach` (unchanged).
4. **New tagline paragraph** — one short italic/quoted sentence pulled from the profile's existing intro/headline field (e.g. `profile.headline` or first sentence of `profile.about`). Muted foreground, ~2 lines max, `max-w-[560px]`.
5. **Meta row (swapped order + inline):** star rating + review count → then map-pin + location. Single row on desktop, wraps on mobile. Removes the current "Telford" pill above the star row.
6. **Mode chips row — exactly three, icon + label, no filled pill:**
   - `At Home` (home icon)
   - `Online Coaching` (monitor icon)
   - `Telford & Surrounding Areas` (map icon) — kept, since it communicates travel radius (open question below to drop it).
   Chips are transparent with subtle border, muted text — matches reference.
7. CTA row: `Send Enquiry` (primary orange) + `Save Profile` (outline) — unchanged.

Removes: the standalone `In-person` pill and the standalone "At Home Personal Training — Telford & Surrounding Areas" line (both now absorbed into tagline + chip row).

**Get in touch card (right column):** kept as-is. Already matches the reference (usually replies / free chat / no obligation checklist, response rate 100%, Last active Just now, Send an enquiry button, Call `07834 123456` button, secure-details footnote).

**Trust strip beneath header:** unchanged (REPS Verified / Qualifications Checked / Professional Indemnity / CPD Tracking).

## Data wiring

- Tagline source: reuse `profile.headline` if populated; fall back to the first sentence of `profile.about`; hide if neither exists (no placeholder text).
- Rating + review count: existing `reviews_summary` fields.
- Location: existing `profile.city` (+ region if present).
- Mode chips: driven by existing `service_modes` / `works_at_home` / `works_online` flags on the profile record — do not hardcode.

## Files touched

- `src/routes/pro.$slug.index.tsx` — header JSX only (name column reorder, add tagline, swap star/location, replace chips block).
- No new components, no new server functions, no schema changes, no style tokens added.

## Out of scope

- Photo card, gallery button, breadcrumb, sub-nav, About/Services/Specialisms/Reviews/Qualifications/Location panels.
- The `Get in touch` card contents.
- Locked pages: homepage, city pages, professions pages, coach shop-front `/c/$slug`, enquire page.

## Open question before I build

The reference keeps `Telford & Surrounding Areas` as the third chip; you said "not sure if we need it." Two options:

- **A. Keep it** as chip #3 (matches reference exactly, tells clients travel radius up front).
- **B. Drop it** and show only two chips (`At Home`, `Online Coaching`) — cleaner, but travel area only appears in the tagline or lower Location panel.

Default is **A** unless you say otherwise on approval.
