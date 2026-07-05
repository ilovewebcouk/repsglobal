## What's actually happening

That UUID `3d8ffa68-f4b2-46b2-bdac-d06b48fbf445` **is** you — `cruz.pt@icloud.com` (admin + professional + has profile). Nothing in the finder filters admins out:

- `ops_find_member` (Postgres RPC): UUID branch just does `WHERE u.id = q::uuid` against `auth.users`. No role filter. Tested — it returns the row.
- `findMember` server fn: passes the string through, admin-gated only for who can call it.
- `MemberFinder` component: on a single match, navigates straight to `/admin/members/$userId` (route exists).

So "No matches" almost certainly means the string sent to the RPC didn't match the UUID regex `^[0-9a-f]{8}-[0-9a-f]{4}-…{12}$` — i.e. the paste from Google Analytics included something extra (a label like `User ID`, quotes, a trailing tab/newline, a zero-width space, or GA's `.` separators). Client-side we only `trim()`, so anything else breaks the branch and it falls through to the "partial name" search, which returns nothing.

## Fix

Make the top-bar finder resilient to noisy pastes. One small change to `src/components/ops/MemberFinder.tsx`:

Before calling `find({ data: { q: v } })`, normalise `v`:

1. Strip zero-width chars, wrapping quotes, and surrounding whitespace.
2. Try to **extract** an embedded UUID with a regex — if the pasted blob contains a UUID anywhere in it, use just the UUID.
3. Also extract embedded `cus_…` / `sub_…` handles the same way.
4. Fall back to the raw trimmed string otherwise.

```ts
function normaliseQuery(raw: string): string {
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/^["'`\s]+|["'`\s]+$/g, "");
  const uuid = cleaned.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0].toLowerCase();
  const stripe = cleaned.match(/\b(cus|sub)_[A-Za-z0-9]+/);
  if (stripe) return stripe[0];
  return cleaned;
}
```

Use it in both `go()` and the `onChange` isn't touched — user still sees what they pasted, we just send the cleaned value.

## Also update the empty-state toast

`toast.info("No matches")` gives no clue why. Change it to `"No matches for '<sent query>'"` so next time you can see exactly what got sent to the DB — makes future "why didn't this find X" trivial to diagnose.

## What this does NOT change

- No RPC changes, no schema changes, no admin filter (there isn't one).
- Compose-dialog recipient search is a different code path (only returns rows that exist in `professionals`) — out of scope for this fix.
- If GA is actually giving you a Google Analytics *client ID* (format `1234567890.1234567890`), that's not a Supabase user_id and no search can find it. This fix only helps when GA has captured our real `user_id`.

## Files touched

- `src/components/ops/MemberFinder.tsx` — add `normaliseQuery`, call it in `go()`, expand the toast message.
