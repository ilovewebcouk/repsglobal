## Goal

Replace the current single-page `/auth` with a REPs-native split layout:

- **Left** — sign-in form (email + password, Continue with Google, Apple disabled "coming soon"), REPs wordmark, "Don't have an account? Sign up" → `/auth/sign-up`.
- **Right** — a slightly floating, scaled mock of the live `/c/james-wilson` Pro shop-front. Soft drop shadow, subtle parallax-on-mouse (optional), masked top/bottom fade. This is the "10/10 image" — real product, not a stock photo.
- **New route** — `/auth/sign-up` mirrors the layout: sign-up form on the left (Continue with Google, email + password, role pick: I'm a professional / I'm a client), same shop-front mock on the right, "Already have an account? Sign in" → `/auth`.

Brutal-honest framing carries through: no decorative gradient hero, no stock gym photography, no Apple button that doesn't work (we show "Coming soon" instead of hiding it).

## What stays exactly the same

- All existing auth wiring in `src/routes/auth.tsx` (`signInWithPassword`, `lovable.auth.signInWithOAuth("google")`, error handling, redirect-back via `?redirect=`).
- Role-based landing logic added last turn (`requireRole`, `landingPathForRole`, `/dashboard` bouncer).
- Supabase clients, OAuth provider config, demo accounts.
- All locked Phase 1 screens (homepage, profile, city, coach shop-front, etc.) — untouched.

## What changes

### 1. `src/routes/auth.tsx` (rewrite, same route)

- Two-column layout at `lg:` (single column on mobile — form only, no mock).
- Left column: REPs wordmark top, H1 "Sign in to REPs", lede, Google button, divider, email + password (shadcn `FieldGroup` / `Field` / `Input`), "Forgot password?" link, primary CTA, "Don't have an account? **Sign up**" → `<Link to="/auth/sign-up">`.
- Apple button rendered but `disabled` with a small "Coming soon" badge — no native click handler, no broken flow.
- Right column: `<ShopFrontMock />` — a new component that renders a scaled iframe or a static screenshot of `/c/james-wilson`, masked with top/bottom fade-to-bg, soft `shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]`, ~92% scale, slight `rotate(-1.5deg)` for editorial feel, contained inside a `rounded-[22px]` panel with `border-reps-border/60`.
- Background: dark REPs panel tones, no `HeroOverlay` (auth page is chrome, not a marketing hero).

### 2. `src/routes/auth.sign-up.tsx` (new file)

- Same shell as `/auth`.
- Left: H1 "Create your REPs account", same Google button, role toggle (shadcn `ToggleGroup`: "I'm a professional" / "I'm a client"), email + password + confirm password, T&Cs checkbox, primary CTA → `supabase.auth.signUp` then route to `/auth/check-email` (or just toast + stay) and ultimately into role-based landing after confirm.
- "Already have an account? **Sign in**" → `<Link to="/auth">`.
- Out of scope for this plan: building `/auth/check-email`, password reset flow, and email confirmation customisation — flag these as follow-ups, don't block.

### 3. `src/components/auth/ShopFrontMock.tsx` (new, shared by both routes)

- Renders the floating shop-front visual.
- Implementation: **static screenshot** (PNG via lovable-assets) of `/c/james-wilson`. Iframe was considered and rejected — auth pages must be fast and not pull a second route into the bundle. We'll generate the screenshot once and import it.
- Props: `className?` so the route can tune positioning.

### 4. Memory + lock note

- Add `mem://design/locked-auth` once `/auth` and `/auth/sign-up` are built: locks split layout, shop-front-mock right side, Apple "Coming soon", role-toggle on sign-up, sign-up split to its own route.
- Update `mem://index.md` Core to reflect the new sign-up route alongside `/auth`.

## Out of scope (explicit follow-ups, not this turn)

- Password reset (`/auth/reset-password`) — separate plan.
- Email confirmation landing (`/auth/check-email`).
- Apple OAuth — stays disabled until we wire it.
- Any change to the locked Phase 1 mock-ups.

## Risks / call-outs

- **The shop-front screenshot will need re-generating** any time `/c/james-wilson` visually changes. Acceptable trade-off — that page is locked and rarely changes.
- **On mobile (< lg) the right column is hidden.** Auth forms are tall enough; the mock would compete for attention and double the LCP.
- **No design directions step.** This is a structural rebuild against an existing locked-style system (REPs dark panels + orange + shadcn primitives) — there's no useful "pick a vibe" question. If you want options on the right-side image instead (which shop-front variant, with or without the floating verified card overlay, etc.), say so and I'll branch.

## Files

- Rewrite: `src/routes/auth.tsx`
- New: `src/routes/auth.sign-up.tsx`
- New: `src/components/auth/ShopFrontMock.tsx`
- New asset: `src/assets/auth/shop-front-james.png.asset.json` (generated screenshot)
- Memory: `mem://design/locked-auth` + `mem://index.md` update