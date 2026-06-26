## Goal

Get the dashboard from 7.5/10 → world-class by fixing the four issues the screenshot exposed:

1. Left-column dead space
2. Missing discoverability metrics (the data trainers actually care about)
3. Orange-CTA overload
4. Chrome polish

## 1. Kill left-column dead space

**The diagnosis:** stacking Completeness + Verification in the right rail forced the left column (Needs Attention + Activity) to stretch to match. With sparse data (1 attention item, 1 activity event), Jordon's dashboard shows ~480px of empty card territory. The previous fix structurally solved the *Verification* dead space and recreated it on the left.

**The fix:** stop forcing parity between columns. Let each card size to its content with a sensible cap, and use the rest of the space productively.

Changes in `src/routes/_authenticated/_professional/dashboard.tsx`:

- Drop `items-stretch` on the merged grid row → use `items-start`.
- Right column stays stacked (Completeness + Verification), natural height.
- Left column: Needs Attention sizes to content (no flex-1 fill). Activity sizes to content with a max-height cap (~480px) and internal scroll.
- When BOTH cards on the left are sparse (≤2 items combined), render a single merged card `RecentSignals` that shows attention items first, then activity, in one timeline — kills the empty-row problem for new trainers.

Changes in `src/components/dashboard/hub/index.tsx`:

- `NeedsAttention`: remove `min-h-0 flex-1` from the inner `<ul>`. List sizes to content. Keep scroll for >6 items.
- `ActivityTimeline`: same — content-sized list with `max-h-[420px] overflow-y-auto`.
- Add new export `RecentSignals` that merges attention items + activity events into one timeline view, used when sparse.

## 2. Add discoverability metrics — biggest content win

**The diagnosis:** REPs is a discovery platform. The current KPI strip (Enquiries / Reply Rate / Avg Rating / Last 30d reviews) is all *response* data — none of it answers "am I being found?", which is question #1 for every trainer.

**The fix:** add a new `Discoverability` row directly under the KPI strip with 4 tiles:

```text
Profile views (30d) │ Search appearances │ Top profession rank │ Click-through rate
       1,247        │        342          │      #4 in Telford   │       12.4%
       ↑ 18% vs prev│  ↑ 24 vs prev       │  Personal Trainer    │   above avg
```

**Data foundation (new — needs DB work):**

- New table `public.profile_view_events`: `id, professional_id, viewed_at, source (search|profession|city|direct|referral), viewer_session_id, ip_hash`.
- New table `public.search_appearance_events`: `id, professional_id, appeared_at, query_type (search|profession|city), result_position`.
- Server function `getDiscoverabilityKpis` returning 30d totals + previous-period delta + rank.
- Tracking calls added to:
  - `src/routes/pro.$slug.index.tsx` loader (record view)
  - `src/lib/directory/search.functions.ts` (record appearances for top N results)
  - `src/routes/in.$location.tsx` and `src/routes/professions.$profession.tsx` (record appearances)

**Until data accumulates (caveat):** brand-new accounts will see "Tracking from today" placeholder copy instead of zero values, so it doesn't look broken.

New file: `src/components/dashboard/hub/DiscoverabilityStrip.tsx` rendering 4 KpiTiles with sparkline support.

## 3. Reserve orange for primary CTAs only

**The diagnosis:** I counted 8 orange elements competing in one viewport. Orange becomes wallpaper instead of a signal.

**The rule going forward:** max 2 orange CTAs per viewport, reserved for the single most important action.

Changes:

- Top-right `Request a review` → stays orange (primary growth action)
- Top-right `View public profile` → ghost/outline (it's a navigation, not an action)
- Identity card `View public profile` → REMOVE (duplicate)
- Identity card `Copy link` → relabel to `Copy profile link` and demote to ghost
- `Reply` in Needs Attention → demote to ghost (`text-reps-orange` link style only)
- `Manage verification` / `Edit profile` / `Open CPD` / `All reviews` → all demoted to ghost
- `See Pro features` in upsell strip → stays orange (it's an upsell — meant to convert)
- `Core` pill next to `REPS Verified` → mute to neutral border/text-white/60

Net result: orange remains on `Request a review`, the upsell `See Pro features` button, and active state highlights only. Everything else uses ghost/outline.

## 4. Chrome polish

- **"No services yet"**: collapse the 240px empty card to a 64px banner with inline `Add your first service →` button. Only inflate to a rich empty state when the trainer has clicked Add and abandoned.
- **`Reply rate (30d)` tile with no data**: instead of em-dash, show "Tracks once you receive enquiries" — turns dead tile into onboarding copy.
- **Duplicate `View public profile` button**: removed (see section 3).
- **Page end on upsell**: add a small `What's next` footer card under the upsell with 3 contextual quick-links (e.g. "Request reviews from past clients", "Add 3 services to your shop-front", "Refresh your headline") — closes the page on action, not on sales.
- **`Core` pill**: muted neutral (`border-reps-border bg-reps-panel-soft text-white/60`) so `REPS Verified` is the only badge competing for the eye.

## Files touched

```text
src/routes/_authenticated/_professional/dashboard.tsx     (layout + new rows)
src/components/dashboard/hub/index.tsx                    (card sizing fixes, ghost-ify CTAs, banner)
src/components/dashboard/hub/DiscoverabilityStrip.tsx     (NEW)
src/components/dashboard/hub/RecentSignals.tsx            (NEW — merged sparse view)
src/components/dashboard/hub/WhatsNextCard.tsx            (NEW — page-end footer)
src/lib/discoverability/discoverability.functions.ts      (NEW — getDiscoverabilityKpis server fn)
src/routes/pro.$slug.index.tsx                            (tracking call in loader)
src/lib/directory/search.functions.ts                     (search appearance tracking)
src/routes/in.$location.tsx                               (appearance tracking)
src/routes/professions.$profession.tsx                    (appearance tracking)
supabase/migrations/<timestamp>_add_discoverability_tracking.sql  (NEW tables + RLS + indexes)
```

## Out of scope

- KPI strip styling (stays); we ADD a discoverability row, not replace the existing one
- Sidebar nav
- Welcome banner
- Identity / Verification / Education & CPD / Reviews card internals (already polished)
- Mobile-specific layout work (this pass is desktop; mobile inherits via the existing breakpoint stack)

## Order of execution

1. Layout fix (no DB) — kills dead space in one edit
2. Chrome polish (no DB) — quick visual wins
3. Orange-CTA demotion (no DB) — single sweep across card files
4. Discoverability migration + tracking calls + server fn + UI (the heavy lift)

Steps 1-3 land first as one batch; step 4 follows so you can review the layout before we commit to the data plumbing.
