## Slice 3 — Notes & activity feed (Pro)

Add an Activity tab to the existing `LeadDetailSheet` that reads from `lead_activity` and lets Pros add free-text notes. No schema changes — `listLeadActivity` already exists and `lead_activity` is already written on stage changes.

### Server (src/lib/leads/leads.functions.ts)
- Add `addLeadNote` server fn (POST, `requireSupabaseAuth`)
  - input: `{ enquiryId: uuid, body: string (1..2000) }`
  - verify `enquiries.professional_id = userId`, then insert into `lead_activity` with `type: "note"`, `payload: { body }`, `created_by: userId`
- Extend `LeadActivityDTO` rendering: existing fn already returns `type` + `payload_json` — no change needed.

### UI
- New `src/components/leads/LeadActivityTab.tsx`
  - `useQuery(["lead-activity", lead.id], listLeadActivity)`
  - Renders timeline: icon + label per `type` (`note`, `stage_change`, future-safe fallback), `timeAgo(created_at)`
  - Textarea (shadcn) + "Add note" button → `useMutation(addLeadNote)` → invalidate activity key
- Update `src/components/leads/LeadDetailSheet.tsx`
  - Wrap existing body in shadcn `Tabs`: **Details** (current `SelectedLeadCard` + `AiInsightCard`) and **Activity** (new tab)
  - Default tab: Details
  - Pro-only: the sheet already only renders inside the Pro pipeline route, so no extra tier gate needed

### Out of scope
- Editing/deleting notes, @mentions, attachments, email reply log (will come with reply composer in a later slice)
- Verified inbox stays unchanged — activity feed is Pro-only

### Files
- edit `src/lib/leads/leads.functions.ts` (+ `addLeadNote`)
- create `src/components/leads/LeadActivityTab.tsx`
- edit `src/components/leads/LeadDetailSheet.tsx` (wrap in Tabs)
