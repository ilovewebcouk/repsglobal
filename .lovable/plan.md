## Prospects: cold contacts as a separate audience

Keep Newsletter strictly for public opt-ins. Add a third audience — **Prospects** — for CSV-imported cold contacts (people you want to invite to sign up). They get their own admin page, their own Campaigns tier, and auto-convert when they sign up as members.

### 1. Database

New table `public.prospect_contacts`:
- `email` (citext, unique)
- `full_name` (text, nullable)
- `list_tag` (text, nullable) — e.g. "gym-owners-london", "2024-expo-leads"
- `source_note` (text, nullable) — where the list came from
- `status` (enum: `active` | `converted` | `unsubscribed` | `bounced`)
- `converted_user_id` (uuid, nullable, FK auth.users)
- `imported_at`, `imported_by` (admin), `created_at`, `updated_at`

RLS: admin-only read/write via `has_role(auth.uid(), 'admin')`. Service role full access for server functions. No anon, no authenticated grants.

Update `handle_new_user` trigger: when a new auth user's email matches an active prospect, set `status='converted'` and `converted_user_id`.

Add index on `lower(email)` and on `(status, list_tag)`.

### 2. Move CSV import off the Newsletter page

- Remove the "Import CSV" control from `/admin/newsletter`.
- Replace with a small link: **"Cold list of non-members? Import to Prospects →"** pointing to `/admin/prospects`.
- Newsletter page stays strictly public opt-ins.

### 3. New admin page `/admin/prospects`

- Header count + "Members reachable via Campaigns" style callout
- Filters: status, list_tag, search by email/name
- Table: email, name, tag, status, imported date, converted badge if applicable
- Actions: Import CSV (with required `list_tag` + optional `source_note`), Export CSV, delete row, delete entire tag, mark unsubscribed
- Import behaviour: dedupe on email; skip emails that already exist as members (log skipped count); skip emails on `suppressed_emails`

### 4. Campaigns: new "Prospects" tier

In `src/lib/campaigns/outbound.functions.ts`, `ComposeDialog.tsx`, scheduled runner, and webhook handlers:
- Add `'prospects'` to the `Tier` union alongside `core | pro | studio | former | newsletter`
- Recipient resolution for `prospects`: select `prospect_contacts` where `status='active'`, optional `list_tag` filter, exclude anyone whose email now matches a confirmed member (`auth.users.email_confirmed_at IS NOT NULL`), exclude `suppressed_emails`
- ComposeDialog: add a Prospects checkbox with an optional list-tag multi-select shown when Prospects is ticked
- When Prospects is selected, show an amber banner: *"Cold outreach — keep to a signup-focused message and no more than one per contact per month."*
- Unsubscribe link on Prospects sends flips `prospect_contacts.status='unsubscribed'` (in addition to existing `suppressed_emails` insert)
- Live recipient preview count already added in the composer — extend it to include Prospects when selected

### 5. Auto-convert on signup

Extend `handle_new_user` (or a small AFTER INSERT trigger on `auth.users`) to look up `prospect_contacts` by lowercased email and set `status='converted'`, `converted_user_id=NEW.id`. Prospects excluded from future Prospects-tier sends automatically.

### Out of scope (intentionally)

- No merging prospects into the Newsletter list
- No public opt-in form for Prospects (they're cold contacts, not subscribers)
- No changes to Core/Pro/Studio/Former/Newsletter tiers beyond adding Prospects alongside them
- No bulk email-verification service integration (can be added later)

### Files touched

- New migration: `prospect_contacts` table + policies + grants + trigger update
- New: `src/lib/prospects/prospects.functions.ts` (list, import, export, delete, delete-tag, unsubscribe, counts)
- New: `src/routes/admin_.prospects.tsx`
- New: `src/components/admin/prospects/ImportCsvDialog.tsx`
- Edit: `src/routes/admin_.newsletter.tsx` (remove CSV import, add link)
- Edit: `src/lib/campaigns/outbound.functions.ts` (Tier union, resolver, unsubscribe handler)
- Edit: `src/components/admin/campaigns/ComposeDialog.tsx` (Prospects checkbox + tag filter + banner + preview count)
- Edit: admin nav to add Prospects link
