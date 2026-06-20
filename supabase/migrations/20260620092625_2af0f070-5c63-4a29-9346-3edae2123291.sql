
CREATE POLICY "Owners read their ticket attachments rows"
ON public.support_attachments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_messages m
    JOIN public.support_tickets t ON t.id = m.ticket_id
    WHERE m.id = support_attachments.message_id
      AND t.requester_user_id = auth.uid()
  )
);

CREATE POLICY "Owners insert attachments on their tickets"
ON public.support_attachments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.support_messages m
    JOIN public.support_tickets t ON t.id = m.ticket_id
    WHERE m.id = support_attachments.message_id
      AND m.author_user_id = auth.uid()
      AND t.requester_user_id = auth.uid()
  )
);
