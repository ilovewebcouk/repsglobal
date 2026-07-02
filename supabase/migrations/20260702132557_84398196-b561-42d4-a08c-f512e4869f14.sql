ALTER TABLE public.member_session_events
  DROP CONSTRAINT IF EXISTS member_session_events_user_id_fkey,
  ADD CONSTRAINT member_session_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.identity_name_changes
  DROP CONSTRAINT IF EXISTS identity_name_changes_user_id_fkey,
  ADD CONSTRAINT identity_name_changes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;