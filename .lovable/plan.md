## Professional Dashboard — static mock-up-accurate build

Build `/dashboard` as a Phase 1 static high-fidelity screen, pixel-matched to `src/mockups/reps_fullpage_professional_dashboard_v1.png`. No auth, no data, no real charts — every visual is presentational.

### Route

- New file: `src/routes/dashboard.tsx` (`createFileRoute("/dashboard")`).
- `head()` with own title / description / og — not copied from another route.
- Component composes a left sidebar + main content area inside a full-bleed dark shell (`bg-reps-ink`).

### Layout grid (matches mock-up)

```text
┌──────────────┬──────────────────────────────────────────────────────────┐
│              │  Top bar: "Welcome back, James 👋"  Search  🔔  avatar  │
│  Sidebar     ├──────────────────────────────────────────────────────────┤
│  (fixed)     │  Row 1: 6 KPI tiles (Revenue, Active Clients, Adherence,│
│              │         REPs Pro Score, Membership Status, AI Insight)  │
│  Logo        ├──────────────────────────────────────────────────────────┤
│  Nav items   │  Row 2: 3-col panel — Today's Schedule │ AI Business    │
│  (Dashboard  │           Command Centre (with holo figure) │ Status    │
│   active)    ├──────────────────────────────────────────────────────────┤
│              │  Row 3: 4-col — Client Perf │ AI Alerts │ Lead Pipeline │
│  User card   │            │ Content Studio                              │
│  AI Assistant├──────────────────────────────────────────────────────────┤
│              │  Row 4: 3-col — Revenue Overview │ Check-In donut │     │
│              │            Program Engagement bars                       │
│              ├──────────────────────────────────────────────────────────┤
│              │  Row 5: 3-col — Client Progress Spotlight │ Tasks &    │
│              │            Reminders │ Upcoming Events                  │
│              ├──────────────────────────────────────────────────────────┤
│              │  Row 6: 3-col — Recent Client Reviews │ CPD &          │
│              │            Education │ Business Growth Tips             │
│              ├──────────────────────────────────────────────────────────┤
│              │  Footer (REPs logo, ©, Privacy, Terms, Support)         │
└──────────────┴──────────────────────────────────────────────────────────┘
                                                          ● floating + FAB
```

### Sidebar (≈ 224px wide, fixed, `bg-reps-midnight`)

- REPs wordmark + sub-line at top (same treatment as auth pages).
- Nav items (each: icon 18px + label, height 40px, radius 10px):
  Dashboard (active — `bg-reps-orange-soft text-reps-orange`), Clients, Calendar, Programs, Nutrition, Check-Ins, Messages (with orange "6" badge), Leads, Payments, Reports, Content Studio, Education & CPD, Community, Business Tools, Settings.
- Bottom: user card (avatar `pro-sophie` placeholder reused or new James avatar, name, "Personal Trainer", "REPs Level 3" pill) inside `rounded-[16px] border-reps-border bg-reps-panel p-3`.
- "AI Assistant" CTA button (sparkle icon, `rounded-[10px] border-reps-orange/40 bg-reps-orange-soft text-reps-orange`, full width).

### Top bar (height 64px, no border)

- Left: `font-display text-[22px] text-white` greeting "Welcome back, James 👋" + small muted sub-line "Here's what's happening with your business today."
- Right: search pill (`rounded-[10px] bg-reps-panel border-reps-border`, ⌘K hint), bell icon with orange "12" badge, avatar circle, menu icon.

### Rows — components

All cards use `rounded-[18px] bg-reps-panel border border-reps-border p-5` (result/profile card radius). Large chart panels use `rounded-[22px]` (panel radius). Buttons inside cards `rounded-[10px]`. Pills `rounded-full`. NO shadows on buttons.

**Row 1 — KPI tiles (6 columns)**
Each tile: label (12px muted), big number (`font-display text-[28px] text-white`), small delta pill (`text-reps-green` ↑ or `text-reps-red` ↓), tiny inline orange spark-line (static SVG path). The "REPs Pro Score" tile has a small shield icon + "942 Elite". "Membership Status" shows "REPs Premium" + orange pill "Active" + renews date. "AI Business Insight" replaces sparkline with star-burst icon + "View insights" mini button.

**Row 2 — 3 panels**
- **Today's Schedule** — header + day label, 5 timeline rows (time + 2-line text). Bottom outline button "View full calendar".
- **AI Business Command Centre** (the hero panel) — header with "Ask AI" orange pill button. 4 stacked insight rows (small round orange icon + 2-line text). On the right, a holographic human figure illustration (generated PNG with transparent bg, blue wireframe glow + orange floor glow). Bottom outline button "View all recommendations".
- **Your Professional Status** — header + outline "View profile" button. Rows: ✅ REPs Verified Member (date), ✅ Professional Indemnity Insurance (date), CPD Progress bar 18/20pts 90%, Qualifications "3 Active" pill, Endorsements "12" pill, Client Reviews ★★★★★ 4.9 (128).

