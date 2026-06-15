## Slice 5 — Convert lead to client (Pro)

Close the lead → client loop. From an open lead, a Pro can convert the enquiry into an active client relationship in one click. Stage moves to `won`, `enquiries.converted_client_id` is set, a `coach_client` link is created, and the action is logged into `lead_activity` so it shows in the Activity tab.

### Requirement / constraint
`public.clients.id` is FK to `auth.users(id)`. A lead can only be converted when the enquirer is a signed-in REPs user (`enquiries.sender_user_id IS NOT NULL`). Anonymous enquiries get a disabled button with the tooltip "Client needs a REPs account — send them a sign-up link first." (No invite flow yet — out of scope.)

`clients` RLS does not allow a Pro to insert a row for someone else, so conversion runs through a `SECURITY DEFINER` RPC.

### Migration
New function `public.convert_lead_to_client(_enquiry_id uuid)` returns `uuid` (client id), `SECURITY DEFINER`, `set search_path = public`:
1. Load enquiry; raise if not found.
2. Assert `enquiry.professional_id = auth.uid()` (else raise `insufficient_privilege`).
3. Assert `sender_user_id IS NOT NULL` (else raise with friendly message).
4. `INSERT INTO clients (id) VALUES (sender_user_id) ON CONFLICT (id) DO NOTHING`.
5. `INSERT INTO coach_client (professional_id, client_id) VALUES (...) ON CONFLICT DO UPDATE SET status='active', ended_at=NULL`.
6. `UPDATE enquiries SET converted_client_id = sender_user_id, stage='won', updated_at=now() WHERE id = _enquiry_id`.
7. `INSERT INTO lead_activity (enquiry_id, type, payload, created_by) VALUES (_enquiry_id, 'converted', jsonb_build_object('client_id', sender_user_id), auth.uid())`.
8. Return the client id.

Grant `EXECUTE` to `authenticated`.

### Server (`src/lib/leads/leads.functions.ts`)
- `convertLeadToClient({ enquiryId })` — `POST`, `requireSupabaseAuth`, validates with Zod, calls `supabase.rpc('convert_lead_to_client', { _enquiry_id })`, returns `{ clientId }`. Throws on RPC error with the Postgres message surfaced to the toast.

### UI
- `src/components/leads/LeadDetailSheet.tsx`: above the tabs, in the existing header action row, add a primary "Convert to client" button.
  - Hidden when `lead.stage === 'won'` or `lead.converted_client_id` is set; instead show a small emerald badge "Converted" linking to `/dashboard/clients/$clientId` (route may not exist yet — link still works once added; for now route to `/dashboard/clients`).
  - Disabled with tooltip when `sender_user_id` is null.
  - On click → `useMutation` calls `convertLeadToClient`, invalidates `['leads']`, `['lead', enquiryId]`, `['lead-activity', enquiryId]`; toast "Converted to client".
- `LeadActivityTab.tsx`: add `converted` activity row (UserCheck icon, "Converted lead to client").

### Out of scope
- Inviting anonymous enquirers (no `auth.users` row yet).
- Programmes, billing, or first session scheduling for the new client.
- Dedicated `/dashboard/clients/$clientId` detail page.

### Files
- new migration: `convert_lead_to_client` RPC + GRANT.
- edit `src/lib/leads/leads.functions.ts` — add `convertLeadToClient` server fn + schema.
- edit `src/components/leads/LeadDetailSheet.tsx` — header button / converted badge.
- edit `src/components/leads/LeadActivityTab.tsx` — render `converted` activity row.
