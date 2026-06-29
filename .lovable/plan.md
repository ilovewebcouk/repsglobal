## What's actually wrong (from the screenshot)

I shipped Member 360 using raw shadcn defaults (`<Card>`, `<TabsList>`, `<Avatar>`, `<Button variant="outline">`). On the dark admin shell those tokens render **cream/white**, so:

- The avatar fallback is white-on-white — Katie's "KG" is invisible.
- Both Snapshot and Identifiers cards are cream slabs with white text inside → unreadable. The actual data is rendered, you just can't see it.
- The tab strip is a cream pill on dark ink — looks like a broken component.
- "View public profile" / "Send email" / `⋯` are white buttons floating on dark — zero hierarchy with the page.
- Sticky header is a flat row with no visual weight, no separator, no rhythm.

Every other admin page (`admin_.ops.*`, `admin_.verification`, `admin_.support`) uses the project's own tokens — `border-reps-border`, `bg-reps-panel/40`, `text-reps-text`, `bg-reps-panel-soft`, `text-reps-orange`. Member 360 is the only screen that didn't. This is a styling defect, not a design question.

## Plan — restyle Member 360 to match the rest of the admin

Frontend-only. No business logic, no data shape changes, no new tabs.

### 1. Sticky header — make it feel like a workbench, not a row

- Increase avatar to `size-14`, give it a ring (`ring-1 ring-reps-border`) and an **orange tint** background (`bg-reps-orange/15 text-reps-orange`) so KG initials read instantly, even before any photo is wired up.
- Two-line identity stack: name (lg, semibold, white) + email (sm, `text-reps-text/65`) — tightened.
- Status pills row directly under the name, not jammed inline: Verified (emerald), tier (orange-tinted), status (state-coloured), Unpublished (muted). Consistent height, consistent radius.
- Right-side actions become a **proper button group**: primary "View public profile" (solid orange `bg-reps-orange text-black`), secondary "Send email" (`border-reps-border bg-reps-panel/40 text-white`), `⋯` ghost icon button. Same height, same gap.
- Header background: `border-b border-reps-border bg-reps-ink/85 backdrop-blur-md` — keeps the sticky behaviour, but adds the soft shadow on scroll that the rest of the chrome uses.

### 2. Replace shadcn `<Card>` defaults with REPs panel surface

Every card on this page becomes:

```text
rounded-[18px] border border-reps-border bg-reps-panel/40
  header: px-5 pt-5 (title 14-15px white semibold, description 13px text-white/55)
  content: px-5 pb-5 pt-2
```

Snapshot, Identifiers, Verification, MemberSnapshotCard wrapper, and ActivityPane day-group panels all share that surface. Cards now read as dark glass slabs with a hairline border — consistent with `/admin/ops/*`.

### 3. Tabs

- `TabsList`: thin pill (`h-10 rounded-[12px] border border-reps-border bg-reps-panel/40 p-1`).
- `TabsTrigger`: `h-8 rounded-[10px] px-3 text-[13px] text-white/65 data-[state=active]:bg-reps-panel-soft data-[state=active]:text-white`.
- No more cream slab. Sticky just under the header (`top-[72px]`) so it stays visible while you scroll.

### 4. Overview pane

- 6-stat grid stays, but each stat lives in its own `bg-reps-panel/60 rounded-[14px] border border-reps-border/60 p-3` micro-card with label / value / sub — looks like a real KPI strip instead of a flat grid.
- Identifiers card: monospace values get a `bg-reps-panel-soft/60 rounded-[8px] px-2 py-1` chip so Stripe / user IDs are visually distinct from labels. External-link icon stays orange.

### 5. Verification & Activity panes

- Verification: status row gets a tinted strip background that matches the tone (`bg-emerald-500/10` for verified, `bg-amber-500/10` for pending, etc.) — instant read.
- Activity timeline: day header gets a small `bg-reps-panel/40 rounded-[8px] px-2 py-1` chip; the timeline rail becomes `border-reps-border/40` so it doesn't fight the surface; each event row gets `hover:bg-white/[0.03]` for affordance.

### 6. "Coming next" empty states (Profile / Reviews / Notes)

- Replace the default `<Empty>` (which renders a cream slab) with a dark panel that matches everything else: same `bg-reps-panel/40 border-reps-border` surface, muted icon in an orange tint chip, headline + description + a single "Shipping next" badge. No more white box.

### Out of scope (on purpose)

- No new tabs, no new data, no new server functions.
- Not touching `MemberSnapshotCard.tsx` itself — only the wrapper it sits in.
- No changes to the global sidebar / shell — only this route.

### Technical notes

- One file: `src/routes/admin_.members.$userId.tsx`.
- Tokens already exist in `src/styles.css`: `reps-ink`, `reps-panel`, `reps-panel-soft`, `reps-border`, `reps-text`, `reps-orange`. No new tokens needed.
- Keeps every shadcn primitive (Card, Tabs, Avatar, Badge, Button, DropdownMenu, Empty, Separator, Skeleton) — just passes the right `className` overrides so they adopt the admin theme, exactly like the other admin pages do.
