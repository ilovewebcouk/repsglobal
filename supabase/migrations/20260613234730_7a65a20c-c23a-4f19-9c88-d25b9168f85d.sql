
-- Phase 2.0 Leads: extend enquiries + lead_activity + lead_proposals.

-- 1. Stage enum -----------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.lead_stage AS ENUM (
    'new','contacted','call_booked','proposal_sent','trial_booked','converted','lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_band AS ENUM ('cold','warm','hot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend enquiries ----------------------------------------------------
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS stage public.lead_stage NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS priority public.lead_priority,
  ADD COLUMN IF NOT EXISTS estimated_value_pence integer,
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_score integer CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100)),
  ADD COLUMN IF NOT EXISTS ai_band public.lead_band,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommended_action text,
  ADD COLUMN IF NOT EXISTS ai_reasons jsonb,
  ADD COLUMN IF NOT EXISTS ai_predicted_pct integer CHECK (ai_predicted_pct IS NULL OR (ai_predicted_pct >= 0 AND ai_predicted_pct <= 100)),
  ADD COLUMN IF NOT EXISTS ai_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_enquiries_pro_stage ON public.enquiries(professional_id, stage);
CREATE INDEX IF NOT EXISTS idx_enquiries_pro_follow_up ON public.enquiries(professional_id, follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_pro_ai_score ON public.enquiries(professional_id, ai_score DESC NULLS LAST);

-- Backfill stage from legacy status where sensible
UPDATE public.enquiries SET stage = 'contacted' WHERE status = 'replied' AND stage = 'new';
UPDATE public.enquiries SET stage = 'lost' WHERE status = 'archived' AND stage = 'new';

-- 3. lead_activity ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_enquiry ON public.lead_activity(enquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_pro ON public.lead_activity(professional_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activity TO authenticated;
GRANT ALL ON public.lead_activity TO service_role;

ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro can read own lead activity" ON public.lead_activity
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Pro can insert own lead activity" ON public.lead_activity
  FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Admin manage lead activity" ON public.lead_activity
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. lead_proposals ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_proposals_pro ON public.lead_proposals(professional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_enquiry ON public.lead_proposals(enquiry_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_proposals TO authenticated;
GRANT ALL ON public.lead_proposals TO service_role;

ALTER TABLE public.lead_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro manage own proposals" ON public.lead_proposals
  FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Admin manage proposals" ON public.lead_proposals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lead_proposals_updated_at BEFORE UPDATE ON public.lead_proposals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
