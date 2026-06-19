
UPDATE public.reviews
SET ai_verdict = 'suspect',
    ai_flags = jsonb_build_object(
      'profanity', jsonb_build_object('hit', true, 'reason', 'Contains profanity (fuck/fucking)'),
      'promo',     jsonb_build_object('hit', false, 'reason', 'Clean'),
      'pii',       jsonb_build_object('hit', false, 'reason', 'Clean'),
      'fake_signals', jsonb_build_object('hit', false, 'reason', 'Clean'),
      'dedupe',    jsonb_build_object('hit', false, 'reason', 'Clean')
    ),
    ai_checked_at = now()
WHERE id = 'c3eb629a-04d5-4502-9568-01a560d55c66';

UPDATE public.reviews
SET ai_verdict = 'clean',
    ai_flags = jsonb_build_object(
      'profanity', jsonb_build_object('hit', false, 'reason', 'Clean'),
      'promo',     jsonb_build_object('hit', false, 'reason', 'Clean'),
      'pii',       jsonb_build_object('hit', false, 'reason', 'Clean'),
      'fake_signals', jsonb_build_object('hit', false, 'reason', 'Clean'),
      'dedupe',    jsonb_build_object('hit', false, 'reason', 'Clean')
    ),
    ai_checked_at = now()
WHERE id = '9a375401-ac69-4d9e-ad55-e2b5a9c84ae8';
