---
name: Campaigns module roadmap
description: Future scope for /admin/campaigns (mini-Mailchimp). What v1 ships and what comes later.
type: feature
---
Campaigns lives at `/admin/campaigns` as its own admin section (NOT inside Support). Support = reactive inbound triage. Campaigns = proactive outbound.

## v1 shipped (current)
- Sidebar entry "Campaigns" under Admin → Platform group, Megaphone icon.
- Page shows: New campaign button (top-right), CampaignsList table (subject / inbox / recipients / sent / failed / when), CampaignDrawer for detail.
- ComposeDialog supports: Direct (search a trainer by name/email) and Broadcast (tier picker: Verified / Pro / Studio).
- Files: `src/routes/admin_.campaigns.tsx`, `src/components/admin/campaigns/{ComposeDialog,CampaignsList}.tsx`, `src/lib/campaigns/{outbound,campaigns}.functions.ts`.
- DB: `outbound_campaigns` + `outbound_campaign_recipients` (already existed).

## Out of scope for v1 (roadmap, do NOT scope-creep without explicit ask)
- Templates library (welcome / renewal nudge / re-engagement / tier upsell).
- AI compose — generate subject + body from a brief via Lovable AI Gateway.
- Scheduling: `scheduled_at` on `outbound_campaigns` + pg_cron → `/api/public/hooks/send-scheduled-campaigns`.
- Saved segments (e.g. "Verified, last login >30d").
- Open/click analytics via Mailgun webhook → per-campaign stats.
- Trigger-based automations (e.g. "7 days after Verified renewal lapses").

## Hard rules
- Campaigns UI must NEVER live inside `/admin/support`. They are different jobs.
- Free tier doesn't exist — broadcast tier picker is Verified / Pro / Studio only.
- Recipient resolution: `resolveTierRecipients` and `searchTrainers` must fetch profile names via a separate `profiles.in('id', ids)` query — there is NO FK between `public.professionals` and `public.profiles`.
