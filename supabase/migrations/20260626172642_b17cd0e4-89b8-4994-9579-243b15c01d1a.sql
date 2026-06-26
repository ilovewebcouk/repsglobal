-- ============================================================================
-- Pass C: symmetric, idempotent recompute with drift logging
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recompute_pro_verification(_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _fully boolean;
  _current_v public.verification_status;
  _target_v  public.verification_status;
  _target_s  public.verification_state;
  _after_v   public.verification_status;
  _after_s   public.verification_state;
BEGIN
  IF _pro_id IS NULL THEN RETURN; END IF;

  SELECT public.is_pro_fully_verified(_pro_id) INTO _fully;
  SELECT verification INTO _current_v FROM public.professionals WHERE id = _pro_id;

  IF _fully THEN
    _target_v := 'verified'::public.verification_status;
    _target_s := 'verified'::public.verification_state;
  ELSIF _current_v = 'rejected'::public.verification_status THEN
    _target_v := 'rejected'::public.verification_status;
    _target_s := 'unverified'::public.verification_state;
  ELSIF _current_v = 'suspended'::public.verification_status THEN
    _target_v := 'suspended'::public.verification_status;
    _target_s := 'unverified'::public.verification_state;
  ELSE
    _target_v := 'pending'::public.verification_status;
    _target_s := 'pending'::public.verification_state;
  END IF;

  UPDATE public.professionals
     SET verification        = _target_v,
         verification_status = _target_s
   WHERE id = _pro_id
     AND (verification IS DISTINCT FROM _target_v
          OR verification_status IS DISTINCT FROM _target_s);

  -- Self-check: if we still don't agree, something else is racing us — log it.
  SELECT verification, verification_status
    INTO _after_v, _after_s
    FROM public.professionals WHERE id = _pro_id;

  IF (_after_v = 'verified'::public.verification_status)
       <> (_after_s = 'verified'::public.verification_state) THEN
    INSERT INTO public.admin_audit_log (
      actor_id, action, target_table, target_id, after_state, reason
    ) VALUES (
      NULL,
      'verification.drift_detected',
      'professionals',
      _pro_id,
      jsonb_build_object(
        'verification', _after_v::text,
        'verification_status', _after_s::text,
        'fully_verified', _fully
      ),
      'recompute_pro_verification: columns still disagree after update'
    );
  END IF;
END;
$fn$;

-- ============================================================================
-- Pass D: trigger coverage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_recompute_pro_verif_from_verif_col()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  -- Re-align cache whenever the canonical column is touched directly.
  -- Guard against infinite recursion: only re-run if the recompute would change something.
  IF NEW.verification IS DISTINCT FROM OLD.verification THEN
    PERFORM public.recompute_pro_verification(NEW.id);
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS recompute_verif_on_verif_col ON public.professionals;
CREATE TRIGGER recompute_verif_on_verif_col
AFTER UPDATE OF verification ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_pro_verif_from_verif_col();

CREATE OR REPLACE FUNCTION public.trg_recompute_pro_verif_from_identity_doc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  PERFORM public.recompute_pro_verification(COALESCE(NEW.professional_id, OLD.professional_id));
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS recompute_verif_on_identity_doc ON public.identity_documents;
CREATE TRIGGER recompute_verif_on_identity_doc
AFTER INSERT OR UPDATE OF status OR DELETE ON public.identity_documents
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_pro_verif_from_identity_doc();

-- ============================================================================
-- Pass E: admin drift audit RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_verification_drift()
RETURNS TABLE (
  professional_id uuid,
  slug text,
  verification text,
  verification_status text,
  fully_verified boolean,
  reason text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.verification::text,
    p.verification_status::text,
    public.is_pro_fully_verified(p.id),
    CASE
      WHEN (p.verification::text = 'verified') <> (p.verification_status::text = 'verified')
        THEN 'columns_disagree'
      WHEN p.verification::text = 'verified' AND NOT public.is_pro_fully_verified(p.id)
        THEN 'verified_but_not_fully'
      WHEN p.verification::text <> 'verified' AND public.is_pro_fully_verified(p.id)
        THEN 'fully_but_not_marked'
      ELSE 'other'
    END AS reason
  FROM public.professionals p
  WHERE
    (p.verification::text = 'verified') <> (p.verification_status::text = 'verified')
    OR (p.verification::text = 'verified' AND NOT public.is_pro_fully_verified(p.id))
    OR (p.verification::text <> 'verified' AND public.is_pro_fully_verified(p.id));
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.audit_verification_drift() TO authenticated;

-- ============================================================================
-- Pass B: daily insurance-expiry sweep (idempotent recompute)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recompute_verification_daily_sweep()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT p.id
    FROM public.professionals p
    LEFT JOIN public.insurance_policies ip ON ip.professional_id = p.id
    WHERE
      p.verification = 'verified'::public.verification_status
      OR (ip.expiry_date IS NOT NULL
          AND ip.expiry_date BETWEEN (CURRENT_DATE - 2) AND (CURRENT_DATE + 1))
  LOOP
    PERFORM public.recompute_pro_verification(r.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$fn$;

-- Schedule the daily sweep (idempotent: replace any existing entry by name).
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job WHERE jobname = 'recompute-verification-daily';
    PERFORM cron.schedule(
      'recompute-verification-daily',
      '0 1 * * *',
      $sweep$SELECT public.recompute_verification_daily_sweep();$sweep$
    );
  END IF;
END;
$cron$;

-- ============================================================================
-- One-shot backfill against today's 3-pillar logic
-- ============================================================================
DO $bf$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    PERFORM public.recompute_pro_verification(r.id);
  END LOOP;
END;
$bf$;
