
# Phase 2 Leads — the 10/10 roadmap

Goal: replace the current weak `/dashboard/enquiries` page with a unified, AI-powered Leads pipeline that is genuinely best-in-class in the fitness platform space. Verified sees the full UI with Pro-only features locked. Pro unlocks everything. Ships in three phases — each one is shippable on its own.

```text
2.0  Unified pipeline + full AI layer + Verified lock           8.5/10
2.1  Two-way email/SMS + Cal.com scheduling + push notifs        9.5/10
2.2  ElevenLabs voice replies + AI Lead Coach + voice agent      10/10
```

Naming: route is `/dashboard/leads`, sidebar item is "Leads". Old `/dashboard/enquiries` becomes a redirect so deep links keep working.

---

## Phase 2.0 — Unified Pipeline + AI Layer (ship first)

### UI (single page, mirrors the mock you showed)
- One H1 ("Leads pipeline") + sub-text. No duplicate hero. Global search. "Import leads" + "+ New lead" CTAs.
- **KPI strip** (6 tiles): Active leads · Hot leads (score ≥80) · Reply-time avg · Conversion % (30d) · Est. pipeline value · Predicted revenue (30d). Pro = real numbers. Verified = blurred + "Upgrade to unlock" overlay.
- **12-col body grid:**
  - 8-col pipeline: stage filter pills (New / Contacted / Call booked / Proposal sent / Trial booked / Converted / Lost), source filter pills, sortable table (Lead / Goal / Source / Stage / AI score / Est. value / Follow-up / Actions). Bulk select.
  - 4-col sticky right rail: selected lead detail + **AI insight card** (intent score 0-100, AI summary, recommended next action, "Draft reply" button, predicted conversion %).
- **Bottom row** (3 cards): Follow-ups due (next 48h) · Lead sources (30d donut) · Conversion funnel (30d).
- Verified lock pattern: full layout renders, Pro-only blocks wrapped in `<ProLock>` with single upgrade CTA → `/pricing`.

### AI layer (all server-side, Lovable AI Gateway, `google/gemini-3-flash-preview`)
Server functions in `src/lib/leads-ai.functions.ts`:
- `scoreLead(leadId)` → `{ score, band, summary, recommendedAction, predictedConversionPct, reasons[] }`
- `draftLeadReply(leadId, tone?)` → `{ subject, body }` tuned to the pro's voice
- `suggestNextActions(leadId)` → up to 3 ranked actions
- `forecastRevenue(proId)` → 30-day projected revenue
- `detectAtRisk(proId)` → stalled leads + re-engagement copy
- Cron: hourly refresh of scores/forecasts for active leads (pg_cron → `/api/public/hooks/leads-refresh`).

### Schema (one migration)
Extend `enquiries`:
- `stage` (enum: new/contacted/call_booked/proposal_sent/trial_booked/converted/lost, default 'new')
- `priority` (low/medium/high)
- `estimated_value_pence` (int)
- `follow_up_at` (timestamptz)
- `converted_client_id` (uuid → clients)
- `ai_score` (int 0-100), `ai_band` (cold/warm/hot), `ai_summary` (text), `ai_recommended_action` (text), `ai_predicted_pct` (int), `ai_updated_at` (timestamptz)

New tables:
- `lead_activity` (id, enquiry_id, pro_id, type, payload jsonb, created_at) — per-touch log
- `lead_proposals` (id, enquiry_id, pro_id, status, body jsonb, sent_at) — Pro-only, future-friendly

All with GRANTs, RLS scoped to `auth.uid()` + service_role, `service_role` for cron writes.

### Files (Phase 2.0)
- New route `_authenticated/_professional/dashboard.leads.tsx` + `~10` components under `src/components/leads/` (KPIStrip, PipelineTable, LeadDrawer, AIInsightCard, FollowUpsCard, SourcesCard, FunnelCard, ProLock, NewLeadDialog, ImportLeadsDialog).
- `src/lib/leads.functions.ts` (CRUD, stage moves, bulk ops) + `src/lib/leads-ai.functions.ts` (AI calls).
- Sidebar rename Enquiries → Leads. `dashboard.enquiries.tsx` becomes redirect.
- Out of scope this phase: any external comms, scheduling, voice. Replies still open mailto.

---

## Phase 2.1 — Real Comms + Scheduling + Push (+~1 week)

### Two-way messaging inside REPs
- **Resend** (already used for project email): threaded inbox per lead, open/click tracking, inbound replies via Resend inbound parsing → webhook `/api/public/webhooks/resend-inbound`.
- **Twilio** (new standard connector): SMS + WhatsApp Business. Outbound from `sendLeadSms()` server fn; inbound via `/api/public/webhooks/twilio-inbound`.
- Unified thread view in the lead drawer: email + SMS + WhatsApp + AI drafts, ordered by time. "Send" picker chooses channel.

### Scheduling
- **Cal.com embed** (open source, no per-seat fee): each pro connects their Cal.com account in `/dashboard/integrations`. "Book a call" button in the lead drawer drops a scheduling link or opens the embed inline.
- Calendar sync (Google/Apple) handled by Cal.com — no extra work on our side.

### Auto follow-up sequences
- Visual sequence builder (3-step default: Day 0 email · Day 2 SMS · Day 5 WhatsApp), AI-written, trainer-approved before activation, auto-stop on reply or stage change.

