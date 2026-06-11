# 09 — Phase 2.0 Verified tier (wiring scope)

> **Snapshot date:** 11 June 2026
> **Scope:** Ship a thin, end-to-end revenue loop for the **Verified** tier (£99/yr) **and** the **Pro Founding** tier (£59/mo). Studio stays as a waitlist card.
> **Out of scope:** Studio activation, shop-front editor, bookings, AI features, real messaging, calendar sync, client portal data, real search/filter, BD migration, `/c/$slug` DB wiring, dynamic SEO at scale.

Phase 1 visuals are locked. This document drives Phase 2.0. Pre-build decisions that govern this wiring live in `docs/10_billing_phase0_decisions.md`.

## Goal

One paying Verified or Pro professional can:

1. Sign up at `/auth` (email/password, Google, or Apple)
2. Land on `/dashboard/start` (3-step onboarding: pick tier → pay → submit credentials)
3. Pay via Stripe Checkout
4. Upload qualification documents to a private bucket
5. Get reviewed by an admin at `/admin/verification`
6. Once approved, appear on the public site at `/pro/$slug` (DB-backed) and in `/find-a-professional`
7. Renew automatically; admin can downgrade if subscription ends

## Stripe products (live)

| Tier | Price ID | Product ID | Amount | Interval |
|---|---|---|---|---|
| Verified | `price_1Th5cVAP31Yc4cJjRclKEfCH` | `prod_UgSXqMrfMGNrKW` | £99 | year |
| Pro (Founding, monthly) | `price_1Th5cVAP31Yc4cJj4VPiaXeH` | `prod_UgSXQ2CckI9BzA` | £59 | month |
| Pro (Founding, annual) | `price_1Th8U8AP31Yc4cJjLhq9Yhvf` | `prod_UgSXQ2CckI9BzA` | £590 | year |
| Studio | — | — | — | Waitlist only |

All defined in `src/lib/billing.ts`.

## Data model (already in DB)

- `professionals` — `slug`, `headline`, `bio`, `city`, `country`, `specialisms[]`, `verification_status` enum (`pending|verified|rejected|suspended`), `is_published`, `cert_uploaded_at`, `hourly_rate_pence`, `reps_level` enum (Level_2..5), `online_available`, `in_person_available`, `dbs_valid_until`, `insurance_valid_until`, `verification_grace_until`.
- `subscriptions` — `tier` (`free|pro|verified|studio`), `billing_period`, `status` (Stripe enum), `stripe_*` IDs, `current_period_end`, `cancel_at_period_end`, `is_founding`.
- `user_roles` — RBAC. Roles: `admin`, `professional`, `client`.
- `verification_submissions` *(new in Phase 2.0)* — `professional_id`, `awarding_body`, `qualification`, `year`, `doc_paths[]`, `status` (`submitted|approved|rejected|changes_requested`), `admin_note`, `reviewed_by`, `reviewed_at`.

## Storage

- Bucket `verification-docs` (private). Files saved as `{user_id}/{filename}`.
- RLS: pro CRUDs own folder; admin reads all.

## Admin seed

The email `pros@repsuk.org` is auto-granted the `admin` role on next sign-up (handled by an idempotent block in the migration). Migrate this list with care.

## Auth surface

- Provider config: email/password + Google (Lovable-managed) + Apple (Lovable-managed). Configured via `supabase--configure_social_auth`.
- Sign-in route: `/auth` (renamed from `/login` in week 1).
- Auth gate: `src/routes/_authenticated/route.tsx` (integration-managed, `ssr: false`, redirects unauthenticated users to `/auth`).
- Admin gate: nested `_authenticated/_admin/` layout calling `has_role('admin')` via `requireSupabaseAuth` middleware.

## Execution status

| Week | Scope | Status |
|---|---|---|
| 1 | Auth gate + `/auth` rename + signup/login wired + checkout + `/dashboard/start` | Shipped |
| 2 | Credential upload + admin review queue + approve/reject | Shipped |
| 3 | Editable professional profile + live `/pro/$slug` from DB | Shipped |
| 4 | Real Verified dashboard foundation + onboarding dialog + Pro preview locks | Shipped |
| 5 | Directory data, renewal QA and individual Pro module wiring | In progress / Phase 2.1+ |

## Visual rule

**No locked screen changes.** Phase 1 mock-ups stay pixel-identical. Where a dashboard tab isn't wired yet, show its existing static state with an "Available after verification" banner if it would mislead.

## Outstanding for Phase 2.1+

- Studio tier activation (multi-seat, facility records).
- Shop-front editor for Pro/Studio (`/c/$slug` DB wiring).
- Real bookings + payments to pros.
- AI features (programme generation, chat, summarisation).
- Real client portal data.
- BD (REPsUK.org) data migration.
- Real search/filter on `/find-a-professional`, `/in/$location`, `/professions/$profession`.
- Per-competitor `/compare/$competitor` routes.
