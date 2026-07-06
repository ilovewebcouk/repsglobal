## Goal
Split training-provider websites off from the trainer template. Providers render at `/t/$slug`; trainers stay on `/c/$slug` and go back to their pre-provider copy.

## Scope
Provider demo slugs (from seed migration, `account_type = 'organisation'`):
- `northline-fitness-academy`
- `forge-strength-institute`

Everything else (`jordon-gumbley`, `james-wilson`, all `individual` accounts) stays on `/c/$slug` and is not touched.

## Steps

**1. Revert trainer-side changes**
- `src/routes/c.$slug.index.tsx` line 970: `View courses` → back to `See plans & pricing`.
- No other reverts needed — the earlier logo uploads (`src/assets/diverse-logo.*`, `origym-logo.*`) were never wired into any component, so they're inert. Leave them for reuse on `/t/`.

**2. Fork the route to `/t/$slug`**
Copy the three coach route files as-is, only changing the `createFileRoute` path:
- `c.$slug.tsx` → `t.$slug.tsx` (`/t/$slug`)
- `c.$slug.index.tsx` → `t.$slug.index.tsx` (`/t/$slug/`)
- `c.$slug.enquire.tsx` → `t.$slug.enquire.tsx` (`/t/$slug/enquire`)
- `c.$slug.review.tsx` → `t.$slug.review.tsx` (`/t/$slug/review`)

Inside the copies, retarget every internal `<Link to="/c/$slug/…">` and `useNavigate({ to: "/c/…" })` to `/t/…`. Keep loader, data shape, and layout identical for now — this is a pure fork so we can diverge freely without touching trainer pages.

**3. Redirect providers from `/c/` to `/t/`**
In `c.$slug.tsx` (layout route), after the loader resolves the professional, if `account_type === 'organisation'` throw a `redirect({ to: '/t/$slug', params: { slug } })`. This future-proofs any old provider link (email, social, cached) and guarantees providers can only ever be seen on `/t/`.

**4. Point demo/internal links at `/t/`**
Search for hard-coded `/c/northline-fitness-academy` and `/c/forge-strength-institute` references (admin demo lists, docs, seed READMEs) and switch them to `/t/…`. The `getWebsiteBySlug` loader itself is slug-based and doesn't need to change.

**5. Diverge on `/t/` (next turn, not this plan)**
Once the fork is live, the provider-specific edits we discussed — logo upload replacing the Verified/Insured/Location badge row, name-only eyebrow, editable H1, "View courses" CTA, courses-first section order — all happen only in `t.$slug.index.tsx`. Trainer pages stay locked to the current design.

## Technical notes
- Route path convention: filenames use dots (`t.$slug.index.tsx`), `createFileRoute` strings use slashes (`/t/$slug/`). `routeTree.gen.ts` is auto-generated — don't touch.
- The layout redirect uses `throw redirect(...)` from `@tanstack/react-router` inside `beforeLoad` (runs before render, avoids a flash of the trainer page).
- `head()` metadata on `/t/` stays noindex for now (matches `/c/` fixture behaviour) since these are demo pages.
- No DB migration needed — `account_type` already distinguishes org vs individual.

## Out of scope
- Any visual redesign of the provider page. This plan only relocates it.
- Changes to `/c/` beyond the one-line CTA revert.
- Renaming, removing, or reseeding demo data.