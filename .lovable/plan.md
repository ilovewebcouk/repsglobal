## Goal
Tighten the "Recently joined professionals" rail: square photos, true signup ordering, and fix the card-height jitter caused by long names / long cities.

## Changes

### 1. `src/components/public/NewestCoachCard.tsx`
- Photo well: `aspect-[4/5]` → `aspect-square`.
- Name: add `line-clamp-1` (was untruncated, breaks baseline on multi-word names like "Isabelle Natalia Elizabeth Hamilton-Bower").
- City in meta row: keep the existing `shortCity` split on `,&` but also truncate to a single line with `truncate` + `max-w-[10ch]` fallback so "Stevenage and Welwyn Garden City" and "Johnstone North" stop wrapping to two lines.
- No change to Verified / New member pill, rating chip, or role line (per your answers: fallback stays, no joined-date signal).

### 2. `src/lib/directory/newest.functions.ts` — order by real signup date
- After fetching the professionals pool, also fetch `auth.users.created_at` for the same ids via `supabaseAdmin.auth.admin.listUsers` is not viable at scale, so use a dedicated read: `supabaseAdmin.from("profiles").select("id, full_name, avatar_url, created_at").in("id", ids)` — `profiles.id` mirrors `auth.users.id` and `profiles.created_at` is written at signup by the standard handle_new_user trigger, making it the correct "member since" proxy without leaving the public schema.
- Sort the assembled `rows` by that `created_at` descending before applying `data.limit`.
- Widen the initial `professionals` pull from 120 → 200 so the resort has enough candidates to pick a truly-newest 16 after the avatar filter.

If `profiles.created_at` is missing on any row (older accounts pre-trigger), fall back to `professionals.created_at` for that row so ordering stays deterministic.

## Out of scope
- Homepage section header, grid, spacing — unchanged.
- Verified logic and pill styling — unchanged.
- Rating chip presence / placement — unchanged.
- Role fallback ("Fitness Professional") — unchanged, per your call.
- Any other homepage section, `/c/$slug`, or admin surface.

## Technical notes
- No new dependencies, no schema migration, no auth.* schema access.
- `profiles.created_at` is already granted to service_role via the standard project setup; no GRANT changes needed.
