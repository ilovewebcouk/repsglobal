## World-class polish sweep: About / Services / Specialisms+Location row

Five sequenced upgrades to lift the row to a Booksy/Treatwell standard. Phase 1 scope (static visuals only), existing tokens and radii, no schema/auth/booking work.

All edits in `src/routes/pro.$slug.tsx` unless noted. Order matches risk (small → big), so each step can be reviewed before the next.

---

### Step 1 — Drop the misleading "View all services" link

Lines 387–394, the Services card header.
- Remove the `<a href="#services">View all services</a>` element.
- Collapse the wrapping `flex items-center justify-between` to a plain heading.

### Step 2 — Balance the Specialisms grid

Lines 427–438.
- Replace `flex flex-wrap gap-1.5` with `grid grid-cols-3 gap-1.5`.
- Pill becomes `justify-center` so each cell renders a centred, equal-width pill.
- 7 specialisms → 3 / 3 / 1 layout; the orphan sits centred under the second column for a deliberate rhythm. Tags keep `text-[11px] px-2 py-0.5`.

### Step 3 — Fix the map placeholder

`MapPlaceholder` component (lines 752–769).
- Wrap each area label in a `max-w-[44%] truncate` container, drop font from 8px to 7.5px, increase letter-tracking slightly.
- Re-position labels: Clerkenwell `top-2 left-2`, Farringdon `bottom-2 left-2`, City of London `top-2 right-2` (move it to top-right so it stops colliding with Farringdon along the bottom edge).
- Add a soft inner ring (`ring-1 ring-inset ring-reps-charcoal/5`) and a faint grid overlay (4 thin lines at 25/50/75% via gradients) so the placeholder reads as "stylised map", not "missing image".
- Recentre pin to `top-[48%]` so it visually sits in the negative space, not on a label.

### Step 4 — Rebuild Service cards (the biggest lift)

Lines 395–422.
- Outer `<article>` → `flex flex-col h-full overflow-hidden rounded-[18px] bg-reps-panel text-white`.
- Outer grid: add `items-stretch` so all 3 cards stretch to the tallest.
- Inner content area `<div className="space-y-2 p-4">` → `<div className="flex flex-col gap-2 p-4 flex-1">`.
- Title: add `line-clamp-2 min-h-[2.4em]` so 1-line and 2-line titles occupy the same vertical space.
- Desc: add `flex-1 line-clamp-3` so descriptions fill remaining space and prices align to a shared baseline.
- Replace the current price stack with a single price lockup row:
  ```
  <div className="flex items-baseline gap-1.5 pt-1">
    <span className="text-[20px] font-bold leading-none">{s.price.replace('From ', '')}</span>
    <span className="text-[11px] text-white/55">From · {s.unit}</span>
  </div>
  ```
- Add a full-width Enquire button at the bottom:
  ```
  <button className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-reps-orange text-[12px] font-semibold text-white transition-colors hover:bg-reps-orange-dark">
    <MessageCircle className="h-3.5 w-3.5" /> Enquire
  </button>
  ```
- `MessageCircle` is already imported (line 16).

### Step 5 — Reload the About card

Lines 364–383.
- Heading stays "About {firstName}".
- Insert a pull-quote between heading and bio:
  ```
  <p className="mt-3 border-l-2 border-reps-orange pl-3 font-display text-[15px] italic leading-snug text-reps-charcoal">
    "{pro.blurb}"
  </p>
  ```
  (Reuses existing `pro.blurb` — no data model change.)
- Bio paragraphs continue below with `mt-4`.
- Replace the two icon-stat rows (lines 373–382) with a 3-tile grid:
  ```
  <div className="mt-5 grid grid-cols-3 gap-2">
    <Tile value="{pro.years}+" label="Years experience" />
    <Tile value="{pro.clients}" label="Clients helped" />
    <Tile value={pro.qualifications[0].issued.split(' ')[1]} label="Verified since" />
  </div>
  ```
  Tile: `rounded-[12px] bg-reps-ivory p-3 text-center` with a 20px bold orange value and 10px uppercase tracked label.
- "Verified since" derives from existing `pro.qualifications[0].issued` (e.g. "May 2023" → "2023"). No schema change.

---

### Out of scope
- No new data fields (`pullQuote`, `cta`, `verifiedSince` etc. — derived from existing).
- No real Enquire wiring — button is visual only.
- No changes to hero, sub-nav, Qualifications, Trust, Reviews, FAQ, CTA band, or footer.
- No changes to tokens, radii, brand orange, or other pages.

### Verify after each step
- Preview `/pro/james-carter` and `/pro/sophie-taylor` at 1469px.
- After step 4: confirm all three service cards share the same height and the price/CTA lockup aligns on a shared baseline.
- After step 5: confirm About column now reaches close to the same bottom edge as Services/Location.
- Spot-check 375px mobile after step 4 and step 5 — service cards stack, About tiles drop to 3-up or 2+1.