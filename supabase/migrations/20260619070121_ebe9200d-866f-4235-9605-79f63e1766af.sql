UPDATE public.bd_member_seed
SET recrop_status = 'pending',
    recrop_reason = NULL,
    recropped_at  = NULL
WHERE profile_photo_status = 'ok'
  AND profile_photo_storage_path IS NOT NULL;