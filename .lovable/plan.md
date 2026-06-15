## Slice 4 — Proposals (Pro)

Add a third "Proposals" tab to `LeadDetailSheet` letting Pros draft, send, accept, decline, or withdraw structured proposals against a lead. Backed by the existing `lead_proposals` table (no schema changes). Status transitions also log into `lead_activity` so they appear in the Activity tab.

### Data shape (`body` jsonb)
```
{
  title: string,
  summary?: string,
  price_pence: number,
  cadence: "one_off" | "weekly" | "monthly" | "package",
  sessions?: number,
  start_date?: ISO date (yyyy-mm-dd),
  notes?: string
}
```
Statuses: `draft | sent | accepted | declined | withdrawn`.

### Server (`src/lib/leads/proposals.functions.ts`)
- `listProposals({ enquiryId })` → returns rows ordered by `created_at desc`
- `createProposal({ enquiryId, body, status: "draft" | "sent" })` → insert; if `sent`, set `sent_at = now()` and log `lead_activity` `proposal_sent`
- `updateProposal({ id, body?, status? })` → patch; on status change to `sent` set `sent_at`; on `accepted | declined | withdrawn` log `lead_activity` `proposal_<status>`
- All gated by `requireSupabaseAuth` + `professional_id = userId` ownership check (verify via `enquiries.professional_id` on create, `lead_proposals.professional_id` on update)

### UI
- New `src/components/leads/LeadProposalsTab.tsx`
  - Top: "New proposal" button → opens inline form (shadcn `Input`/`Textarea`/`Select`/`RadioGroup`) for the body fields
  - List: stacked cards showing title, formatted price, cadence + sessions, status badge (color by status: draft=neutral, sent=blue, accepted=emerald, declined/withdrawn=muted), `timeAgo(created_at)`
  - Per-card actions depending on status: draft → Send / Edit / Delete-as-withdrawn; sent → Mark accepted / Mark declined / Withdraw; terminal → read-only
- Update `LeadDetailSheet.tsx` tabs: `grid-cols-3` with Details / Activity / Proposals
- Reuse `Tabs` already added in Slice 3
- Price input in £, persisted as pence

### Out of scope
- Public proposal share link / client acceptance flow (will arrive with bookings/payments)
- Email delivery of proposal (manual "I've sent this externally" for now)
- Auto-converting accepted proposal into a client (Slice 5)

### Files
- create `src/lib/leads/proposals.functions.ts`
- create `src/components/leads/LeadProposalsTab.tsx`
- create `src/components/leads/ProposalForm.tsx` (inline form, kept separate for readability)
- edit `src/components/leads/LeadDetailSheet.tsx` (add 3rd tab)
