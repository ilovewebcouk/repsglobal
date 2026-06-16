
CREATE OR REPLACE FUNCTION public.admin_seed_all_bd_members(_limit int DEFAULT 500)
RETURNS TABLE(seeded int, failed int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  r record;
  v_uid uuid;
  v_existing uuid;
  v_count int := 0;
  v_failed int := 0;
BEGIN
  FOR r IN
    SELECT s.bd_member_id, s.email, s.first_name, s.last_name
    FROM public.bd_member_seed s
    LEFT JOIN public.bd_migration m
      ON m.bd_member_id = s.bd_member_id::text AND m.status = 'seeded'
    WHERE m.id IS NULL
    ORDER BY s.bd_member_id
    LIMIT _limit
  LOOP
    BEGIN
      SELECT id INTO v_existing FROM auth.users WHERE lower(email) = lower(r.email::text) LIMIT 1;
      IF v_existing IS NOT NULL THEN
        v_uid := v_existing;
      ELSE
        v_uid := gen_random_uuid();
        INSERT INTO auth.users (
          instance_id, id, aud, role, email,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token,
          recovery_token, email_change_token_new, email_change
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
          lower(r.email::text), now(),
          jsonb_build_object('provider','email','providers',array['email']),
          jsonb_build_object(
            'signup_kind','professional',
            'full_name', NULLIF(trim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), '')
          ),
          now(), now(), '', '', '', ''
        );
      END IF;

      PERFORM public.seed_bd_member_into_directory(r.bd_member_id, v_uid);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      INSERT INTO public.bd_migration (bd_member_id, email, status, error_message, processed_at)
      VALUES (r.bd_member_id::text, r.email, 'failed', SQLERRM, now())
      ON CONFLICT (bd_member_id) DO UPDATE
        SET status = 'failed', error_message = EXCLUDED.error_message, processed_at = now(), updated_at = now();
    END;
  END LOOP;
  seeded := v_count;
  failed := v_failed;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_seed_all_bd_members(int) FROM PUBLIC, anon, authenticated;
