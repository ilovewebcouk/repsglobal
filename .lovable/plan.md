# Next screen: Professional Profile (`/pro/:slug`)

Build the static high-fidelity Professional Profile page to match `src/mockups/reps_fullpage_professional_profile_v1.png` pixel-for-pixel. Phase 1 scope — visual only, no booking logic, DB, or auth.

## Route

- New file: `src/routes/pro.$slug.tsx` → URL `/pro/:slug`
- `createFileRoute("/pro/$slug")` with `head()` setting title/description/og tags derived from the (static) pro
- Component reads `Route.useParams()` for `slug`, looks up a hard-coded pro from a local map keyed by slug, falls back to James Wilson if unknown (Phase 1 — no notFound yet)
- Wire `featuredPros` cards on `/` and `directoryPros` cards on `/find-a-professional` to `<Link to="/pro/$slug" params={{ slug }}>` so the existing flow opens this page

## Page structure (mirrors mock-up, top to bottom)

1. **PublicHeader** (transparent variant over dark band)
2. **Profile hero band** — dark `bg-reps-black`:
   - Left: large rounded portrait `rounded-[24px]`, REPs Verified pill overlay
   - Right: name (font-display, ~48px), role + location row, orange rating row, mode chips (In-person / Online), short bio, primary "Book a session" button (`rounded-[10px] bg-reps-orange`) + secondary "Message" outline button
   - Trust mini-row: years experience, sessions delivered, response time
3. **Sticky in-page sub-nav** (About · Services · Reviews · Availability · Credentials) — `rounded-full` pill bar on ivory
4. **About section** — two-column: long-form bio + side card with quick facts (languages, training style, age groups)
5. **Services & pricing** — 3 service cards `rounded-[18px]` (1:1, 6, 12-session packages) with price, duration, what's included, "Select" button
6. **Specialisms** — chip cloud `rounded-full` of tags
7. **Reviews** — header with aggregate rating + count, 3–4 review cards `rounded-[18px]` with avatar, stars, date, body; "View all reviews" link
8. **Availability** — week strip with morning/afternoon/evening slot pills `rounded-[10px]`, "View full calendar" button
9. **Credentials & verification** — list of qualifications, insurance, DBS, CPD with check icons; REPs Verified callout panel `rounded-[22px]`
10. **Similar professionals** — 3 cards `rounded-[18px]` linking to other `/pro/:slug`
11. **PublicFooter**

## Design compliance (skill: reps-build-compliance)

- Orange only via `bg-reps-orange / -hover / -dark`, `text-reps-orange`, soft/border tokens
- Radii: button 10, input 12, std card 16, profile/service/review/similar cards 18, large panels (about side card, verification callout) 22, hero portrait 24, chips/avatars full — no `rounded-xl/2xl/3xl`, no 14/20/28/32px
- Flat buttons (no shadows), shadows only on cards where the mock-up shows them via `--reps-shadow-card`
- Stars and ratings in `text-reps-orange` (never gold/yellow)
- Use existing `pro-*.jpg` assets for portraits and similar-pros; no new image generation in this turn

## Out of scope (Phase 1)

- Real booking flow, calendar widget logic, message composer, review submission
- Data layer / Supabase / Cloud — all content hard-coded in the route file
- `notFound` handling for unknown slugs (deferred until auth/data lands)
- Analytics, JSON-LD (can layer in after visuals approved)

## Verification

After build: navigate to `/pro/james-wilson` (and verify a click from `/` and `/find-a-professional` lands there), screenshot full page, compare against `src/mockups/reps_fullpage_professional_profile_v1.png`, and run the `reps-build-compliance` audit script.
