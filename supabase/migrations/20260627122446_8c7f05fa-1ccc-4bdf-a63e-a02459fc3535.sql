DO $$
DECLARE
  demo_ids uuid[] := ARRAY[
    '0f21f9b0-55c7-441e-a25c-042b7d7f8910', -- sophie-taylor
    'c793b556-35f4-4e78-9f4e-f4448413871f', -- liam-roberts
    'fcc3da3d-b11c-4ebe-8441-0efc418036be', -- daniel-hughes
    '586f88e3-a7f8-4637-ab54-06ce48252d88', -- marcus-lee
    '450cf683-7ae5-4a75-be2c-7f7acb1a0ac0', -- hannah-thompson
    '8d47dbb7-5b47-4dfb-a9a8-09edcd96df92', -- emily-carter
    'fbbf669b-b44f-4c7f-bf4c-379f0a59da3c'  -- priya-sharma
  ]::uuid[];
BEGIN
  -- Delete the auth users; ON DELETE CASCADE on public tables that reference auth.users
  -- will clean up dependent rows (professionals, profiles, user_roles, etc.).
  DELETE FROM auth.users WHERE id = ANY(demo_ids);

  -- Safety net: any public table without a CASCADE FK gets cleared explicitly.
  DELETE FROM public.professionals WHERE id = ANY(demo_ids);
  DELETE FROM public.profiles WHERE id = ANY(demo_ids);
END $$;