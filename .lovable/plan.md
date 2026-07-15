Add the "Provider portal is live" send (24 training providers, sent 2026-07-15) to `/admin/campaigns` so it appears alongside every other campaign with sent / failed / delivered / opened / clicked stats.

## Approach

The announcement was sent via the one-off endpoint `admin-send-provider-announcement.ts`, which called `sendTransactionalEmailServer` directly and never wrote an `outbound_campaigns` row. So the send exists in `email_send_log` (24 sent, 0 failed) but the Campaigns page has no record of it.

Fix by **backfilling** — insert one `outbound_campaigns` row + 24 `outbound_campaign_recipients` rows that reference the real send. Once the rows exist, the existing CampaignsList UI renders it automatically, and future Mailgun webhook deliveries/opens/clicks for those `message_id`s will update the recipient rows the same way they do for any other campaign.

## Steps

1. **Read the template** (`src/lib/email-templates/provider-portal-is-live.tsx`) to grab the real subject line and a rendered body snapshot for the campaign row (so the drawer "View" shows what was actually sent, not a placeholder).

2. **Migration**: single SQL migration that
   - Inserts one row into `outbound_campaigns`:
     - `id`: fixed UUID (so re-runs are idempotent via `ON CONFLICT DO NOTHING`)
     - `inbox`: `'pros'`
     - `subject`: from the template
     - `body_text` / `body_html`: rendered snapshot (plain announcement copy — password link was per-recipient, omit from snapshot and note in body)
     - `mode`: `'direct'`, `format`: `'html'`, `status`: `'sent'`
     - `total_recipients`: 24, `sent_count`: 24, `failed_count`: 0
     - `created_by`: admin user id (`cruz.pt@icloud.com`), `created_at` / `sent_at`: `2026-07-15 16:51:39+00`
   - Inserts 24 rows into `outbound_campaign_recipients` by selecting from `email_send_log` where `template_name = 'provider-portal-is-live'` and `status = 'sent'`, one row per distinct `recipient_email`, mapping:
     - `campaign_id` → the fixed UUID above
     - `email` → `recipient_email`
     - `name` → `profiles.full_name` looked up via `auth.users.email` → `profiles.id`
     - `status` → `'sent'`
     - `sent_at` → `email_send_log.created_at` of the `sent` row
     - `mailgun_message_id` → `email_send_log.message_id` (so webhook opens/clicks/bounces from Mailgun continue to correlate)
   - Wrap both inserts in `ON CONFLICT DO NOTHING` for idempotency.

3. **No UI or code changes** — `/admin/campaigns` already lists any row in `outbound_campaigns`, and the drawer already reads recipient status from `outbound_campaign_recipients`. Open/click/bounce counters will populate live as Mailgun webhooks fire against the stored `mailgun_message_id`s.

4. **Future rule**: I'll also patch `admin-send-provider-announcement.ts` (and future one-off admin blasts) to write a campaign row up front — small change, gated on whether you want me to keep that endpoint reusable. Say the word and I'll include it; otherwise this plan is backfill only.

## Technical notes

- `outbound_campaigns.status` is `text` (not an enum), so `'sent'` is fine.
- `outbound_campaign_recipients.status` is a Postgres enum — will use `'sent'`; delivered/opened/etc. remain null until Mailgun webhooks arrive.
- Migration is data-only into existing tables; no schema change, no new GRANTs needed.
- Admin user id for `created_by` will be resolved inside the migration via `(SELECT id FROM auth.users WHERE email = 'cruz.pt@icloud.com')`.
