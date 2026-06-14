# Leads pipeline — Plan A SHIPPED · Plan B queued

## Plan A (UI 10/10) — ✅ shipped

- **Sliding `LeadDetailSheet`** (non-modal shadcn Sheet, right side, 480px)
  replaces the persistent rail. Includes Pin/Unpin toggle that morphs back
  into the old sticky rail and persists to `localStorage` (`reps.leads.detailPinned`).
- **Kanban view** via `@dnd-kit/core` with 5 columns, drag-to-move calls
  `updateLead({ stage })`, optimistic toast + query invalidation. Toggled via
  `ViewToggle` (Table / Kanban), persisted to `localStorage` (`reps.leads.view`).
- **Low-data mode** in `dashboard_.leads.tsx`:
  - 0 leads → existing empty state
  - 1–4 leads → `GettingStartedCard` (collapses KPI strip + analytics)
  - 5–9 → KPI strip + pipeline, no bottom analytics
  - ≥10 → full page
- **Bug fixes**
  - `1 hour ago` plural-safe via `src/lib/format/relative-time.ts`
  - AI insight subtitle re-derived from score (`<30 Cold · 30–54 Lukewarm ·
    55–74 Warm · ≥75 Hot`) so it can't contradict the number
  - `Convert to client` swaps to a green "View client" CTA when already converted
  - `SourceChipsRow` hides itself when ≤1 source exists
  - `KpiStrip` shows skeletons instead of "—" while loading
- **Keyboard nav** (`useLeadsKeyboard`): J/K (or arrows) cycle selection,
  Enter opens sheet, Esc closes. `?` opens a shortcuts cheatsheet dialog.
- **Tooltips** on every action button explaining what it does / why disabled.

### Files

```
NEW   src/components/leads/LeadDetailSheet.tsx
NEW   src/components/leads/PipelineKanban.tsx
NEW   src/components/leads/ViewToggle.tsx
NEW   src/components/leads/GettingStartedCard.tsx
NEW   src/hooks/useLeadsKeyboard.ts
NEW   src/lib/format/relative-time.ts
EDIT  src/components/leads/SelectedLeadCard.tsx
EDIT  src/components/leads/AiInsightCard.tsx
EDIT  src/components/leads/SourceChipsRow.tsx
EDIT  src/components/leads/KpiStrip.tsx
EDIT  src/routes/_authenticated/_professional/_pro/dashboard_.leads.tsx
ADD   @dnd-kit/core, @dnd-kit/sortable
```

## Plan B (Leads actions wired end-to-end) — next session

What earns the 10th point — the buttons doing real work:

1. **Send message** — in-sheet composer that sends through the existing
   messages system and logs to `lead_activity`.
2. **Book call** — calendar slot picker that creates the booking and
   auto-moves the lead to `call_booked`.
3. **Create proposal** — minimal "send packages X/Y/Z" flow that emails the
   lead and moves to `proposal_sent`.
4. **Convert to client** — actually create the client record and link the
   lead (so the new "View client" CTA goes somewhere real).
5. **Lead activity timeline** in the sheet — every status change, message,
   call booked, proposal sent stamped on the lead.
6. **Auto-stage transitions** — booking a call moves to "Call booked"
   automatically. Sending a proposal moves to "Proposal sent". This is what
   makes a pipeline feel alive vs. a spreadsheet.

---

## Pass A — SHIPPED 2026-06-14

End-to-end specialisms data flow live for Verified members.

**New files**
- `src/components/profile/SpecialismsPicker.tsx` — shared 16-chip picker (max 3).
- `src/routes/_authenticated/_professional/dashboard_.services.tsx` — new `/dashboard/services` route. Manages `professionals.specialisms[]` + `in_person_available` / `online_available` via existing `updateMyDashboardProfile`. Live directory-card preview. Pro upsell card for paid service packages (verified-only).

**Edited**
- `src/components/dashboard/DashboardShell.tsx` — added `"Services"` to `TrainerActive` and a new `Sparkles` nav item in `VERIFIED_NAV` between Public Profile and Shop-front.
- `src/routes/pro.$slug.enquire.tsx` — when a public pro has NO paid service packages (Verified tier), derive the "What kind of coaching" options from `shopFront.specialisms` (one per specialism + a free Discovery call), instead of falling back to the hard-coded James Wilson packages.

**No DB changes.** No locked screen was visually modified.

**Next: Pass B — Settings rebuild + migrations.**
