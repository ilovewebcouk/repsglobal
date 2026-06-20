
-- Backfill requester_user_id from matching auth.users by email
UPDATE public.support_tickets t
SET requester_user_id = u.id
FROM auth.users u
WHERE t.requester_user_id IS NULL
  AND t.requester_email IS NOT NULL
  AND lower(u.email) = lower(t.requester_email);

-- Tighten support_tickets SELECT
DROP POLICY IF EXISTS "Users read own tickets" ON public.support_tickets;
CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid());

-- Tighten support_messages SELECT
DROP POLICY IF EXISTS "Users read own ticket messages" ON public.support_messages;
CREATE POLICY "Users read own ticket messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    direction <> 'internal_note'::public.support_msg_direction
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND t.requester_user_id = auth.uid()
    )
  );

-- Tighten support_messages INSERT
DROP POLICY IF EXISTS "Users reply to own tickets" ON public.support_messages;
CREATE POLICY "Users reply to own tickets" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    direction = 'inbound'::public.support_msg_direction
    AND author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND t.requester_user_id = auth.uid()
    )
  );

-- Tighten legacy_stripe_payments SELECT
DROP POLICY IF EXISTS "Users view their own payment history" ON public.legacy_stripe_payments;
CREATE POLICY "Users view their own payment history"
  ON public.legacy_stripe_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
