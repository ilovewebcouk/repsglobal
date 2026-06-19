## Product rule
**Invited ≠ joined.** A row only appears in the professionals/member surfaces after the user has accepted their invite and confirmed signup (`auth.users.email_confirmed_at IS NOT NULL`).

Verified in DB: of 402 professional rows, exactly 1 (Scott ProFounding) has `email_confirmed_at IS NULL`. All BD-imported pros are confirmed, so this filter is safe.

## This pass — immediate fix

### 1. Migration — add `get_confirmed_professional_ids`
```sql
CREATE OR REPLACE FUNCTION public.get_confirmed_professional_ids(_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id FROM auth.users u
  WHERE u.id = ANY(_ids) AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION public.get_confirmed_professional_ids(uuid[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmed_professional_ids(uuid[]) TO service_role;
```

Also add a sibling helper used by the KPI counts:
```sql
CREATE OR REPLACE FUNCTION public.count_confirmed_professionals(_only_published boolean DEFAULT false, _verification text DEFAULT NULL)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT count(*)::int
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.id AND u.email_confirmed_at IS NOT NULL
  WHERE (_only_published IS FALSE OR p.is_published = true)
    AND (_verification IS NULL OR p.verification::text = _verification)
$$;

REVOKE EXECUTE ON FUNCTION public.count_confirmed_professionals(boolean, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_confirmed_professionals(boolean, text) TO service_role;
```

### 2. `src/lib/admin/professionals.functions.ts`

**`listAdminProfessionals`** — after the initial `professionals` query returns ids, call:
```ts
const { data: confirmed } = await supabaseAdmin
  .rpc('get_confirmed_professional_ids', { _ids: ids });
const confirmedSet = new Set((confirmed ?? []).map((r: { id?: string } | string) =>
  typeof r === 'string' ? r : r));
const filteredIds = ids.filter(id => confirmedSet.has(id));
```
Filter `pros` down to `filteredIds` before the chunked join/aggregation fetches. The `total` count returned to the client becomes `filteredIds.length` (since the unconfirmed slice is tiny, this is honest enough; the `count: 'exact'` from the original Supabase query is replaced).

**`getAdminProfessionalsKpis`** — replace the four `count: 'exact'` queries that target `professionals` with `rpc('count_confirmed_professionals', ...)` calls:
- Active = `count_confirmed_professionals(true, null)`
- Verified = `count_confirmed_professionals(true, 'verified')`
- Signups 30d / prev 30d → run a small RPC variant or fold into a single RPC that accepts `_since` / `_until`; simplest: add a third helper `count_confirmed_pro_signups(_since timestamptz, _until timestamptz)` that joins on `auth.users.email_confirmed_at IS NOT NULL` and filters by `member_since` (matching the existing list sort order).

Reviews/avg-rating untouched.

### 3. Tab/filter behaviour
The `"pending"`, `"flagged"`, `"suspended"`, `"recent"` tabs all run through the same filtered id list, so unconfirmed shells disappear from every tab — not just "All".

## Out of scope for this pass
- Do NOT change `sendProfessionalInvite` yet. Supabase still creates the auth user shell; we just hide it.
- Do NOT delete existing invited auth users (Scott stays in `auth.users` so his invite link still works).
- No changes to public profile pages, directory queries, billing, Stripe, or verification flows. Public surfaces already filter on `is_published`, which unconfirmed shells don't satisfy in practice — but we won't touch that code.
- No new "Pending invites" tab in this pass.

## Longer-term invite flow (documented, not implemented this pass)
Replace Supabase `generateLink({ type: 'invite' })` with a REPs-native invite table:

```text
public.professional_invites
  id uuid pk
  email citext not null
  invited_by uuid not null references auth.users(id)
  token_hash text not null unique
  status invite_status not null default 'sent'  -- sent|accepted|expired|cancelled
  created_at, expires_at, accepted_at timestamptz
```

Invite email links to `/auth/accept-invite?token=...`. The auth.users row, profile, professional row, role grant, and any membership/billing rows are created **only** inside `accept_professional_invite(_token)` after the invitee completes signup. `handle_new_user` continues to work because it fires on the new auth.users row created at acceptance time.

This unblocks proper invite analytics (sent / opened / accepted / expired) and removes the "phantom member" failure mode at its source. Tracked as a follow-up — not in this pass.

## Memory
Add to `mem://index.md` Core:
> Invited ≠ joined. Admin invites must not create member-visible rows. `/admin/professionals` and KPI counts filter on `auth.users.email_confirmed_at IS NOT NULL`. Long-term: replace Supabase invite links with `professional_invites` table that only creates auth.users on acceptance.