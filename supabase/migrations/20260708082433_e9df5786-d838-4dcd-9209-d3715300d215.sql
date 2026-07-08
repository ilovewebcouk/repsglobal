
CREATE TABLE public.provider_domain_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL UNIQUE REFERENCES public.professionals(id) ON DELETE CASCADE,
  domain TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'unstarted'
    CHECK (status IN ('unstarted','email_sent','email_confirmed','pending_admin_review','approved','rejected')),
  confirmation_token_hash TEXT,
  confirmation_expires_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  last_resend_at TIMESTAMP WITH TIME ZONE,
  resend_count_today INTEGER NOT NULL DEFAULT 0,
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_reviewer_id UUID,
  admin_decision_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_domain_verifications_status ON public.provider_domain_verifications(status);
CREATE INDEX idx_provider_domain_verifications_token ON public.provider_domain_verifications(confirmation_token_hash) WHERE confirmation_token_hash IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.provider_domain_verifications TO authenticated;
GRANT ALL ON public.provider_domain_verifications TO service_role;

ALTER TABLE public.provider_domain_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers select their own domain verification"
  ON public.provider_domain_verifications FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Providers insert their own domain verification"
  ON public.provider_domain_verifications FOR INSERT
  TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Providers update their own pre-approval domain verification"
  ON public.provider_domain_verifications FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid() AND status <> 'approved')
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Admins manage all provider domain verifications"
  ON public.provider_domain_verifications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at_provider_domain()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_provider_domain_verifications_updated_at
  BEFORE UPDATE ON public.provider_domain_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_provider_domain();
