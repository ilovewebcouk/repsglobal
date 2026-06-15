# Phase 2.0.x — Leads, Enquiries & Directory QA pass

A sub-agent audited the full pipeline. Headline: **most of the plumbing already exists** (AI draft reply, lead scoring, proposals CRUD, mark-replied/archive/spam server fn, follow-up date update, live directory search). The problems are bad wiring, invisible text, duplicate/stub buttons, dropped fields, and static mock data on the directory pages. None of the locked screens need redesigning — this is pure data/UX-depth work.

## Out of scope (deferred)
- **Calendar / Book a call** — no calendar provider wired yet (Phase 2.1).
- **Stripe Connect / paid proposal accept** — needs Connect onboarding (Phase 2.2).
- **Proposals → Programs link** — captured as a P2 follow-up; doesn't block this slice.
- **In-app messenger** — replacing mailto with an in-app composer comes later.

---

## P0 — Bugs and broken actions

### 1. Invisible-text bugs (light text on light dialog background)
- Keyboard shortcuts modal at `dashboard_.leads.tsx:395` and the proposal form inputs both render against the default light `bg-background` while every label / `<kbd>` / input uses `text-white/70`.
- **Fix:** explicitly set `bg-reps-ink text-white` on `DialogContent` at these call sites (and audit `LeadProposalsTab` / `ProposalForm` inputs for the same pattern). No change to the shared `dialog.tsx` primitive.

### 2. Two "Convert to client" buttons, one is broken
- `SelectedLeadCard.tsx:61,191` bottom button only sets `stage = "converted"` — it skips `convert_lead_to_client` RPC and never creates the client row.
- **Fix:** delete the bottom `Convert to client` button. The authoritative `ConvertRow` is already at the top of `LeadDetailSheet`.

### 3. "Three-dots" in pipeline table is a no-op
- `PipelineTable.tsx:214` `MoreHorizontal` just re-opens the sheet.
- **Fix:** turn it into a real DropdownMenu with: Mark replied · Archive · Mark spam · Set follow-up.

### 4. Stub buttons that mislead with toasts
- `SelectedLeadCard.tsx:137` "Book call" → toast only. Replace with a `mailto:` pre-filled with a "let's pick a time" template (interim until calendar lands).
- `SelectedLeadCard.tsx:163` "Create proposal" → toast only, despite the Proposals tab being fully wired. Switch it to activate the Proposals tab in the open sheet.

### 5. Mark replied / Archive / Mark spam — orphaned
- `updateEnquiryStatus` exists at `enquiries.functions.ts:162` and `listLeads` already filters `status != spam`, but no UI calls it.
- **Fix:** expose the three actions via a header dropdown on `LeadDetailSheet` AND the new table-row context menu (item 3 above).

### 6. Public directory shows no real pros
Root causes from the audit:
- **`/in/$location`** (`in.$location.tsx:401`) renders a hardcoded `FEATURED` array. Replace with `useQuery(searchProfessionals({ city: loc.name, limit: 4 }))`.
- **`professionals.is_published`** — confirm the column default and ensure the verification-approval flow flips it to `true`. Without this, even verified pros never surface in `/find-a-professional`.

---

## P1 — Add the depth the user called out

### 7. Show contact details + dropped enquiry fields in the detail sheet
`SelectedLeadCard` currently hides `sender_email`, `sender_phone`, `start_by`, and `budget`. The enquiry form captures all of these.
- Add four clickable rows under "Source":
  - Email → `mailto:` link
  - Phone → `tel:` link (only when present)
  - Start by → plain text ("This week", etc.)
  - Budget → plain text ("Under £50 / session")

### 8. Follow-up date setter
`updateLead` already accepts `follow_up_at`. Add an inline date input (shadcn Popover + Calendar) on the detail card that calls it and invalidates the `leads` query. This makes the "Follow-up due" column actually settable.

### 9. AI Draft reply — close the loop
- Add tone selector (warm / direct / concise) above the existing Draft reply button (server fn already accepts `tone`).
- Surface `ai_reasons[]` as bullets below the AI summary so the score is explainable.
- Both changes touch `AiInsightCard.tsx` and `listLeads` (add `ai_reasons` to `LeadDTO`).

### 10. Proposal email to the client
`proposals.functions.ts:136` flips status to `sent` but never emails the lead. Add a transactional send to `lead.sender_email` (reuse the pattern from `enquiries.functions.ts:96`), Reply-To set to the pro's email. Stays out of Stripe scope — purely informational.

### 11. Directory search depth
- `search.functions.ts:71` — search only matches `headline`/`slug`. Extend to `profiles.full_name` so "James Wilson" actually finds James.
- `search.functions.ts:57` — city filter only matches `professionals.city`. Also OR-match `professional_locations.town` for pros with a structured location row.

---

## P2 — Polish (same turn if cheap)

- `/professions/$profession` featured grid → wire to `searchProfessionals({ profession, limit: 6 })`.
- `trial_booked` stage pill gets its own amber token instead of sharing `new`'s orange.
- Rename "Send message" → "Reply by email" with a `Mail` icon while the in-app composer is still pending.

---

## Technical notes
- All AI continues via Lovable AI Gateway with `google/gemini-3-flash-preview`. No new model swaps.
- No schema migrations required for items 1–11 except optionally adding `ai_reasons` to the `LeadDTO` projection (the column already exists on `enquiries`).
- Server fns touched: `listLeads` (project `ai_reasons`), `proposals.functions.ts` (email on send), `search.functions.ts` (q + city extension). Everything else is UI wiring.
- Locked routes untouched: enquire form (`/pro/$slug/enquire`), homepage, shop-front, marketing pillars. Locked enquiry form remains the source of truth for fields surfaced in the lead sheet.

## Suggested build order
1. Items 1–5 in one slice (UI bug fixes + dedupe actions + Mark replied/Archive/Spam).
2. Items 7–9 in a second slice (contact rows, follow-up picker, AI tone + reasons).
3. Items 6 + 11 + P2 directory item in a third slice (directory wiring + `is_published` audit).
4. Item 10 last (proposal email — small, isolated).