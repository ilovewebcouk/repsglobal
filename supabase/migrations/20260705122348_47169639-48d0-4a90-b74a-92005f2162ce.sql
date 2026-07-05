
-- 1. pending_signups: swap plaintext password for encrypted ciphertext.
--    Existing rows are short-lived checkout attempts; clearing them just
--    means anyone mid-checkout has to start over.
DELETE FROM public.pending_signups;
ALTER TABLE public.pending_signups RENAME COLUMN password TO password_ciphertext;

-- 2. admin_impersonation_sessions: overwrite existing tokens with their
--    SHA-256 hash so a compromised admin session can't lift a usable token
--    from an audit row. The application already stopped using the value
--    for lookups; going forward it inserts the hash directly.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE public.admin_impersonation_sessions
SET session_token = encode(digest(session_token, 'sha256'), 'hex')
WHERE session_token IS NOT NULL
  AND length(session_token) <> 64;
