# Phase 2.0 — Verified tier, end to end

## Goal

One paying Verified professional can: sign up → pay £99 → upload credentials → get approved by an admin → appear on the public site with a real `/pro/$slug` profile they control from `/dashboard/profile`. Nothing more.

Pro and Studio tiers, bookings, AI, real directory search, shop-front data, and BD migration stay deferred. Tier 1 is the wedge.

## Why this slice (and not "all of Phase 2")

- Verified is the only tier that doesn't depend on the shop-front, bookings, or AI being real — so it's the smallest honest revenue loop.
- It forces the structural work you can't dodge (auth gate, role-based routing, public-profile DB reads, Stripe webhook, admin review queue). Doing that once for one tier is cheap; doing it three times in parallel is not.
- Every shipped visual stays visually identical. We're wiring, not redesigning.

## Scope — what ships

### 1. Auth & route gating (the unavoidable plumbing)
- Create `src/routes/_authenticated/route.tsx` (integration-managed pattern: `ssr: false`, redirect to `/auth` aka `/login`).
- Move under it: `dashboard.tsx` + all `dashboard_.*.tsx`, `portal.tsx` + all `portal_.*.tsx`, `admin.tsx` + all `admin_.*.tsx`.
- Add a nested `_authenticated/_admin/` pathless layout gating admin routes via `has_role('admin')`.
- Wire `signup`, `login`, `forgot-password`, `reset-password`, `verify-email`, `accept-invite` to real Supabase auth calls. Google sign-in via the Lovable broker, email/password as fallback.
- Root `__root.tsx` gets the single `onAuthStateChange` listener (filtered, no thrashing).
- `attachSupabaseAuth` registered in `src/start.ts`.

### 2. Pro signup → Verified checkout
- `/signup` "Fitness Professional" path: creates `auth.users` row → trigger creates `profiles` + `user_roles('professional')` + `professionals` row (already exists, verify).
- Post-signup lands on a new `/dashboard/start` onboarding screen (single page, 3 steps: choose tier, pay, submit credentials).
- "Choose tier" only offers Verified (£99/yr) live. Pro and Studio cards show "Coming soon — join waitlist".
- Stripe Checkout (server fn): creates a Customer, subscribes them to the £99/yr Verified price, returns hosted checkout URL. Success URL → `/dashboard/start?step=verify`.
- Stripe webhook (`/api/public/webhooks/stripe`) updates `subscriptions` row, sets `professionals.tier = 'verified'`, status `pending_review`.

### 3. Credential submission
- Step 3 of onboarding: upload qualification documents (PDF/JPG/PNG to a new private Supabase Storage bucket `verification-docs`), enter awarding body + qualification name + year.
- Inserts a row into a new `verification_submissions` table (status `submitted`).
- After submit, dashboard shows "Under review — usually 1-2 working days" state. All other dashboard tabs visible but read-only / empty-state until approved.

### 4. Admin review
- `/admin/verification` (already exists as static visual) gets wired: lists submissions, document viewer, approve/reject buttons with note field.
- Approve → flips `professionals.verified_at = now()`, `verified_status = 'verified'`, sets `published = true`. Triggers a "you're live" email via existing email infra.
- Reject → status `changes_requested` + admin note; email back to pro.

### 5. Editable profile + live public page
- `/dashboard/profile` becomes a real form (name, headline, bio, city, photo, specialisms, services, qualifications). Writes to `professionals`.
- `/pro/$slug` (public, SSR, top-level) reads from DB via a public server fn using `supabaseAdmin` with explicit safe-column projection. If `published = false`, return `notFound()`. Slug derived from `professionals.slug` (add column if missing).
- `/find-a-professional` directory: still static *layout*, but the card list is replaced with a server-fn read of published verified pros (no filters yet — pagination only).
- City and profession landing pages: leave static for now (Phase 2.1).

### 6. Renewals
- Stripe webhook handles `invoice.paid` (extend `current_period_end`), `customer.subscription.deleted` (set `published = false`, downgrade tier). 30-day-before renewal email via existing queue.

## Out of scope (explicitly deferred to Phase 2.1+)

- Pro / Studio tier activation, shop-front editor, bookings, payments to pros, AI features, messaging, calendar sync, client portal data, real search/filter, BD migration, `/c/$slug` DB wiring, per-profession/per-city dynamic SEO at scale.

## Database changes (one migration)

- `professionals`: add `slug TEXT UNIQUE`, `published BOOLEAN DEFAULT false`, `tier TEXT`, `verified_status TEXT`, `verified_at TIMESTAMPTZ`, `headline`, `bio`, `city`, `photo_url`, `specialisms TEXT[]`. (Audit what's already there first — some may exist.)
- New `verification_submissions` (professional_id FK, awarding_body, qualification, year, doc_paths TEXT[], status, admin_note, created_at, reviewed_at, reviewed_by).
- New private storage bucket `verification-docs` with RLS: pro reads own, admin reads all.
- RLS + GRANTs on every new/changed table per the public-schema grant rule. Public read on `professionals` limited via server fn + safe-column projection — no broad `TO anon` policy.

## Technical notes

- Stripe: use Lovable's built-in Stripe payments integration (already enabled — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` are present). Create the Verified £99/yr product/price via `create_stripe_product_and_price`.
- All app-internal server logic = `createServerFn` from `@tanstack/react-start`. Stripe webhook = `src/routes/api/public/webhooks/stripe.ts` with HMAC signature verification.
- `supabaseAdmin` is loaded inside handlers via `await import(...)`, never at module scope of `.functions.ts`.
- Public profile route stays top-level (SSR on, loader-fed `head()` for OG tags). Never under `_authenticated/`.
- No visual changes to any locked screen. Dashboard tabs that aren't wired show their existing static state but with an "Available after verification" banner where appropriate.

## Execution order (so the user sees progress weekly)

```text
Week 1  Auth gate + signup/login wired + Stripe checkout for Verified
Week 2  Credential upload + admin review queue + approve/reject + emails
Week 3  Editable /dashboard/profile + live public /pro/$slug from DB
Week 4  Directory pulls real verified pros + renewal webhooks + QA pass
```

Each week is independently shippable — Verified pros could pay in week 1 even if review isn't built (manual approval via SQL).

## Doc + GitHub housekeeping (do first, same turn as week 1)

- Update `docs/07_phase1_build_status.md`: mark Phase 1 closed, add "Phase 2.0 — Verified tier" section with this scope.
- Create `docs/09_phase2_verified.md` from this plan as the single source of truth.
- Lock memory: add `mem://phase/2.0-verified-scope` so future sessions don't drift into Pro/Studio wiring.
- GitHub sync is automatic via the Lovable ↔ GitHub bidirectional bridge — no manual push needed; the doc + memory commits land on `main` as soon as week 1 lands.

## What I need from you before week 1 starts

1. Confirm Verified is genuinely £99/year (not /month) and that's the only tier going live.
2. Confirm `/auth` vs `/login` — the integration-managed gate redirects to `/auth`; we currently have `/login`. Rename, or add an `/auth` route that mirrors `/login`?
3. Admin seed: which email should be granted `admin` role first so you can approve submissions?
4. OK to ship with email/password + Google as the only sign-in methods?
