# Leads & Enquiries — tier-split rebuild (10/10 target)

Two surfaces, one data layer. Verified gets a focused, AI-enhanced **Enquiries inbox**. Pro gets the full **Leads CRM** matching your attached mockup pixel-close. Same `enquiries` table underneath, so upgrading carries every record forward.

## 1. Tier routing

- Sidebar item is tier-aware:
  - Verified → "Enquiries" → `/dashboard/enquiries`
  - Pro / Studio / Admin → "Leads" → `/dashboard/leads`
- Cross-tier guards:
  - `/dashboard/leads` on Verified → 302 to `/dashboard/enquiries`
  - `/dashboard/enquiries` on Pro/Studio → 302 to `/dashboard/leads`
- Admin (`cruz.pt@icloud.com`) sees both items and can visit either.

## 2. Verified surface — `/dashboard/enquiries` (focused inbox)

Built fresh, replaces the current redirect-only stub. Same dashboard shell, dark theme, REPs orange.

**Layout**
```text
H1 "Enquiries" + sub "Every enquiry from your REPs profile, in one place."
Stat strip (3 tiles): Enquiries this month · Avg reply time · Reply rate
Two-column body:
  [List]  All / New / Replied / Archived tabs · search · sort by newest/oldest
          Row = avatar, name, goal preview, source chip, "2h ago", unread dot
  [Pane]  Selected enquiry: full message · source · location · contact buttons
          AI summary card (auto-summary + 1 recommended action)
          AI draft reply (one click → opens mail client prefilled, or copy)
          Mark replied · Archive · Mark spam
Upgrade nudge (bottom, dismissible): "You're replying in 4h. Top pros reply in <5 min on autopilot — see Pro →"
```

**Behaviour**
- Email notification still fires on every new enquiry (existing `/lovable/email/transactional/send` flow).
- AI summary + draft reply run server-side on enquiry creation (already wired via `score.server.ts` — reuse).
- No stages, no pipeline, no forecast, no follow-up sequences, no bulk actions, no scoring numbers shown.
- Stat strip computed server-side from `enquiries` rows scoped to trainer.

## 3. Pro surface — `/dashboard/leads` (full CRM, matches mockup)

Rebuild to match the attached mockup exactly. Existing route file is replaced; existing components are rewritten.

**Layout (matches mockup top-to-bottom)**
```text
H1 "Leads pipeline" + sub "Track enquiries, prioritise follow-ups and convert leads into clients."
                                          [Search]  [Import leads]  [+ New lead]

KPI strip — 6 tiles (matches mockup exactly):
  New leads · Call booked · Proposal sent · Trial booked · Converted · Potential monthly revenue
  Each tile: eyebrow label · big number · delta vs last week with up-arrow

Lead pipeline panel (PCard, rounded-[18px]):
  Header: "Lead pipeline" + "32 active leads · sorted by priority and follow-up" + inline search
  Stage chips row: All leads · New · Call booked · Proposal sent · Trial booked · Converted
  Source chips row: SOURCE label · All sources · REPS profile · Directory search · Website · Referral · Instagram
  Table: Lead · Goal · Source · Status · Est. value · Follow-up · Priority · Actions (email/call/more)
  Selected row highlighted with subtle orange tint

Sticky right rail (360px, lg:sticky lg:top-4):
  SelectedLeadCard:
    Avatar · Name · "New lead" pill · location
    Source · Goal · Estimated value · Preferred format · Location · Last activity · Follow-up due
    Lead message quote block (rounded-[16px], subtle bg)
    Actions: Book call (primary) · Send message · Create proposal · Convert to client
  AiInsightCard (the one you liked):
    Sparkle icon + "AI lead insight" + "High-intent enquiry · auto-scored"
    AI-generated paragraph (summary + recommended action)
    Draft reply (full-width orange CTA)

Bottom row (3 cards, equal width):
  Follow-ups due (next 48h) — list of leads with "Open" buttons
  Lead sources (last 30d) — labelled rows with progress bars + %
  Conversion performance (rolling 30d) — Lead→Call, Call→Proposal, Proposal→Client % + Avg client value tile
```

**10/10 moves on top of the mockup** (these are what push it past every fitness competitor):

