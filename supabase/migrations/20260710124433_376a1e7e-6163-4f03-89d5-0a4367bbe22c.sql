-- ============================================================
-- Student certification & registration
-- ============================================================

-- Certificate number sequence (padded via trigger on insert of issued rows)
CREATE SEQUENCE IF NOT EXISTS public.certificate_number_seq START 1;

-- ------------------------------------------------------------
-- learners
-- ------------------------------------------------------------
CREATE TABLE public.learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  dob date,
  country text,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX learners_provider_email_key
  ON public.learners (provider_id, lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX learners_provider_idx ON public.learners (provider_id) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learners TO authenticated;
GRANT ALL ON public.learners TO service_role;

ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own learners"
  ON public.learners FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Admins manage all learners"
  ON public.learners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- certificate_batches
-- ------------------------------------------------------------
CREATE TABLE public.certificate_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  count integer NOT NULL DEFAULT 0,
  unit_price_pence integer NOT NULL,
  total_pence integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  format text NOT NULL DEFAULT 'digital',
  environment text NOT NULL DEFAULT 'sandbox',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  issued_at timestamptz,
  printed_at timestamptz,
  dispatched_at timestamptz,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificate_batches_status_chk
    CHECK (status IN ('pending','paid','issued','awaiting_print','printed','dispatched','fulfilled','canceled')),
  CONSTRAINT certificate_batches_format_chk
    CHECK (format IN ('digital','printed_and_digital'))
);

CREATE INDEX certificate_batches_provider_idx ON public.certificate_batches (provider_id, created_at DESC);
CREATE INDEX certificate_batches_status_idx ON public.certificate_batches (status);
CREATE UNIQUE INDEX certificate_batches_session_key
  ON public.certificate_batches (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_batches TO authenticated;
GRANT ALL ON public.certificate_batches TO service_role;

ALTER TABLE public.certificate_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers view own batches"
  ON public.certificate_batches FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins manage all batches"
  ON public.certificate_batches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- certificate_registrations
-- ------------------------------------------------------------
CREATE TABLE public.certificate_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.provider_regulated_permissions(id) ON DELETE RESTRICT,
  course_title text NOT NULL,
  course_level integer,
  reps_course_number text,
  status text NOT NULL DEFAULT 'enrolled',
  batch_id uuid REFERENCES public.certificate_batches(id) ON DELETE SET NULL,
  format text,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  passed_at timestamptz,
  marked_passed_by uuid,
  paid_at timestamptz,
  issued_at timestamptz,
  dispatched_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  price_pence_at_issue integer,
  certificate_number text,
  verification_token text UNIQUE,
  pdf_path text,
  unit_summary_pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificate_registrations_status_chk
    CHECK (status IN ('enrolled','passed','pending_payment','paid','issued','dispatched','revoked','canceled'))
);

CREATE INDEX cert_reg_provider_idx ON public.certificate_registrations (provider_id, created_at DESC);
CREATE INDEX cert_reg_learner_idx ON public.certificate_registrations (learner_id);
CREATE INDEX cert_reg_course_idx ON public.certificate_registrations (course_id);
CREATE INDEX cert_reg_batch_idx ON public.certificate_registrations (batch_id);
CREATE INDEX cert_reg_status_idx ON public.certificate_registrations (status);
CREATE UNIQUE INDEX cert_reg_number_key
  ON public.certificate_registrations (certificate_number)
  WHERE certificate_number IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_registrations TO authenticated;
GRANT ALL ON public.certificate_registrations TO service_role;
-- Public verify page reads a single row by verification_token via a server fn using the
-- publishable-key client (acts as anon). Column projection is enforced in the query.
GRANT SELECT ON public.certificate_registrations TO anon;

ALTER TABLE public.certificate_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own registrations"
  ON public.certificate_registrations FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Admins manage all registrations"
  ON public.certificate_registrations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public: only ISSUED (or revoked) rows are visible, and only when the caller already
-- knows the opaque verification_token. Server fn enforces column projection.
CREATE POLICY "Public verify by token"
  ON public.certificate_registrations FOR SELECT
  TO anon
  USING (
    verification_token IS NOT NULL
    AND status IN ('issued','dispatched','revoked')
  );

-- ------------------------------------------------------------
-- certificate_pricing (single-row config)
-- ------------------------------------------------------------
CREATE TABLE public.certificate_pricing (
  id boolean PRIMARY KEY DEFAULT true,
  unit_price_pence integer NOT NULL DEFAULT 1500,
  currency text NOT NULL DEFAULT 'gbp',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificate_pricing_singleton CHECK (id = true)
);

INSERT INTO public.certificate_pricing (id, unit_price_pence) VALUES (true, 1500)
  ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.certificate_pricing TO authenticated;
GRANT ALL ON public.certificate_pricing TO service_role;

ALTER TABLE public.certificate_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in can read pricing"
  ON public.certificate_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins update pricing"
  ON public.certificate_pricing FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
CREATE TRIGGER learners_set_updated_at
  BEFORE UPDATE ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER certificate_batches_set_updated_at
  BEFORE UPDATE ON public.certificate_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER certificate_registrations_set_updated_at
  BEFORE UPDATE ON public.certificate_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- Certificate number generator (called from server code on issuance)
-- Returns strings like REPS-CERT-000001
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('public.certificate_number_seq');
  RETURN 'REPS-CERT-' || lpad(n::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_certificate_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_certificate_number() TO service_role;