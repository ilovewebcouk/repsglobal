# Nav restructure + provider directory + review button

## 1. Top nav (PublicHeader)

New left → right order:

1. **Find a coach** → `/find-a-professional` (plain link, no mega-menu)
2. **Find a training provider** → `/find-a-training-provider` (plain link)
3. **For professionals** → `/for-professionals` (unchanged)
4. **Resources** → `/resources` (unchanged)
5. **About** → `/about` (unchanged)

Changes:
- Retire the "Find a professional" mega-menu (goals / professions / cities columns) in favour of two direct links. The mega-menu content is preserved on the `/find-a-professional` page itself, so nothing is lost.
- Update `HeaderCommandPalette` "Quick actions" to list both directories.
- Update `PublicFooter` "Discover" column to match.
- Mobile sheet: same two entries at the top of the discovery group.

## 2. `/find-a-training-provider` route (new)

Mirror the coach directory layout for consistency:

- File: `src/routes/find-a-training-provider.tsx`
- Reuses the same shell, hero, filter rail, and card grid primitives as `/find-a-professional`, swapped to provider data.
- Data: server fn `listPublicProviders` that reads `professionals` where `account_type = 'organisation'` (published + verified), returning name, slug, logo, city, delivery mode, course count, verified-pros count.
- Cards link to `/t/$slug`.
- Filters (v1): search by name, city, delivery mode (in-person / online / blended). Advanced filters (accreditation, course category) stubbed for a later pass.
- Empty state respected when zero providers match.
- SEO: unique `head()` — title "Find a REPS-verified training provider", description, og:title/description.
- Follows locked marketing tokens (radii, emerald-for-status only, no hardcoded colors, shared marketing primitives).

## 3. `/t/$slug` header buttons

- Replace the secondary **Save profile** button with **Write a review** (Star icon), routed to `/t/$slug/review` (route already exists).
- Save profile action removed from this page entirely — it can return later as an account feature.
- Primary **Enquire now** button unchanged.
- No other layout changes to the profile page.

## 4. Files touched

- `src/components/public/PublicHeader.tsx` — nav items + mega-menu removal
- `src/components/public/HeaderCommandPalette.tsx` — Quick actions
- `src/components/public/PublicFooter.tsx` — Discover column
- `src/components/public/nav-config.ts` — trim unused mega-menu exports if now dead
- `src/routes/find-a-training-provider.tsx` — new route
- `src/lib/directory/providers.functions.ts` — new `listPublicProviders` server fn (public read via publishable Data API client, RLS-safe)
- `src/routes/t.$slug.index.tsx` — swap header button to Write a review linking to `/t/$slug/review`

## 5. Out of scope

- No changes to `/find-a-professional` internals.
- No new tables; providers already exist as `professionals` rows with `account_type = 'organisation'`.
- No changes to `/c/$slug` (locked) or other locked marketing pages.
- Save-to-account functionality is deferred; only the button on `/t/$slug` is removed.

## 6. Verification

- `tsgo --noEmit` for typecheck.
- `scripts/check-nav-links.mjs` to confirm every nav `to=` resolves to a real route (both new link and coach link).
- Manual smoke: visit `/`, open nav, navigate to `/find-a-training-provider` and `/find-a-professional`, confirm command palette + footer updated, confirm `/t/$slug` shows Write a review and routes to `/t/$slug/review`.
