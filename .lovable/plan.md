## Goal
As the admin types in the top-bar Member Finder, show a live dropdown of matching members (by UID, email, Stripe `cus_…`/`sub_…`, BD id, or name) so they can click the right one instead of always hitting Enter.

## Approach
Reuse the existing `findMember` server fn (already admin-gated, already returns ranked `MemberMatch[]`). No backend/RPC changes needed — it already supports partial email and name matches, so it works fine as an autocomplete source.

## Changes

**`src/components/ops/MemberFinder.tsx`** (only file touched)

1. Add a debounced effect on `q`:
   - Trigger 250ms after the last keystroke.
   - Skip if the normalised query is < 2 chars (avoids firing on a single letter and hammering the RPC).
   - Cancel in-flight results if the query changed while loading (track a request id / abort marker so stale responses don't overwrite fresher ones).
   - Show a subtle loading state in the existing spinner slot while suggestions load.

2. Render suggestions in the existing dropdown:
   - Reuse the current `matches` dropdown markup — same styling, same click-to-navigate behaviour, same `match_kind` badge.
   - Cap to first 8 rows to keep the list scannable.
   - Add keyboard nav: ↑/↓ to move highlight, Enter to open the highlighted row (falls back to current `go()` behaviour when nothing is highlighted), Esc to close.

3. Preserve current behaviour:
   - Enter with no highlight still calls `go()` (single-match auto-navigate, "No matches" toast on empty).
   - ⌘K focus shortcut untouched.
   - Both `topbar` and `default` variants get the same autocomplete (shared logic).
   - Clicking outside closes the dropdown (add a click-away listener on the wrapper).

4. Small UX polish:
   - Highlighted row uses `bg-reps-panel/60` (matches existing hover).
   - When the user pastes a full UUID or `cus_…`, still show the dropdown briefly then auto-navigate on exact single match — do NOT skip the dropdown, so admins can visually confirm before jumping.

## Out of scope
- No changes to `findMember` server fn, `ops_find_member` RPC, or DB.
- No new caching layer — the RPC is fast enough and debouncing already limits calls. Can add later if load becomes an issue.
- No changes to the "Members reachable via Campaigns" area or any other admin surface.

## Verification
- Type `dem` → dropdown shows the demo user + other partial email matches.
- Type/paste `3d8ffa68-f4b2-46b2-bdac-d06b48fbf445` → single match appears, click to open.
- Paste a `cus_…` from Stripe → matching member appears.
- ↑/↓/Enter/Esc keyboard nav works.
- Enter with empty dropdown still runs the classic search + toast.