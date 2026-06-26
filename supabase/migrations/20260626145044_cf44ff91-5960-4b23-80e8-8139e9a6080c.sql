
-- 1. Extend insurance_policies with AI-derived signals
ALTER TABLE public.insurance_policies
  ADD COLUMN IF NOT EXISTS ai_extraction jsonb,
  ADD COLUMN IF NOT EXISTS ai_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS trust_signals jsonb,
  ADD COLUMN IF NOT EXISTS insured_name text,
  ADD COLUMN IF NOT EXISTS name_match boolean;

-- 2. Verification notifications table (bell rail) — mirrors review_notifications shape
CREATE TABLE IF NOT EXISTS public.verification_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  event text NOT NULL,
  context jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_notifications_pro_unread_idx
  ON public.verification_notifications (professional_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS verification_notifications_event_idx
  ON public.verification_notifications (professional_id, event, created_at DESC);

GRANT SELECT, UPDATE ON public.verification_notifications TO authenticated;
GRANT ALL ON public.verification_notifications TO service_role;
ALTER TABLE public.verification_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros read own verification notifications"
  ON public.verification_notifications FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pros mark own verification notifications read"
  ON public.verification_notifications FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- 3. Renewal nudge daily SQL job (idempotent via verification_renewal_nudges PK)
CREATE OR REPLACE FUNCTION public.insurance_check_renewals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_threshold int;
  v_days int;
  v_inserted int := 0;
BEGIN
  FOR r IN
    SELECT ip.id, ip.professional_id, ip.expiry_date,
           (ip.expiry_date - CURRENT_DATE) AS days_left
    FROM public.insurance_policies ip
    WHERE ip.expiry_date IS NOT NULL
      AND ip.expiry_date >= CURRENT_DATE - 1
      AND ip.expiry_date <= CURRENT_DATE + 60
  LOOP
    v_days := r.days_left;
    -- pick the highest threshold the policy has crossed today
    v_threshold := CASE
      WHEN v_days <= 0 THEN 0
      WHEN v_days <= 7 THEN 7
      WHEN v_days <= 30 THEN 30
      WHEN v_days <= 60 THEN 60
      ELSE NULL
    END;
    IF v_threshold IS NULL THEN CONTINUE; END IF;

    -- idempotency: only fire each threshold once per policy
    BEGIN
      INSERT INTO public.verification_renewal_nudges (policy_id, threshold_days, sent_at)
      VALUES (r.id, v_threshold, now());
      v_inserted := v_inserted + 1;

      INSERT INTO public.verification_notifications (professional_id, event, context)
      VALUES (
        r.professional_id,
        CASE WHEN v_threshold = 0 THEN 'insurance.expired' ELSE 'insurance.expires_soon' END,
        jsonb_build_object('policy_id', r.id, 'threshold_days', v_threshold,
                           'expiry_date', r.expiry_date, 'days_left', v_days)
      );
    EXCEPTION WHEN unique_violation THEN
      -- already nudged at this threshold
      NULL;
    END;
  END LOOP;
  RETURN v_inserted;
END;
$$;
