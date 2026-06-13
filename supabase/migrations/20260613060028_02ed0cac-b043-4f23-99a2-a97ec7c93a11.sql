-- Null out NO ACTION/RESTRICT reviewer references for the 5 users being removed
WITH targets AS (
  SELECT unnest(ARRAY[
    'e19670ef-8352-4d28-b1a2-9972e90b44c1',
    '0ed6362d-04a0-48ba-8e9a-84e1d1009b61',
    'e8724227-d681-4c6c-9c25-942350cfc78b',
    '9e73a22f-898c-4d88-a114-3173a8c22dd7',
    '5585841d-8c83-42aa-a2b3-bbe98b7f5d0b'
  ]::uuid[]) AS id
)
UPDATE public.verification_submissions SET claimed_by = NULL WHERE claimed_by IN (SELECT id FROM targets);

UPDATE public.identity_documents SET reviewed_by = NULL WHERE reviewed_by IN (
  'e19670ef-8352-4d28-b1a2-9972e90b44c1'::uuid,
  '0ed6362d-04a0-48ba-8e9a-84e1d1009b61'::uuid,
  'e8724227-d681-4c6c-9c25-942350cfc78b'::uuid,
  '9e73a22f-898c-4d88-a114-3173a8c22dd7'::uuid,
  '5585841d-8c83-42aa-a2b3-bbe98b7f5d0b'::uuid
);

UPDATE public.insurance_policies SET reviewed_by = NULL WHERE reviewed_by IN (
  'e19670ef-8352-4d28-b1a2-9972e90b44c1'::uuid,
  '0ed6362d-04a0-48ba-8e9a-84e1d1009b61'::uuid,
  'e8724227-d681-4c6c-9c25-942350cfc78b'::uuid,
  '9e73a22f-898c-4d88-a114-3173a8c22dd7'::uuid,
  '5585841d-8c83-42aa-a2b3-bbe98b7f5d0b'::uuid
);

DELETE FROM public.verification_decisions WHERE reviewer_id IN (
  'e19670ef-8352-4d28-b1a2-9972e90b44c1'::uuid,
  '0ed6362d-04a0-48ba-8e9a-84e1d1009b61'::uuid,
  'e8724227-d681-4c6c-9c25-942350cfc78b'::uuid,
  '9e73a22f-898c-4d88-a114-3173a8c22dd7'::uuid,
  '5585841d-8c83-42aa-a2b3-bbe98b7f5d0b'::uuid
);

DELETE FROM auth.users WHERE id IN (
  'e19670ef-8352-4d28-b1a2-9972e90b44c1',
  '0ed6362d-04a0-48ba-8e9a-84e1d1009b61',
  'e8724227-d681-4c6c-9c25-942350cfc78b',
  '9e73a22f-898c-4d88-a114-3173a8c22dd7',
  '5585841d-8c83-42aa-a2b3-bbe98b7f5d0b'
);

INSERT INTO public.user_roles (user_id, role)
VALUES ('3d8ffa68-f4b2-46b2-bdac-d06b48fbf445', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.clients (id)
VALUES ('3d8ffa68-f4b2-46b2-bdac-d06b48fbf445')
ON CONFLICT (id) DO NOTHING;