**Row 3 — 4 panels**
- **Client Performance Overview** — tab strip (Adherence/Retention/Results/Revenue), large line chart (static inline SVG), 4 mini stats underneath with delta.
- **AI Client Alerts** — header + "View all (12)". 3 client rows (avatar + name + risk pill High/Medium + 2-line text). Bottom outline button "Go to Check-Ins".
- **Lead Pipeline** — header + "All Leads" dropdown. Pipeline strip (Leads 32 / Call Booked 18 / Proposal Sent 11 / Trial 7 / Client 5) as 5 mini tiles. 3 lead rows below (avatar + name + intent pill). Outline "View all leads".
- **Content Studio** — header + "Create New" orange button. Tab strip (Recent/Scheduled/Drafts). 4 content rows (square icon + title + sub + status pill). Outline "Go to Content Studio".

**Row 4 — 3 panels**
- **Revenue Overview** (wider) — big number £12,480 + delta, full-width area chart (inline SVG, orange gradient fill), x-axis labels. Under chart: 4 breakdown stats (Paid Sessions / Programs / Nutrition / Other Income) with deltas. Outline "View full report".
- **Client Check-In Overview** — donut chart (inline SVG: 3 segments green/orange/red), centre label "142 Total Clients". Legend right (Up to date 98 / Due 28 / Overdue 16). Outline "Send check-in reminders".
- **Program Engagement** — 5 horizontal bars (program name left, % right, orange/red gradient bar). Outline "View all programs".

**Row 5 — 3 panels**
- **Client Progress Spotlight** — 3 mini cards in a row: avatar, name, program, big delta (-4.2kg / +2.8kg / +15%), period, adherence % with tiny line.
- **Tasks & Reminders** — header + chevron. 5 task rows: checkbox + title + due/priority pill (High/Due Today/Due Tomorrow). Outline "View all tasks".
- **Upcoming Events** — 3 event rows: date block (month + day) + title + sub + attendees stack/count. Outline "View calendar".

**Row 6 — 3 panels**
- **Recent Client Reviews** — 3 review rows (avatar + name + ★★★★★ + quote).
- **CPD & Education** — 3 course rows (square thumb + title + sub + status pill: In Progress/Completed/Not Started). Outline "Browse all courses".
- **Business Growth Tips** — 3 tip rows (small round orange icon + title + sub). Outline "See all recommendations".

**Footer** — same shell as public footer but condensed: REPs wordmark+sub left, © + Privacy / Terms / Contact Support links centre/right.

**Floating action** — bottom-right `h-14 w-14 rounded-full bg-reps-orange` with `+` icon (`shadow-none` per skill rule, color hover only).

### Assets to generate

1. `src/assets/dashboard-james-avatar.jpg` — male trainer headshot, friendly, dark studio (square 512×512, fast model).
2. `src/assets/dashboard-holo-figure.png` — transparent-bg holographic human silhouette (blue wireframe outlines + warm orange floor glow), centred, premium quality (since this is a hero element). Used inside the AI Business Command Centre panel.
3. Reuse existing `pro-sophie.jpg` for one or two client avatars; generate 2 more small client avatar JPGs for variety (Mike, Emma, James W., David, Lucy, Tom — pick 4 unique faces, 256×256 each, fast model). Keep total new image count ≤6.

### Static charts

All charts are inline SVG with fixed paths — no Recharts, no Chart.js, no data, no animation. Use `--reps-orange`, `--reps-green`, `--reps-red`, `--reps-blue` via CSS vars. Donut = 3 stroked circle arcs. Bars = `<rect>` with gradient fill via `<linearGradient>`. Line = single `<path>` with area fill via `<linearGradient>` to `transparent`.

### Tokens & radii (compliance)

- Buttons: `rounded-[10px]`, `shadow-none`.
- Inputs / search: `rounded-[12px]`.
- KPI tiles, content rows, mini cards: `rounded-[18px]`.
- Large chart panels (Revenue Overview, Client Perf, AI Command Centre): `rounded-[22px]`.
- Pills (status, intent, level): `rounded-full`.
- Sidebar nav items: `rounded-[10px]`.
- All colors via semantic classes (`bg-reps-panel`, `text-reps-orange`, etc.) — no raw hex in JSX.
- No `rounded-xl/2xl/3xl`, no 14/20/28/32px radii.

### Out of scope (explicit)

- No new route besides `/dashboard`.
- No nav linking from public site to `/dashboard` in this turn (Phase 1 — keep the route reachable by URL only).
- No real auth gate, no `_authenticated` layout — flat route.
- No `shadcn/sidebar` package wiring; sidebar is plain JSX styled to the mock-up (simpler, fewer moving parts, easier pixel match).
- No interactive state (tabs/dropdowns/checkboxes don't function; they render the default-selected state from the mock-up).

### Verification

After build, screenshot `/dashboard` at desktop (1440), tablet (1024) — at <lg we collapse sidebar to a 64px icon rail and stack rows responsively — and mobile (390, full single column, sidebar becomes top header drawer trigger only, no real drawer). Visually compare against the mock-up PNG and run the REPs compliance audit script.
