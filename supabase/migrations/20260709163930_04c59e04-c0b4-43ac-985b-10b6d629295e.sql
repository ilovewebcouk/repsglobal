CREATE OR REPLACE FUNCTION public.assign_reps_qualification_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved'
     AND NEW.reps_qualification_number IS NULL THEN
    NEW.reps_qualification_number :=
      'REPS-QUAL-' || lpad(nextval('public.reps_qualification_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.provider_regulated_permissions
SET reps_qualification_number =
  'REPS-QUAL-' || lpad(
    regexp_replace(reps_qualification_number, '^REPS-QUAL-0*', '')::int::text,
    4,
    '0'
  )
WHERE reps_qualification_number ~ '^REPS-QUAL-\d+$';