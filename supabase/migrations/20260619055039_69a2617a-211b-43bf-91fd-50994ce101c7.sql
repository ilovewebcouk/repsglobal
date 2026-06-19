-- Revert bd_seed blanket approvals. The old import classifier is not strict
-- enough to count as "passed AI headshot QA" for public featured/directory cards.
UPDATE public.profiles
SET avatar_qa_status = 'unverified',
    avatar_qa_source = NULL
WHERE avatar_qa_source = 'bd_seed'
  AND avatar_qa_status = 'approved';