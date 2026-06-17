# Add "Mark as spam" to the admin support queue

Give admins a one-click way to flag junk tickets as spam, hide them from the main "Needs you / Pending" views, and review/undo them from a dedicated Spam tab.

## UX

1. **Bulk action bar** (`BulkActionBar.tsx`) — add a `Spam` button (ShieldAlert icon, amber) between `Reopen` and `Delete`. Keyboard shortcut `s`.
2. **Ticket drawer** — add a `Mark as spam` item to the existing status dropdown / action row (same place Resolve / Pending live), so a single ticket can be flagged without selecting it first.
3. **Saved-views tab row** — add a `Spam` tab after `Resolved today`, with count. Spam tickets are excluded from `open`, `pending`, `snoozed`, `resolved` and `all` counts (treated as a separate bucket like "Trash" in Gmail).
4. **Restore path** — from the Spam tab, the bulk bar shows `Not spam` (reopens to `open`) instead of `Spam`. Undo toast works the same way as existing bulk actions.

## Data model

Add `'spam'` to the `public.support_status` enum (cleanest — reuses status indexes, filters, RLS, realtime). Migration:

```sql
ALTER TYPE public.support_status ADD VALUE IF NOT EXISTS 'spam';
```

No new columns, no new policies. Existing admin-only RLS already covers it.

## Server

`src/lib/support/bulk-tickets.functions.ts`
- Extend `BulkAction` enum with `"spam"` and `"not_spam"`.
- `spam` → `patch.status = 'spam'; patch.resolved_at = null`.
- `not_spam` → `patch.status = 'open'; patch.resolved_at = null`.
- Audit log entry uses `bulk_tickets.spam` / `bulk_tickets.not_spam`. Undo continues to work via `previousStates`.

`src/lib/support/tickets.functions.ts`
- `updateTicket` already accepts a status patch — extend its allowed status values to include `'spam'` so the single-ticket drawer action reuses it.
- `listTickets`: when `status` filter is `'open' | 'pending' | 'snoozed' | 'resolved' | 'all'`, exclude rows where `status = 'spam'`. Add explicit `'spam'` filter that returns only spam tickets.

## Route wiring (`src/routes/admin_.support.tsx`)

- Add `spam` to `StatusFilter`.
- Add a `Spam` `TabsTrigger` with `counts.spam`.
- Extend `counts` memo: `spam = rows.filter(r => r.status === 'spam').length`; exclude spam rows from `open/pending/snoozed/resolved/all/byInbox` tallies.
- `runBulk` accepts `'spam' | 'not_spam'`; toast label map gains `Marked as spam` / `Restored from spam`.
- `BulkActionBar` swaps `Spam` ↔ `Not spam` based on whether `tab === 'spam'`.
- `labelFor` extended for new actions.

## Files touched

- `supabase/migrations/<new>.sql` — add enum value.
- `src/lib/support/bulk-tickets.functions.ts` — new actions.
- `src/lib/support/tickets.functions.ts` — filter spam out of default views; allow `'spam'` in `updateTicket`.
- `src/components/admin/support/BulkActionBar.tsx` — Spam / Not spam button + shortcut.
- `src/routes/admin_.support.tsx` — tab, counts, runBulk wiring.
- Ticket drawer status menu (same route file) — add `Mark as spam` / `Not spam` item.

## Out of scope

- Automatic spam classification / heuristics.
- Sender-level blocklist (could come later; spam status is per-ticket only).
- Permanent auto-purge of spam after N days.
