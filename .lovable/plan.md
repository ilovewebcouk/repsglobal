## QA findings on `/admin/professionals`

1. **"Unnamed" + missing avatars (rendering bug, not data).** All 402 professionals show "Unnamed" and the "UN" initials fallback, even for rows whose `profiles.full_name` is populated. Cause: `listAdminProfessionals` over-fetches up to 1000 professionals and then calls `supabase.from('profiles').select(...).in('id', ids)` with all of them in a single request. With ~400+ UUIDs the URL exceeds the edge worker limit and the request fails silently — `profilesRes.data` comes back null, so every row falls through to `'Unnamed'` and `avatarUrl: null`. The same bug silently kills `subscriptions`, `reviews`, and `coach_client` enrichment (Plan / MRR / Rating / Clients all read as `Free` / `—` / `0`).

2. **"Joined" column uses REPs import date for BD members.** It currently reads `professionals.created_at`, which is the date we seeded the BD member into REPs (Jun 2026 for everyone). It should use the same `member_since` we backfilled — BD signup date for imported pros, REPs sign-up date for new pros.

## Plan

### `src/lib/admin/professionals.functions.ts`

1. **Add chunked-`in()` helper.** Run the four enrichment queries (`profiles`, `subscriptions`, `reviews`, `coach_client`) in batches of 200 ids and concatenate results. Keeps URL length under the edge worker limit.
2. **Treat empty/null enrichment data as an error.** Throw if `profilesRes.error` is set instead of silently producing "Unnamed" rows.
3. **Select `member_since`** on the `professionals` query, and use it for the `joined` field returned to the UI. Fall back to `created_at` when null (defence in depth — the trigger guarantees it on insert).
4. **Use `member_since` for the server-side `order(...)`** that drives the FETCH_CAP window so the "Joined desc" sort returns the right slice.

### `src/routes/admin_.professionals.tsx`

No change — it already renders `joinedLabel(row.joined)` and `row.name` / `row.avatarUrl`.

### No migration needed

`member_since` already exists on `professionals` and was backfilled from `bd_member_seed.legacy_signup_at`.

## Out of scope

- Adding a separate "REPs since" column.
- Touching the KPI tiles ("New signups (30d)" still uses created_at — fine, that's the import event).
- Other admin tables.
