# Directory / Search Results page

Build the public directory page at `/find-a-professional` based on `src/mockups/reps_fullpage_directory_search_results_v1.png`. Static high-fidelity Phase 1 screen — no real search backend.

## Route

- New file: `src/routes/find-a-professional.tsx` (matches the existing `<Link to="/find-a-professional">` in the homepage header/featured section).
- `createFileRoute("/find-a-professional")` with `head()` meta: title, description, og:title, og:description, canonical.
- Reuse `PublicHeader` and `PublicFooter`.

## Sections (top to bottom)

1. **Dark search hero band** — black background, three search fields (I'm looking for, Near, Training type) + orange "Find Professionals" button, with "Popular searches" chip row underneath. Same visual language as the homepage search panel, but compact (no headline above).
2. **Results layout** — two columns (`260px | 1fr`) on desktop, stacked on mobile:
   - **Left filter rail** (sticky): Filter results / Clear all, Distance dropdown, Specialism dropdown, Training Type checkboxes (In-person / Online / Both), Availability dropdown, Verified status checkbox (REPs Verified only), Rating (5★ & up, 4★ & up, 3★ & up).
   - **Right results column**: header row "126 professionals found near SW1A 1AA" + Sort by dropdown ("Most relevant"), then 8 horizontal pro cards, then pagination (1 active, 2, 3, 4, 5, …, 13, prev/next chevrons).
3. **Pro card** — horizontal card on warm-white background: square portrait left, name + "REPs Verified" green pill, role, location with distance, star rating (count), in-person/online mode line, three specialism tag chips, orange "View Profile" button + "Save" bookmark below.
4. **"Why trust REPs professionals?" trust band** — 4 icon items (REPs Verified, Reviewed & Rated, Ongoing Standards, Trusted Worldwide).
5. **Testimonial carousel** — single centred quote with avatar + name/location + dot indicators (static).
6. **Footer** via `PublicFooter`.

## Data

Static arrays defined in the route file (no DB, no fetch):
- `directoryPros` — 8 pros matching the mockup (James Wilson, Sophie Taylor, Liam Roberts, Priya Sharma, Daniel Hughes, Emily Carter, Marcus Lee, Hannah Thompson) with role, distance, rating, reviews, mode, 3 tags each.
- Reuse existing portrait assets (`pro-james`, `pro-sophie`, `pro-daniel`, `pro-laura`) and cycle/duplicate for the 8 cards — no new image generation in this step.
- `popularSearches` reused from homepage shape.

## Styling

- Tokens only (`bg-reps-ivory`, `bg-reps-black`, `bg-reps-warm-white`, `text-reps-charcoal`, `text-reps-orange`, `text-reps-green`, `text-reps-gold`, `border-reps-stone`, etc.) — no hardcoded hex.
- Fonts: `font-display` for headings, body inherits Inter.
- Same rounded radii / shadows as the homepage cards.

## Interactivity (visual only)

- All filters, sort, pagination, "Save", and "View Profile" are non-functional in Phase 1 (buttons/inputs render but do nothing). No client state wiring beyond what's needed for hover styles. No router params, no Zod validateSearch yet.

## Out of scope

- Real search/filter logic, URL search params, profile detail route, auth, DB, distance calculation. Those land in later phases once Phase 1 visuals are approved.
