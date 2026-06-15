## Slice 6 — Converted lead lands on the clients roster

Right now `convert_lead_to_client` (Slice 5) creates a `clients` row and a `coach_client` link, but the existing `/dashboard/clients` page reads from `client_roster`. So a freshly converted lead disappears from leads but never shows up in the clients list. Close that gap by upserting a roster row inside the conversion RPC, and make the "View client" link from the lead sheet jump to that row.

### Migration
Update `public.convert_lead_to_client(_enquiry_id uuid)` to additionally upsert into `client_roster`:

```
INSERT INTO public.client_roster (
  professional_id, email, full_name,
  status, client_id, auth_user_id,
  confirmed_at, activated_at
)
VALUES (
  v_uid,
  lower(v_enquiry.sender_email),
  v_enquiry.sender_name,
  'active'::roster_status,
  v_enquiry.sender_user_id,
  v_enquiry.sender_user_id,
  now(),
  now()
)
ON CONFLICT (professional_id, lower(email))
DO UPDATE SET
  status        = 'active'::roster_status,
  client_id     = EXCLUDED.client_id,
  auth_user_id  = EXCLUDED.auth_user_id,
  full_name     = COALESCE(client_roster.full_name, EXCLUDED.full_name),
  activated_at  = COALESCE(client_roster.activated_at, now()),
  archived_at   = NULL,
  updated_at    = now()
RETURNING id INTO v_roster_id;
```

Function still returns the client uuid (so the existing TS types regen safely). No new GRANTs needed (RPC already executable; the function runs as `postgres` under `SECURITY DEFINER`, so the roster RLS tier check is bypassed — intentional, conversion is gated by the enquiry-owner check earlier in the function).

### UI
- `src/components/leads/LeadDetailSheet.tsx` — the existing "Converted to client" emerald row's "View client" link currently points at `/dashboard/clients`. Keep it pointing there (the roster page is the destination) but change the label to "Open in clients" for clarity. No new route required.
- No changes to `LeadActivityTab` (the `converted` row already renders).
- No changes to the clients page itself — the new roster row will appear automatically because `listRoster` already powers that table.

### Edge cases
- If the lead is converted, then later the Pro archives the roster row, then re-runs conversion (only possible if someone manually un-converts — out of scope for now): the upsert flips it back to `active` and clears `archived_at`. Acceptable.
- Existing roster row for the same email (e.g. Pro added them manually earlier): the upsert links `client_id`/`auth_user_id` and forces status to `active`. Their manual notes are preserved.
- Anonymous enquiries (sender_user_id null) still fail with the existing friendly error before reaching the roster insert.

### Files
- migration: replace `public.convert_lead_to_client` body (additive — extra upsert + roster_id local var).
- edit `src/components/leads/LeadDetailSheet.tsx` (link label only).

### Out of scope
- Dedicated `/dashboard/clients/$clientId` detail wired to coach_client data (existing `dashboard_.clients.$slug.tsx` reads from roster slug — fine as-is).
- Backfilling roster rows for any leads converted before this migration.
- Surfacing "originated from lead" badge on the clients table.
