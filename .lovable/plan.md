## Why
`/dashboard/reviews` works but doesn't scale. As soon as a trainer has any volume:
- "All reviews" + "Removed by REPS" + "Sent requests" stack into a long vertical scroll.
- Removed reviews live in their own grey panel above the feed, dominating the page.
- The 5★/4★ filter row is a pill cluster that doesn't carry counts and can't grow.
- A pending review (waiting on admin approval) isn't surfaced at all on the trainer side.

Admin's `/admin/reviews` already nailed the right pattern: one panel, four shadcn tabs (Pending / Approved / Removed / All), KPI strip on top, sidebar for context. We mirror that here, tuned for a single trainer's data.

## Final structure of `/dashboard/reviews`

```text
┌─ KPI strip (4 tiles) ────────────────────────────────────────────┐
│  Overall rating · Last 30 days · Pending · Removed               │
└──────────────────────────────────────────────────────────────────┘

┌─ MAIN (xl:col-span-8) ──────────────────┐  ┌─ SIDE (xl:col-span-4) ─┐
│ ┌─ Reviews panel ──────────────────────┐│  │ Rating breakdown card  │
│ │ Header row: title + search           ││  │ How reviews work card  │
│ │ [All N][Approved N][Pending N]       ││  └────────────────────────┘
│ │ [Removed N][5★ N][4★ N]              ││
│ │ ───────────────────────────────────  ││
│ │ tab body: list of cards              ││
│ │ (per-tab empty state)                ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌─ Sent requests panel ────────────────┐│
│ │ Header + "Send another" CTA          ││
│ │ Inline status filters: All/Sent/     ││
│ │ Opened/Submitted/Expired             ││
│ │ Scrollable list, max-h ~420px        ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Tab behaviour

shadcn `Tabs` (`@/components/ui/tabs`) — same component the admin page uses, themed `bg-reps-ink/60`, h-8 triggers, `text-[11px]`.

| Tab | Source | Notes |
|---|---|---|
| **All** | `moderation_status !== "removed"` | Default. Approved + pending mixed, newest first. |
| **Approved** | `moderation_status === "approved"` | The "live on your profile" set. |
| **Pending** | `moderation_status === "pending"` | New tab. Card has an info strip: _"Waiting on REPS approval. Replies unlock once approved."_ Reply composer hidden (already does this via `isApproved` check). |
| **Removed** | `moderation_status === "removed"` | What's currently in the standalone panel. Card greyed, "Reason from REPS" callout, fallback copy for legacy nulls. |
| **5★** / **4★** | filter on top of All | Promoted from pill buttons to tabs so the row stays consistent. |

Each tab label gets a count when > 0, rendered as a `Badge` sibling: `Approved <Badge>12</Badge>`. Zero-count tabs render label only (no `(0)` clutter).

Search lives in the panel header (left of the tab row on desktop, full-width row on mobile) and filters within the active tab — client_name / title / body, exactly as today.

### Per-tab empty states

Each empty state is targeted, not generic:
- **All** — _"No reviews yet. Use 'Request a review' to email a client a one-click link."_ + CTA button.
- **Approved** — _"No approved reviews yet."_ Sub: pending count link if any.
- **Pending** — _"Nothing waiting on REPS approval right now."_
- **Removed** — _"No removed reviews. Your feed is clean."_ (positive framing, no warning tone.)
- **5★ / 4★** — _"No N-star reviews yet."_

### Removed-tab info strip
Top of the Removed tab body (thin row, not a full panel):
> _Removed reviews are hidden from your public profile. Reply to the REPS email if you'd like us to take another look._

### KPI strip — 4 tiles (was 3)
1. **Overall rating** — unchanged.
2. **Last 30 days** — unchanged.
3. **Pending** — count of `moderation_status === "pending"`, tone `neutral`, delta `"With REPS"` if > 0 else `"None"`.
4. **Removed** — count of `moderation_status === "removed"`, tone `neutral`, delta `"Hidden from profile"` if > 0 else `"None"`.

Drops the existing "Flagged" tile (less actionable for the trainer than Pending/Removed; the moderation queue handles flagged on the admin side). Grid stays `md:grid-cols-3 xl:grid-cols-4`.

### Sent requests panel — same shell, lighter weight
- Add a one-row status filter inline in the header: `All · Sent · Opened · Submitted · Expired` (mirrors review tabs, ghost-styled).
- Wrap list in `max-h-[420px] overflow-y-auto` once `requests.length > 8` so it never blows the page open.
- Counts in the header subtitle: _"12 requests · 4 submitted · 1 expired"_.

### What gets deleted from the current file
- The standalone `removed.length > 0 && <PPanel>…</PPanel>` block (lines 225–281).
- The pill-button 5★/4★ row + `filter` state shape — replaced by `tab` state of type `"all" | "approved" | "pending" | "removed" | "5" | "4"`.
- The "Flagged" KPI tile.

### What stays untouched
- Review-card body, stars, initials, ReplyBlock, thank/flag mutations, dates.
- `RequestReviewDialog`, `HeaderActions`, `StatusPill`.
- All server functions (`listMyReviews` already returns pending/approved/removed — no DTO change).
- Admin `/admin/reviews`, removal dialog, AI draft, notifications, email templates.
- Schema, RLS, RPCs.

### Responsive
- Mobile: tab row uses `overflow-x-auto` horizontal scroll inside `TabsList` (same trick admin uses on its 4 tabs at 360px). Search input drops to its own full-width row above tabs. Header row uses the `grid-cols-[minmax(0,1fr)_auto]` pattern from the responsive guidelines so title + search don't clip.
- KPI grid: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` (was `xl:grid-cols-5` with empty 5th slot).

## Token & lint compliance
- All radii from the 9-step scale (10 / 12 / 16 / 18 / 22 / full). No `rounded-xl/2xl/3xl`, no 14/20/28.
- All colors via existing `reps-*` tokens; emerald used only for status (Approved/Submitted/Live), red kept off Removed tab body (it's neutral grey; only the inline "Reason from REPS" callout uses orange-soft — unchanged).
- shadcn primitives: `Tabs/TabsList/TabsTrigger`, `Badge` for tab counts, `ScrollArea` for the sent-requests overflow.

## Files touched
- `src/routes/_authenticated/_professional/dashboard_.reviews.tsx` — only file. No schema, no server-fn, no admin-side, no email changes.

## Out of scope
- No pagination — `listMyReviews` already caps at 200 server-side, which is more than enough for v1; revisit if a trainer crosses that.
- No "acknowledge / dismiss" on removed cards yet — keep as permanent record.
- No bulk actions on requests (resend / cancel) — separate ticket.
- Admin page stays as-is.

## QA after build
1. **Empty account** — every tab shows its specific empty state; KPI strip shows 4 tiles with "—" / "None".
2. **cruz.pt's current state** (1 removed, ~2 approved) — All tab shows 2 cards; Approved shows 2; Pending shows empty state; Removed shows the Barry White card with fallback copy; tab counts read `All 2 · Approved 2 · Removed 1`.
3. **Search inside Removed tab** filters by client name.
4. **Mobile @ 375px** — tab row scrolls horizontally; search drops to full width; KPI grid is 2 columns; cards readable.
5. **Tablet @ 768px** — side column moves below main; sent-requests panel scrolls inside its panel, not the page.
6. **Sent requests with 0 items** — same empty state as today; status filter still renders but greyed.

If anything feels off in the live preview I'll iterate before declaring done.
