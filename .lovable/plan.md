## Goal

On the public training-provider page `/t/$slug`, replace the hardcoded `"—"` in the About card's "Learners trained" stat (line 464 of `src/routes/t.$slug.index.tsx`) with a live count of certificates the provider has issued.

## Definition of "Learners trained"

Count rows in `certificate_registrations` where:
- `provider_id = <this provider>`
- `status = 'issued'`

This is the count of certificates the provider has actually issued to learners (one row per learner-per-course). It excludes draft/paid-but-not-yet-issued rows and refunded/void rows.

If we later want unique learners instead of certificates, we can swap the RPC to `count(distinct learner_id)` — flag this as a small follow-up decision, not a blocker.

## Changes

### 1. Migration — public counter RPC

Add a SECURITY DEFINER function that anyone (including `anon`) can call, so the public page can read the number without exposing the underlying rows:

```sql
create or replace function public.count_provider_issued_certificates(_provider_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.certificate_registrations
  where provider_id = _provider_id
    and status = 'issued'
$$;

grant execute on function public.count_provider_issued_certificates(uuid) to anon, authenticated;
```

No table policies change; `certificate_registrations` stays locked down.

### 2. Public server function

Add `getPublicProviderIssuedCertificateCount` in a new small file (e.g. `src/lib/providers/public-stats.functions.ts`) that:
- Uses the server publishable client (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, no session).
- Zod-validates `{ providerId: string (uuid) }`.
- Calls `supabase.rpc("count_provider_issued_certificates", { _provider_id: providerId })`.
- Returns `{ count: number }` (0 on error, never throws to the page).

### 3. Wire into the profile page

In `src/routes/t.$slug.index.tsx`:
- Add a `useQuery` next to the existing `public-provider-quals` query, keyed on `["public-provider-cert-count", sf.professional_id]`, enabled only when `sf.professional_id` is present. Stale 60s.
- Replace line 464:

  ```tsx
  <StatTile
    label="Learners trained"
    value={certCount != null && certCount > 0 ? formatCompact(certCount) : "—"}
  />
  ```

  `formatCompact` = small local helper: `< 1000` → plain number, `>= 1000` → `1.2k` style. Keeps the tile from looking odd for large providers.
- Leave the dash for providers with 0 issued certificates so it doesn't advertise "0 learners".

### 4. No changes to

- Loader / SSR: count is fetched client-side so the initial paint stays fast and the loader stays cheap. SEO isn't affected — the number isn't in metadata.
- Any other stat tile, RLS policy, or admin surface.

## Verification

- Build passes.
- On `/t/test-profile`: tile shows the real count if any `certificate_registrations` rows exist with that provider_id + `status='issued'`, otherwise `—`.
- Spot-check with `psql`: `select count(*) from certificate_registrations where provider_id = '<id>' and status='issued'` matches the tile.
