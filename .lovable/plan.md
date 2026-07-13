## What the padlock currently means

In `src/routes/admin_.verification.tsx` (line 409), the padlock renders whenever a queue row has `claimed_by` set — i.e. **another admin has opened this case and is reviewing it**. It's a soft-lock indicator to stop two admins double-reviewing the same submission.

The problem: it has no tooltip, no label, and doesn't distinguish "claimed by me" from "claimed by someone else" — so it just looks like a mysterious warning symbol.

## Proposed fix (small, UI-only)

1. **Add a shadcn `Tooltip`** around the icon:
   - Claimed by another admin → "Being reviewed by {reviewer name or email}" (fallback: "Another admin is reviewing this")
   - Claimed by current admin → "You're reviewing this" + swap icon colour to emerald (`text-emerald-400`) so "mine" reads differently from "someone else's"
2. **Hide the padlock on rows in Approved / Changes / Rejected tabs** — a claim lock on a resolved case is noise; only show it on Pending.
3. **Reviewer name resolution:** the row already has `claimed_by` (uuid). Extend the existing pending-list server fn to left-join `profiles` (or `auth.users` via existing admin RPC) and return `claimed_by_name` / `claimed_by_email`. No new table.
4. **Legend chip** in the queue header: a tiny "🔒 = being reviewed" hint next to the status filters, so first-time reviewers understand at a glance.

No changes to claim/unclaim logic, no schema changes beyond the join in the read fn, no visual overhaul of the review pane.

## Files touched

- `src/routes/admin_.verification.tsx` — Tooltip wrap, emerald variant for self-claim, hide on non-pending tabs, header legend
- `src/lib/verification/admin-pending.functions.ts` (or wherever the pending list fn lives) — return `claimed_by_name` on each row

## Out of scope

- Auto-release of stale claims, claim ownership transfer UI, presence indicators. Flag if wanted as a follow-up.