### Push notifications (PWA)
- Service worker + web-push. Triggered on new lead, hot-lead alert (score ≥85), inbound reply.

### Schema (2.1 migration)
- `lead_messages` (id, enquiry_id, pro_id, channel, direction, subject, body, status, opens_at, clicks_at, created_at)
- `lead_sequences` + `lead_sequence_steps` + `lead_sequence_runs`
- `pro_integrations` (pro_id, provider, config jsonb) — Cal.com tokens etc.
- `push_subscriptions` (user_id, endpoint, keys, created_at)

### Connectors needed (you approve at link time)
- Twilio · Resend (already in project) · Cal.com (via OAuth — no connector needed, per-pro tokens stored in `pro_integrations`).

---

## Phase 2.2 — Voice + AI Lead Coach + Voice Agent Callback (+~1 week)

### ElevenLabs voice replies
- "Send as voice note" button on every AI-drafted reply. Pro records 60s of their voice once (cloned via ElevenLabs Voice Library), then every voice reply sounds like them. Sent as MP3 via WhatsApp/SMS/email.
- Inbound voice notes (WhatsApp/Instagram) auto-transcribed via ElevenLabs Scribe and shown inline in the thread.

### AI Lead Coach (daily proactive brief)
- Cron 08:00 local time per pro → generates "Today's brief": hot leads cooling, stalled leads, reply-time benchmark vs top 10%, revenue forecast, 3 ranked actions for the day. Delivered as in-app card + email + push.

### AI voice agent callback (opt-in per lead)
- When a lead scores ≥85 and submits an enquiry, pro can click "Call this lead now" → ElevenLabs Conversational AI agent (pro's cloned voice) places an outbound call via Twilio Voice, qualifies the lead with a scripted-but-natural flow ("Hi, this is [Pro] — got your enquiry, can I ask a couple of quick questions?"), and books a discovery call into the pro's Cal.com calendar. Full call transcript + recording stored on the lead.
- Trainer disclosure on hero CTA + first AI line ("Hi, this is an AI assistant for [Pro]…") to stay compliant. Per-lead opt-in toggle on the New Lead form ("OK with AI callback?"). Pro can disable entirely in settings.

### Benchmarking
- Anonymised "you vs top 10% of REPs pros" tiles: reply time, conversion %, avg lead value, follow-up consistency. Drives behaviour change.

### Schema (2.2 migration)
- `lead_voice_calls` (id, enquiry_id, pro_id, twilio_call_sid, elevenlabs_conversation_id, duration_s, status, transcript, recording_url, outcome, created_at)
- `pro_voice_profiles` (pro_id, elevenlabs_voice_id, status, sample_url, created_at)
- `pro_ai_settings` (pro_id, voice_agent_enabled, voice_agent_disclosure, daily_brief_enabled, …)

### Connectors needed
- ElevenLabs (standard connector, syncs `ELEVENLABS_API_KEY`).
- Twilio Voice (same Twilio connection as 2.1 — Voice product enabled in Twilio console).

---

## Tier matrix (final)

| Capability | Verified £99/yr | Pro £59/mo |
|---|---|---|
| Pipeline table + filters | ✅ (read + manual move) | ✅ |
| AI score + summary on each lead | locked preview (1 visible, rest blurred) | ✅ |
| AI draft reply | locked | ✅ |
| Two-way email/SMS/WhatsApp | locked | ✅ |
| Cal.com scheduling | locked | ✅ |
| Auto follow-up sequences | locked | ✅ |
| Voice replies (ElevenLabs) | locked | ✅ |
| AI voice agent callback | locked | ✅ |
| Daily AI Lead Coach brief | locked | ✅ |
| KPI strip + forecasts + benchmarks | blurred | ✅ |
| Bulk actions / CSV import | locked | ✅ |

Studio stays waitlist (multi-coach roll-up of all of the above) — no new work this roadmap.

---

## Out of scope (queued for Phase 2.3)
- Instagram DM + Facebook Messenger ingestion (needs Meta app review — 4-6 wks lead time)
- Multi-language voice agents
- Studio multi-coach pipeline roll-up
- Native iOS/Android apps (PWA push covers 90% of the value)

---

## Technical notes (collapsible detail)

- All AI calls server-side via Lovable AI Gateway. `LOVABLE_API_KEY` never touches client.
- All voice/SMS/email calls via `createServerFn` in `src/lib/*.functions.ts` (TanStack pattern).
- Webhooks live under `/api/public/webhooks/*` with signature verification (Twilio HMAC, Resend HMAC, ElevenLabs token).
- Cron via `pg_cron` + `pg_net` calling `/api/public/hooks/*` with `apikey` header (Supabase anon key).
- Migrations include GRANTs on every new public-schema table — `service_role` always, `authenticated` scoped via RLS to the owning pro.
- ProLock component reads `useSubscription()` tier and overlays Pro-only blocks — no business logic on the client.

---

## Confirmation needed before build
You've already picked **full 10/10 roadmap** and **AI voice agent callback**. On approval I'll:
1. Start Phase 2.0 immediately (migration → server fns → UI → wire AI).
2. Pause for your sign-off on Phase 2.0 before moving to 2.1.
3. Link Twilio + ElevenLabs connectors at the start of 2.1 and 2.2 respectively (one click each).

This is the plan that takes REPs from "another fitness directory" to "the only fitness platform where leads call themselves back."
