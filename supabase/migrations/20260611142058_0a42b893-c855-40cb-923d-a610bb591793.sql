INSERT INTO public.user_roles (user_id, role)
VALUES ('3d8ffa68-f4b2-46b2-bdac-d06b48fbf445', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;