# Swap homepage Featured cards to shared `FeaturedProCard`

Replace the bespoke dark Featured-Pro card on `/` with the shared `FeaturedProCard` already used on `/professions/$profession` and `/in/$location`, so all three surfaces render the exact same card.

This is the explicit, section-named exception to the locked-homepage rule.

## Change (single file: `src/routes/index.tsx`)

Featured Professionals section only — header, eyebrow, "View all", and prev/next chevrons stay untouched.

1. Import `FeaturedProCard` and type `FeaturedPro` from `@/components/public/FeaturedProCard`.
2. Delete the inline `<Link>…dark card markup…</Link>` block (image + gradient + Verified pill + name/role/rating/mode rows currently inlined in the `featuredCards.map`).
3. Render `<FeaturedProCard pro={…} />` per row instead. Mapping `HomeFeaturedCard` → `FeaturedPro`:
   - `name`, `role`, `rating`, `reviews`, `image` → pass through
   - `location` → `city`
   - `mode` narrowed to `"In-person" | "Online" | "In-person & Online"`
   - `tags: []` (homepage rows don't carry specialism tags; the chip row collapses cleanly)
   - `identityStatus: "approved"`, `verification: "verified"`, `tier: "verified"` (these are featured/verified pros — produces the emerald REPs Verified pill)
4. Keep the existing responsive container: horizontal snap on mobile, `sm:grid-cols-2`, `lg:grid-cols-4`. `FeaturedProCard` is `h-full` so the grid stays even.
5. Remove now-unused imports if no other in-file usage remains (`BadgeCheck`, the inline `shadow-[var(--reps-shadow-card)]` markup, the local slug-derive — `FeaturedProCard` handles `/pro/$slug` linking internally).

No backend, schema, copy, or other-route changes.

## Verification

- `/` Featured rail visually matches `/professions/personal-trainer` and `/in/london` (cream surface, emerald Verified pill, Save bookmark, MapPin + mode row, full-width orange "View Profile" CTA).
- Build passes; no unused-import warnings.
- Mobile snap-scroll, `sm` 2-col, `lg` 4-col layouts all still render correctly.
