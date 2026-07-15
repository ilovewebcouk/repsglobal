
WITH sends AS (
  SELECT DISTINCT ON (recipient_email)
    recipient_email, message_id, created_at
  FROM public.email_send_log
  WHERE template_name = 'provider-portal-is-live' AND status = 'sent'
  ORDER BY recipient_email, created_at ASC
),
admin_user AS (
  SELECT id FROM auth.users WHERE email = 'cruz.pt@icloud.com' LIMIT 1
),
ins_campaign AS (
  INSERT INTO public.outbound_campaigns (
    id, inbox, subject, body_text, body_html,
    created_by, total_recipients, sent_count, failed_count,
    mode, format, status, created_at, sent_at
  )
  SELECT
    'a1c11a1e-0000-4000-8000-000000000024'::uuid,
    'pros',
    'Your REPs training-provider portal is live',
    'Announcement sent to all training providers on 2026-07-15 with a per-recipient password-set link. Body rendered from the "provider-portal-is-live" template (src/lib/email-templates/provider/portal-is-live.tsx).',
    '<p>Announcement sent to all training providers on 2026-07-15 with a per-recipient password-set link.</p><p>Body rendered from the <code>provider-portal-is-live</code> template.</p>',
    (SELECT id FROM admin_user),
    (SELECT count(*) FROM sends),
    (SELECT count(*) FROM sends),
    0, 'direct', 'html', 'sent',
    '2026-07-15 16:51:39+00'::timestamptz,
    '2026-07-15 16:51:39+00'::timestamptz
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO public.outbound_campaign_recipients (
  campaign_id, email, name, status, sent_at, mailgun_message_id
)
SELECT
  'a1c11a1e-0000-4000-8000-000000000024'::uuid,
  s.recipient_email,
  pr.full_name,
  'sent'::campaign_recipient_status,
  s.created_at,
  s.message_id
FROM sends s
LEFT JOIN auth.users u ON lower(u.email) = lower(s.recipient_email)
LEFT JOIN public.profiles pr ON pr.id = u.id
ON CONFLICT DO NOTHING;
