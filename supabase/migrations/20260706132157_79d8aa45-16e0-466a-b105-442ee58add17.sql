
DO $$
DECLARE
  v_org1 uuid := '11111111-0000-4000-a000-000000000001';
  v_org2 uuid := '11111111-0000-4000-a000-000000000002';
BEGIN
  SET LOCAL session_replication_role = 'replica';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    (v_org1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo-org-northline@repsuk.org', crypt('x1', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, '', '', '', ''),
    (v_org2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo-org-forge@repsuk.org', crypt('x2', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  SET LOCAL session_replication_role = 'origin';

  INSERT INTO public.profiles (id, full_name, business_name, display_name)
  VALUES
    (v_org1, 'Northline Fitness Academy', 'Northline Fitness Academy', 'Northline Fitness Academy'),
    (v_org2, 'Forge Strength Institute', 'Forge Strength Institute', 'Forge Strength Institute')
  ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, full_name = EXCLUDED.full_name;

  INSERT INTO public.professionals (
    id, slug, headline, bio, account_type, legal_entity_name, company_registration, staff_count, awarding_bodies,
    specialisms, city, country, online_available, in_person_available,
    verification, verification_status, is_published, primary_profession,
    is_demo, member_since, quality_score
  ) VALUES
    (v_org1, 'northline-fitness-academy',
      'Ofqual-regulated Level 2, 3 and 4 fitness qualifications',
      'Northline is an approved training provider running practical, in-person courses across the North of England. Small cohorts, working coaches as tutors, and a placement network of 40+ partner gyms.',
      'organisation', 'Northline Fitness Academy Ltd', '09823741', 24,
      ARRAY['Active IQ','YMCA Awards','Focus Awards']::text[],
      ARRAY['strength-training','general-fitness','functional-fitness']::text[],
      'Manchester', 'United Kingdom', true, true,
      'verified', 'verified', true, 'personal-trainer',
      true, now() - interval '4 years', 95),
    (v_org2, 'forge-strength-institute',
      'Strength & conditioning specialists — Level 3 & 4 pathways',
      'Forge trains the next generation of S&C coaches through a hybrid model: online theory blocks, weekend practicals in our London facility, and mentored placements with elite performance teams.',
      'organisation', 'Forge Strength Institute Ltd', '11294736', 12,
      ARRAY['Active IQ','1st4sport']::text[],
      ARRAY['athletic-performance','speed-power','block-periodisation']::text[],
      'London', 'United Kingdom', true, true,
      'verified', 'verified', true, 'strength-coach',
      true, now() - interval '2 years', 88)
  ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug, headline = EXCLUDED.headline, bio = EXCLUDED.bio,
    account_type = EXCLUDED.account_type, legal_entity_name = EXCLUDED.legal_entity_name,
    company_registration = EXCLUDED.company_registration, staff_count = EXCLUDED.staff_count,
    awarding_bodies = EXCLUDED.awarding_bodies, specialisms = EXCLUDED.specialisms,
    is_published = true, verification = 'verified', verification_status = 'verified', is_demo = true;

  INSERT INTO public.professional_locations (professional_id, label, type, postcode_outward, town, region, country_code, latitude, longitude, is_primary, is_public)
  VALUES
    (v_org1, 'Northline HQ', 'primary', 'M4', 'Manchester', 'Greater Manchester', 'GB', 53.4839, -2.2374, true, true),
    (v_org2, 'Forge Facility', 'primary', 'E2', 'London', 'Greater London', 'GB', 51.5285, -0.0619, true, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.services (
    professional_id, title, description, price_pence, price_unit, duration_minutes, mode, sort_order, is_published, is_featured,
    service_kind, starts_at, ends_at, seats_total, seats_taken, venue, qualification_level, awarding_body, bullets, cta_label
  ) VALUES
    (v_org1, 'Level 2 Gym Instructor', '6-week evening course. Ofqual-regulated. Includes tutor-led practicals, mock assessments, and placement support.',
      79500, 'total', NULL, 'in_person', 1, true, true,
      'course', now() + interval '3 weeks', now() + interval '9 weeks', 18, 11, 'Northline HQ, Manchester M4', 'Level 2', 'Active IQ',
      ARRAY['Ofqual-regulated','40+ gym placement partners','Payment plan available']::text[], 'View course'),
    (v_org1, 'Level 3 Personal Trainer', '12-week hybrid course combining online theory blocks with weekend practicals. Includes 1:1 tutor mentoring and coursework reviews.',
      179500, 'total', NULL, 'hybrid', 2, true, true,
      'course', now() + interval '5 weeks', now() + interval '17 weeks', 16, 9, 'Northline HQ, Manchester M4', 'Level 3', 'Active IQ',
      ARRAY['Ofqual-regulated','Hybrid: online + weekends','Placement guarantee']::text[], 'View course'),
    (v_org1, 'Level 4 Lower Back Pain Specialist', 'Advanced CPD for qualified PTs. Small cohort, delivered by physios and S&C coaches.',
      129500, 'total', NULL, 'in_person', 3, true, false,
      'course', now() + interval '8 weeks', now() + interval '14 weeks', 12, 4, 'Northline HQ, Manchester M4', 'Level 4', 'Focus Awards',
      ARRAY['Advanced CPD','Physio-led modules']::text[], 'View course'),
    (v_org2, 'Level 3 Strength & Conditioning Coach', '16-week programme. Weekend practicals in our London facility with mentored placements at partner performance teams.',
      249500, 'total', NULL, 'hybrid', 1, true, true,
      'course', now() + interval '4 weeks', now() + interval '20 weeks', 14, 8, 'Forge Facility, London E2', 'Level 3', 'Active IQ',
      ARRAY['Elite team placements','Weekend practicals','Mentored assessment']::text[], 'View course'),
    (v_org2, 'Level 4 S&C Programme Design', 'Advanced course for practising S&C coaches. Case-study based, delivered by working performance directors.',
      189500, 'total', NULL, 'in_person', 2, true, false,
      'course', now() + interval '10 weeks', now() + interval '18 weeks', 10, 3, 'Forge Facility, London E2', 'Level 4', '1st4sport',
      ARRAY['Advanced case studies','Working practitioner tutors']::text[], 'View course')
  ON CONFLICT DO NOTHING;
END $$;
