## Dashboard 10/10 pass

Goal: kill dead space, make empty states feel intentional, rebalance columns, and add one signature moment + motion polish. UI-only — no schema or logic changes.

### 1. KPI consolidation (top fold)
- Collapse the two 4-tile rows into **one 4-tile row** that adapts to data:
  - Tile 1: **Enquiries (30d)** — always shown.
  - Tile 2: **Reviews · rating** — count + avg star.
  - Tile 3: **Profile views (30d)** with delta — empty copy if no history.
  - Tile 4: **Search impressions** big, **avg position** as caption.
- Fold Reply rate, CTR, Last-30-days reviews into hover/secondary text on the related tile or a "Discoverability detail" link.
- Replace every `—` with human empty copy ("No data yet · check back after your first enquiry").

### 2. Left column shrink-to-fit
- `NeedsAttention`: when items.length ≤ 1, render as a **slim 56px row** (icon + text + Reply CTA), no card chrome.
- `ActivityTimeline`: same slim-row pattern when events.length ≤ 2; full card only at 3+ events.

### 3. Column rebalance
- Move **Education & CPD** out of the bottom row into the **right rail under Verification** (paired trust block).
- Promote **Reviews snapshot** into the **left column under Activity** (it's an action surface).
- Net: left = action/activity; right = trust/identity. Column bottoms within ~60px.

### 4. Verification card slim mode
- When 3/3 verified, collapse to one line: "✓ Identity, insurance, qualifications verified · Insurance valid to 1 Apr 2027" with "Manage" chevron. Expand only if something is incomplete or expiring within 60 days.

### 5. Services empty banner
- Keep the slim 56px banner — move it **directly under the KPI strip**, above NeedsAttention.

### 6. Pro upsell placement
- Pin `ProUpsellStrip` directly under the profile header card (between header and KPIs) on Core plan. Removes the orphaned bottom strip.

### 7. Copy + chrome nits
- "1 review need a response" → "1 review needs a reply".
- Remove the "Dashboard" pill from the orange impersonation banner.
- Tighten Recent activity subtitle to "Last 10 events".

### 8. Signature moment — header sparkline
- Replace the static "Your listing is live on REPS" line in the **profile header card** with a compact **14-day profile-views sparkline** (inline SVG, ~120×28px) sitting next to the live dot.
- Hover: tooltip with date + view count.
- Empty state: a flat dotted baseline with "Tracking views — first data point lands after your first visitor."
- Single distinctive moment the eye lands on; nothing else on the page competes for that role.

### 9. Motion pass
- **KPI count-ups**: numeric tiles animate from 0 to value over 600ms (`requestAnimationFrame`, ease-out). Skip if `prefers-reduced-motion`.
- **NeedsAttention pulse**: when a new item arrives (count increases), the slim row pulses the emerald/orange dot for 2s using the existing `pulse` utility.
- **Sparkline draw-in**: path uses `stroke-dasharray` + `stroke-dashoffset` to draw left→right over 700ms on mount.
- **Optimistic Reply**: clicking the Reply CTA in NeedsAttention fades the row out (`animate-fade-out`) and immediately decrements the count; reconciles on server response and rolls back on error with a toast.
- **Card entrance**: top-level dashboard cards stagger in with `animate-fade-in` at 0/60/120/180ms delays on first mount only (skip on route-internal refetches).
- All motion respects `prefers-reduced-motion: reduce` — fall back to instant.

### 10. Acceptance check
Re-snapshot at 1564×1800 and verify:
- No card in the top viewport shows more than one `—` or `0`.
- Left and right column bottoms within 60px of each other.
- No card has >120px of empty interior padding.
- Sparkline renders (with empty state when data absent).
- Count-ups, pulse, draw-in, and optimistic Reply all behave; reduced-motion users see instant states.
- Token compliance: no raw hex, button shadows, or banned radii.

### Files I'll touch
- `src/components/dashboard/hub/index.tsx` — KPI consolidation, slim variants, Verification slim mode, copy fixes, count-up + pulse + optimistic Reply.
- `src/components/dashboard/hub/HeaderSparkline.tsx` *(new)* — inline SVG sparkline with draw-in animation and tooltip.
- `src/lib/discoverability/kpis.functions.ts` — extend existing query to return a 14-day daily-views series (already aggregating from `profile_view_events`, no new table).
- `src/routes/_authenticated/_professional/dashboard.tsx` — re-layout (CPD → right, Reviews → left, ServicesStrip + ProUpsellStrip into eye-path), stagger-in classes.
- No new DB tables, no new server endpoints beyond extending the existing KPI function's return shape.
