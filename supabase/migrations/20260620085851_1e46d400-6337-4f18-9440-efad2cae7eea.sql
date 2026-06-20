CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR lower(requester_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  );

CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND source = 'web'::public.support_source
    AND inbox = 'support'
    AND deleted_at IS NULL
  );

CREATE POLICY "Users read own ticket messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    direction <> 'internal_note'::public.support_msg_direction
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND (
          t.requester_user_id = auth.uid()
          OR lower(t.requester_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
        )
    )
  );

CREATE POLICY "Users reply to own tickets" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    direction = 'inbound'::public.support_msg_direction
    AND author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND (
          t.requester_user_id = auth.uid()
          OR lower(t.requester_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
        )
    )
  );