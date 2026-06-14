---
name: Leads & Enquiries tier split
description: Verified gets /dashboard/enquiries focused inbox; Pro/Studio get full /dashboard/leads CRM matching mockup. Cross-tier 302s. Shared enquiries table.
type: feature
---
**Locked 2026-06-14.** Two surfaces, one data layer (`enquiries` table).

**Verified → `/dashboard/enquiries`**: focused inbox. 3-tile stat strip (this-month count, avg reply, reply rate). Two-pane (list + detail). Tabs: All/New/Replied/Archived. AI summary + AI draft reply per enquiry (reuses `scoreLead` + `draftLeadReply`). Mark replied / archive / spam. Dismissible upgrade nudge bottom. No stages, no pipeline, no forecasts. Sidebar label = "Enquiries" (Inbox icon).

**Pro/Studio → `/dashboard/leads`**: full CRM matching attached mockup.
- 6-tile KPI strip: New / Call booked / Proposal sent / Trial booked / Converted / Potential monthly revenue. Each tile shows weekly delta.
- Lead pipeline panel: H2 + active count + inline search; StageChipsBar (All/New/Call booked/Proposal sent/Trial booked/Converted); SourceChipsRow (data-driven sources).
- PipelineTable: row checkbox · Lead+initials · Goal · Source · Status pill · Est. value · Follow-up · Priority pill · Actions (email/call/more). Smart sort = priority × follow-up urgency × score.
- BulkActionBar (appears when ≥1 selected): Move to stage / Archive / Send sequence (disabled, "Coming in 2.1").
- Sticky right rail (380px): SelectedLeadCard (avatar + pill + field list + lead message quote + 2x2 action grid Book call/Send message/Create proposal/Convert to client) + AiInsightCard (orange gradient, sparkle, AI score tooltip, summary+recommended action, big "Draft reply" CTA).
- Bottom 3-up row: FollowUpsDueCard / LeadSourcesCard (progress bars %) / ConversionPerformanceCard (lead→call, call→proposal, proposal→client + avg client value tile).

**Cross-tier routing**: both routes use `beforeLoad` reading `context.trainerTier` and 302 to the right surface.

**Server**: `getLeadKpis` returns `stage_counts`, `weekly_deltas`, `potential_monthly_revenue_pence`, `follow_ups_due_list[]`, `conversion_rates`. `getEnquiryStats` for Verified strip. All `createServerFn` + `requireSupabaseAuth`.

**Components**:
- `src/components/leads/`: KpiStrip, StageChipsBar, SourceChipsRow (+ sourceLabel map), PipelineTable, BulkActionBar, SelectedLeadCard, AiInsightCard, FollowUpsDueCard, LeadSourcesCard, ConversionPerformanceCard.
- `src/components/enquiries/`: EnquiryStatStrip, EnquiryList, EnquiryDetailPane, UpgradeNudge.

**Deleted**: `src/components/leads/Kpis.tsx`, `src/components/leads/LeadDrawer.tsx` (replaced).

**Compliance**: radii 16/18 only; orange via semantic tokens; emerald only on `converted` pill (allowed status); flat buttons; no CIMSPA / UK / booking fee.

**Out of scope (queued)**: Resend two-way email (2.1), Cal.com book-call wiring (2.1), Twilio SMS (2.1), CSV import (2.3), ElevenLabs voice (2.2). "Book call", "Create proposal", "Send sequence", "Import leads" buttons currently toast "Coming in Phase 2.x".
