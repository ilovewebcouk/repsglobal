-- Add avatar QA columns to profiles to track headshot validation status.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_qa_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS avatar_qa_source text;

COMMENT ON COLUMN public.profiles.avatar_qa_status IS 'Headshot QA status: unverified | approved. Only approved avatars surface on featured/public directory cards.';
COMMENT ON COLUMN public.profiles.avatar_qa_source IS 'How the avatar was approved: ai_upload (AI-validated upload), ai_generated (AI portrait), bd_seed (legacy migrated photo with profile_photo_status=ok), admin.';

-- Backfill: legacy migrated photos that passed BD AI classification → approved.
UPDATE public.profiles p
SET avatar_qa_status = 'approved',
    avatar_qa_source = 'bd_seed'
FROM public.bd_member_seed s
WHERE s.claimed_user_id = p.id
  AND s.profile_photo_status = 'ok'
  AND s.profile_photo_storage_path IS NOT NULL
  AND p.avatar_url IS NOT NULL
  AND p.avatar_qa_status = 'unverified';

-- Backfill: any avatar that is currently AI-generated → approved.
UPDATE public.profiles
SET avatar_qa_status = 'approved',
    avatar_qa_source = 'ai_generated'
WHERE avatar_is_ai_generated = true
  AND avatar_url IS NOT NULL
  AND avatar_qa_status = 'unverified';