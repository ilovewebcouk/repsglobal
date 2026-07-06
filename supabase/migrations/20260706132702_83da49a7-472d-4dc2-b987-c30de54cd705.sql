
DO $$
DECLARE
  v_org1 uuid := '11111111-0000-4000-a000-000000000001';
  v_org2 uuid := '11111111-0000-4000-a000-000000000002';
BEGIN
  UPDATE public.professionals SET is_demo = false WHERE id IN (v_org1, v_org2);

  INSERT INTO public.subscriptions (user_id, tier, billing_period, status, owner_type, owner_id, environment, current_period_end)
  VALUES
    (v_org1, 'studio', 'monthly', 'active', 'user', v_org1, 'sandbox', now() + interval '1 year'),
    (v_org2, 'studio', 'monthly', 'active', 'user', v_org2, 'sandbox', now() + interval '1 year')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.websites (professional_id, tagline, subtitle, about)
  VALUES
    (v_org1, 'Northline Fitness Academy', 'Ofqual-regulated Level 2, 3 and 4 fitness qualifications', 'Northline is an approved training provider running practical, in-person courses across the North of England. Small cohorts, working coaches as tutors, and a placement network of 40+ partner gyms.'),
    (v_org2, 'Forge Strength Institute', 'Strength & conditioning specialists — Level 3 & 4 pathways', 'Forge trains the next generation of S&C coaches through a hybrid model: online theory blocks, weekend practicals in our London facility, and mentored placements with elite performance teams.')
  ON CONFLICT (professional_id) DO NOTHING;
END $$;
