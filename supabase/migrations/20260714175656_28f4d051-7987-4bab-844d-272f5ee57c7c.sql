-- Allow providers to INSERT their own certificate batches (checkout creates the row)
CREATE POLICY "Providers create own batches"
  ON public.certificate_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

-- Allow providers to UPDATE their own certificate batches
-- (checkout writes stripe_checkout_session_id; cancel flips status)
CREATE POLICY "Providers update own batches"
  ON public.certificate_batches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);