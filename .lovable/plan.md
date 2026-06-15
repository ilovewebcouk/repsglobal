# New Ticket — search by trainer name or email

Today the "To" field is a plain email input. We'll turn it into a combobox you can type into freely: type an email and it still works, but type a name and it shows matching trainers/clients you can pick — auto-filling email + name.

## UX

- Replace the current "To (email)" input with a combobox (shadcn `Command` inside a `Popover`, same dark surface as the dialog).
- Single field labelled **"To"**, placeholder: *"Search trainer or type email…"*.
- Typing:
  - Looks like an email (`/.+@.+/`) → no dropdown, accept as-is.
  - Otherwise → after 200 ms debounce, fetch matches and show a dropdown.
- Each result row: avatar initial · **Full name** · email in muted text · small tier chip (Verified / Pro / Studio) if a professional.
- Picking a result fills `to` (email) **and** `name` (full name); both become read-only chips with an × to clear back to free typing.
- Empty state when no matches: *"No match — press Enter to use 'foo' as a free email."* (only shown once the typed text looks like an email).
- Keep ⌘+Enter to send, keep Name field below as a fallback for when the recipient isn't on REPs yet.

## Data — new server function

`searchSupportRecipients` in `src/lib/support/tickets.functions.ts`:
- Admin-only (`assertAdmin`), `requireSupabaseAuth`.
- Input: `{ q: string }` (min 2 chars).
- Source:
  1. `professionals` joined to `profiles` (name, slug, tier) + `auth.users.email` via `supabaseAdmin` (service role, inside handler).
  2. `clients` joined to `profiles` + `auth.users.email`.
  3. Recent `support_tickets.requester_email / requester_name` (distinct, last 90 days) — covers people who emailed in but aren't users.
- Filter: case-insensitive match on full_name OR email (ilike `%q%`).
- Return shape: `Array<{ email, name, kind: "professional" | "client" | "contact", tier?: "verified" | "pro" | "studio", slug?: string }>`, capped at 8, professionals first, then clients, then contacts.
- No fuzzy/typo tolerance for v1 — just ilike. Good enough for ≤24k pros.

## Files touched

- `src/lib/support/tickets.functions.ts` — add `searchSupportRecipients` (uses `supabaseAdmin` loaded inside the handler).
- `src/components/admin/support/NewTicketDialog.tsx` — swap the `Input` for a `RecipientPicker` combobox; reuses existing `name` state for the auto-filled name.
- (New, tiny) `src/components/admin/support/RecipientPicker.tsx` — debounced combobox component; isolated so we can reuse later in compose-on-ticket flows.

## Out of scope

- Multi-recipient (CC/BCC) — single recipient only, same as today.
- Creating a profile from the picker — if no match, you still just type the email + name manually.
- Searching by phone or company.
- Saved recent recipients list.

Say **"go"** to ship.
