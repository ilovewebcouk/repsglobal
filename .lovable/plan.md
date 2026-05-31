# Check-ins Review Page — Build Plan

## Route
Create `src/routes/dashboard_.check-ins.tsx` (flat-nested pattern, matches the other dashboard pages: profile, leads, calendar, programs, clients/$slug). Route string: `/dashboard_/check-ins`, URL: `/dashboard/check-ins`.

## Naming note
You asked about naming the mock-up page. Inside the route file the page component will be `CheckInsReviewPage`. If you specifically want the internal label "settlement" used somewhere visible (heading, file, or comment), say where — by default I will use **"Check-ins"** as the visible H1 per the spec, and `CheckInsReviewPage` as the component name. No "settlement" label will appear unless you confirm.

## Shell reuse
Reuse the existing professional dashboard shell already used by `dashboard_.profile.tsx`, `dashboard_.leads.tsx`, `dashboard_.calendar.tsx`, `dashboard_.programs.tsx`, `dashboard_.clients.$slug.tsx`:
- Same dark sidebar, same 15-item nav list, **Check-ins** active (orange accent).
- Same dark TopBar with title + subheading + right-side actions (`Create template`, `Send check-in`, `Export`).
- Black/charcoal page background, dark cards, subtle borders, Inter typography.

## Layout (12-col grid)

```text
[ 6 KPI cards row — Due today | Submitted | Reviewed | At risk | Avg adherence | Response time ]

[ Inbox 3col ] [ Sarah Johnson review panel 6col ] [ Right stack 3col ]
                                                    - AI check-in summary
                                                    - Coach response (textarea)
                                                    - Risk indicators
                                                    - Next actions

[ At-risk clients 4col ] [ Check-in templates 4col ] [ Adherence trends 4col ]
```

### Left — Check-in inbox (col-span-3)
Search input (12px radius), filter chips (pill), 6 client rows. Sarah Johnson selected (orange left accent + subtle orange-tinted bg). Each row: avatar, name, programme, submitted/due timestamp, adherence %, status badge, priority dot.

### Centre — Sarah Johnson weekly check-in panel (col-span-6, 22px radius)
- Header: avatar, name, programme, week 5/12, submitted timestamp, status + priority badges.
- 4 metric tiles (Adherence 85%, Energy 4/5, Sleep 7 hrs, Stress Mild).
- 4 question/response blocks with the verbatim copy from the spec.
- Progress metrics grid (8 data points).
- Progress chart card with tabs (Weight / Adherence / Sleep / Steps) and custom inline-SVG orange trend line + gradient fill (same pattern as the client profile page chart).

### Right stack (col-span-3)
1. **AI check-in summary** — orange-tinted panel, Sparkles icon, summary text, 5 suggested actions, `Use summary` + `Edit` buttons.
2. **Coach response** — textarea (12px radius) with prefilled draft, `Send response` / `Save draft` / `Add note`.
3. **Risk indicators** — 4 items with restrained coloured status dots.
4. **Next actions** — checklist of 5 items.

### Bottom row (3 × col-span-4 cards, 16px radius)
- At-risk clients (3 rows + `Review risk list`)
- Check-in templates (5 rows + `Manage templates`)
- Adherence trends (4 metrics + small inline-SVG orange spark line)

## Design tokens (locked)
- Brand orange via existing semantic classes (`bg-reps-orange`, `text-reps-orange`, etc.) — no raw hex in components.
- Radii: buttons `rounded-[10px]`, inputs/textarea `rounded-[12px]`, cards `rounded-[16px]`, large panels `rounded-[22px]`, pills/chips/badges `rounded-full`.
- No shadows on buttons.
- Status dot colours: use existing semantic tokens (orange for medium, red/destructive for high, muted for low/reviewed).

## Phase 1 scope guard
Static placeholder data only. No Supabase, no AI calls, no auth, no real textarea submission, no DB. Buttons are visual only.

## Post-flight
Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` and capture a full-page screenshot of `/dashboard/check-ins` before handing back.

## Files
- create `src/routes/dashboard_.check-ins.tsx`
- `src/routeTree.gen.ts` will auto-regenerate via the TanStack Router Vite plugin (no manual edit needed).

---

**Confirm before I build:**
1. Component name `CheckInsReviewPage`, visible H1 "Check-ins" — OK? Or do you want "settlement" appearing anywhere?
2. Anything else to adjust before I implement?