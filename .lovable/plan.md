# Phase B — Leads & Enquiries (Verified inbox + Pro CRM)

## What we're building

Two distinct surfaces on the same `enquiries` row:

- **Verified (£99/yr)** — simple **Enquiries inbox**: list, detail, status (new → read → replied → archived → spam), unread badge. Replies go out via the user's email client (`Reply-To` already wired).
- **Pro Founding (£59/mo)** — full **lead CRM** on top of the inbox: pipeline (table + kanban), AI score, notes/activity, **proposals**, and **convert-to-client** flow leading into a **Client roster** with invites.
- **Studio** — same UI as Pro (gate already passes), no extra work in Phase B.

Phase 1 mockups stay pixel-identical. All new UI sits inside the existing `DashboardShell` and `LeadDetailSheet`.

## Source of truth

- `docs/09_phase2_verified.md` (scope + locked-screen rule)
- `docs/03_reps_page_by_page_specification.md` (dashboard nav, Pro KPIs)
- `docs/04_database_schema_and_data_model.md` (`lead_status`, `lead_stage`, roster model)
- `src/mockups/reps_fullpage_professional_dashboard_v1.png` (Pro visual SoT)
- `mem://phase/2.0-verified-scope`

## Current state (already built)

- `enquiries` table carries **both** `status` (inbox) and `stage` (pipeline) plus AI fields and `converted_client_id` link.
- Verified inbox UI is **already built** at `src/routes/_authenticated/_professional/dashboard_.enquiries.tsx` — but a stray `useProGuard("Enquiries inbox")` call blocks Verified users from reaching their own feature.
- Pro pipeline UI is fully built under `_pro/dashboard_.leads.tsx` with 14 components in `src/components/leads/`, plus server fns in `src/lib/leads/leads.functions.ts` and `src/lib/enquiries/enquiries.functions.ts`.
- Tier gating works via `subscriptions.tier` → `_professional/route.tsx` → `useTrainerTier()` → `_pro` layout renders `UpgradePanel` for Verified.
- DB tables `lead_activity`, `lead_proposals`, `client_roster`, `clients`, `coach_client`, `client_invites` all exist with RLS.

## Gaps Phase B closes

| Area | Gap |
|---|---|
| Verified | Inbox blocked by `useProGuard`; no unread badge; no spam button in UI |
| Pro pipeline | `lead_activity` written on stage change but no UI to view; no note-adding |
| Pro proposals | `lead_proposals` table exists, zero code reads/writes it |
| Pro → Client | `converted_client_id` never set; no `convertLeadToClient` fn |
| Pro clients | No `/dashboard/clients` route, no roster fns, no invites flow |

## Slice order (smallest shippable first)

### Slice 1 — Unblock Verified inbox
- Remove `useProGuard("Enquiries inbox")` from `dashboard_.enquiries.tsx:83` and the related `blocked` early-return.
- Add a "Mark as spam" action in the detail sheet (server fn already supports `"spam"`).
- In `DashboardShell.tsx`, make the **Enquiries** nav item visible to Verified (currently labelled but reachable only by Pro effectively).
- Acceptance: a Verified user signs in, sees Enquiries in the nav, opens the list, marks new/replied/archived/spam.

### Slice 2 — Unread badge in nav
- `useQuery(getEnquiryStats)` at `_professional/route.tsx` layout level; pass count into `DashboardShell` nav badge.
- Acceptance: new public enquiry → badge increments on next dashboard load.

### Slice 3 — Notes & activity feed (Pro)
- New tab in `LeadDetailSheet`: "Notes & activity" — reads `listLeadActivity`, shows stage changes + notes.
- New server fn `addLeadNote(enquiryId, text)` → inserts `lead_activity` with `type: "note"`.
- Acceptance: a Pro user opens a lead, adds a note, sees it in the feed alongside stage changes.

### Slice 4 — Proposals (Pro)
- Server fns: `createProposal`, `listProposals`, `updateProposalStatus` against `lead_proposals`.
- New "Proposal" tab in `LeadDetailSheet` — structured form (title, services, price, notes) written to `lead_proposals.body` jsonb.
- On send, set `enquiries.stage = "proposal_sent"`.
- Acceptance: Pro creates a proposal, lead auto-advances to "Proposal sent".

### Slice 5 — Convert lead → client (Pro)
- Server fn `convertLeadToClient(enquiryId)` — single transaction:
  - sets `enquiries.converted_client_id` and `stage = "converted"`,
  - inserts `client_roster` row (denormalised name/email, `status = "active"`, `invite_id = null`),
  - logs `lead_activity` `"converted"`.
- "Convert to client" button in `LeadDetailSheet`, visible when `stage IN ('trial_booked','proposal_sent')`.
- Acceptance: convert action moves the lead off the pipeline and creates a roster row.

### Slice 6 — Client roster list (Pro)
- New route `src/routes/_authenticated/_professional/_pro/dashboard_.clients.tsx`.
- Server fn `listMyClients` (reads `client_roster` by `professional_id`) + `updateClientRosterEntry`.
- List + detail sheet (name, email, status, linked enquiry, notes). No bookings/programmes yet.
- Fix `DashboardShell.tsx:147` Clients nav link target.
- Acceptance: converted clients appear in `/dashboard/clients`; clicking opens detail.

### Slice 7 — Client invites + coach_client (Pro)
- "Invite client" dialog → writes `client_invites` row + `client_roster` row with `status = "invited"`.
- On invite acceptance (existing auth flow), populate `client_roster.auth_user_id`, create `coach_client` link.
- Acceptance: Pro invites by email, recipient signs up, appears as active client linked to the Pro.

## Technical notes

- All new server fns: `createServerFn` in `src/lib/leads/*.functions.ts` and `src/lib/clients/*.functions.ts`, gated by `requireSupabaseAuth` + explicit `professional_id = userId` filter (matches existing pattern; no client-side Supabase).
- No schema changes needed for Slices 1–6. Slice 7 may need a small migration if `client_invites` is missing columns; will confirm before writing.
- No visual changes to locked Phase 1 mockups. New UI fits inside existing `DashboardShell`, `LeadDetailSheet`, and shared admin/dashboard primitives.
- Tier-aware nav: extend `DashboardShell` nav config to mark items as `verified+` vs `pro+`; render Verified-only items always, Pro-only items always but with `UpgradePanel` on the destination route (current pattern).

## Out of scope (Phase 2.1+)

In-app reply composer for Verified, real messaging, AI auto-replies, bookings/payments, client programmes, the stub `/dashboard/messages` route, Studio multi-seat.

## Suggested first step

Ship Slice 1 by itself (≈15 min change) to unblock Verified users immediately, then proceed slice-by-slice with approval between Slice 4 and Slice 5 (the conversion point where data starts crossing tables).
