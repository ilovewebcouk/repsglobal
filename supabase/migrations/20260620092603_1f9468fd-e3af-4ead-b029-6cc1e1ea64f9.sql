
-- Ticket owner read
CREATE POLICY "Owners read their ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = 'tickets'
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id::text = (storage.foldername(name))[2]
      AND t.requester_user_id = auth.uid()
  )
);

-- Ticket owner insert
CREATE POLICY "Owners upload their ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = 'tickets'
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id::text = (storage.foldername(name))[2]
      AND t.requester_user_id = auth.uid()
  )
);
