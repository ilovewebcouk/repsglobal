ALTER TYPE public.mailing_list_deletion_reason ADD VALUE IF NOT EXISTS 'self_delete';
ALTER TYPE public.mailing_list_deletion_reason ADD VALUE IF NOT EXISTS 'stripe_uncollectible';