1. **Auto-score on arrival** — every new enquiry (manual or from the public form) lands with `ai_score`, `ai_band`, `ai_summary`, `recommended_action`, `predicted_conversion_pct` already populated. No empty AI cards, ever. (Wired via existing `score.server.ts` — reuse.)
2. **Live "Refresh AI" button** on the insight card — re-runs scoring with any new context (notes added, message edited).
3. **Bulk-action bar** above the table — appears when ≥1 row checked: Move to stage… · Assign follow-up date… · Archive · (Send sequence — disabled with "Coming in 2.1" tooltip).
4. **Smart sort** — default sort = priority × follow-up urgency (hot + due today first), not just created_at.
5. **Stage transitions are one click** — clicking the status pill in the table opens a tiny popover to move stage, no full modal.
6. **Inline "Why this score?"** — hover the AI score → tooltip with the 2-3 reasons the model used.
7. **Predicted monthly revenue tile** computed from `sum(estimated_value × predicted_conversion_pct)` across active leads — turns the model into a number the trainer cares about.
8. **Empty-state for new Pro accounts** — when 0 leads exist, show the same chrome but with sample leads ghosted in and a "Share your REPs profile" CTA.

## 4. Server work (no schema change — already in place)

`enquiries`, `lead_activity`, `lead_proposals` tables already exist with the needed fields (`stage`, `priority`, `estimated_value_pence`, `follow_up_at`, `ai_*`). Only function additions:

- `getEnquiryStats({ scope: trainer })` → for Verified strip (this-month count, avg reply, reply rate).
- `getLeadKpis()` → extend with `stage_counts`, `source_breakdown_30d`, `follow_ups_due_48h`, `conversion_rates_30d`, `potential_monthly_revenue`, `deltas_vs_prev_week`.
- `bulkUpdateLeadStage({ leadIds, stage })` — for bulk-action bar.
- `convertLeadToClient({ leadId })` — moves an `enquiries` row into `coach_client` + marks stage `converted`.

All as `createServerFn` with `requireSupabaseAuth`. AI calls stay server-only via Lovable AI Gateway (`google/gemini-3-flash-preview`).

## 5. Components

Under `src/components/leads/`:

- New: `KpiStrip.tsx` (6 tiles, mockup chrome), `StageChipsBar.tsx`, `SourceChipsRow.tsx`, `BulkActionBar.tsx`, `SelectedLeadCard.tsx`, `AiInsightCard.tsx`, `FollowUpsDueCard.tsx`, `LeadSourcesCard.tsx`, `ConversionPerformanceCard.tsx`, `StagePopover.tsx`.
- Rewrite: `PipelineTable.tsx` (add checkboxes + new column set), `dashboard_.leads.tsx` (full layout).
- New for Verified: `src/components/enquiries/EnquiryList.tsx`, `EnquiryDetailPane.tsx`, `EnquiryStatStrip.tsx`, `UpgradeNudge.tsx`.
- Rewrite: `dashboard_.enquiries.tsx` (full inbox UI, replaces redirect stub).
- Delete: nothing — keep `LeadDrawer.tsx` for the future "Edit lead" full modal.

## 6. Sidebar

`DashboardShell.tsx`: tier-aware nav item.
- Verified → `{ label: "Enquiries", href: "/dashboard/enquiries", icon: Inbox }`
- Pro/Studio/Admin → `{ label: "Leads", href: "/dashboard/leads", icon: Target }`
- Admin sees both (admin-only).

## 7. Compliance & verification

Per `reps-build-compliance`:
- Tokens only (no hex in components). Brand orange = semantic classes.
- Radii: KPI tiles + pipeline + rail + bottom cards = `rounded-[18px]`; chips full-pill; inputs `12px`; buttons `10px` flat (no shadow); right-rail message quote `rounded-[16px]`.
- Emerald only for the `converted` status pill (allowed: status).
- No CIMSPA, no "UK", no "booking fee".

Before reporting done:
1. `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` exits 0.
2. Screenshot `/dashboard/leads` at 1440×900 as Pro and confirm 1:1 with mockup.
3. Screenshot `/dashboard/enquiries` at 1440×900 as Verified.
4. Cross-tier 302 verified both directions.
5. Create a new lead → confirm AI insight card populated immediately.

## 8. Out of scope (queued, not in this build)

- **Phase 2.1**: Resend two-way email threading, Twilio SMS/WhatsApp, Cal.com booking embed, PWA push notifications, "Send sequence" bulk action.
- **Phase 2.2**: ElevenLabs voice replies, AI Lead Coach daily 08:00 brief, AI voice agent callback for hot leads, benchmarking vs top 10%.
- **Phase 2.3**: Instagram/Meta DM ingestion, CSV import (button shows toast "Coming soon" for now).

Approve and I'll build it.
