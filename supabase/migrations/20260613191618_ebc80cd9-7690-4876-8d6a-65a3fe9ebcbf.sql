
-- ============ shop_fronts ============
CREATE TABLE public.shop_fronts (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  tagline text,
  about text,
  hero_image_url text,
  accent_hex text,
  layout_variant text NOT NULL DEFAULT 'lite',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_fronts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_fronts TO authenticated;
GRANT ALL ON public.shop_fronts TO service_role;
ALTER TABLE public.shop_fronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published shop_fronts" ON public.shop_fronts FOR SELECT USING (is_published = true);
CREATE POLICY "Pro can read own shop_front" ON public.shop_fronts FOR SELECT TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Pro can insert own shop_front" ON public.shop_fronts FOR INSERT TO authenticated WITH CHECK (professional_id = auth.uid());
CREATE POLICY "Pro can update own shop_front" ON public.shop_fronts FOR UPDATE TO authenticated USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());
CREATE POLICY "Admin can manage shop_fronts" ON public.shop_fronts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_shop_fronts_updated_at BEFORE UPDATE ON public.shop_fronts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ services ============
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_pence integer,
  price_label text,
  duration_minutes integer,
  mode text NOT NULL DEFAULT 'in_person',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_professional ON public.services(professional_id, sort_order);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published services" ON public.services FOR SELECT USING (is_published = true);
CREATE POLICY "Pro can read own services" ON public.services FOR SELECT TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Pro can manage own services" ON public.services FOR ALL TO authenticated USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());
CREATE POLICY "Admin can manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ enquiries ============
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_phone text,
  goals text[] NOT NULL DEFAULT '{}',
  frequency text,
  start_by text,
  budget text,
  location text,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'profile_enquire',
  ip_hash text,
  user_agent text,
  status text NOT NULL DEFAULT 'new',
  read_at timestamptz,
  replied_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enquiries_status_chk CHECK (status IN ('new','read','replied','archived','spam'))
);
CREATE INDEX idx_enquiries_pro_created ON public.enquiries(professional_id, created_at DESC);
CREATE INDEX idx_enquiries_status ON public.enquiries(professional_id, status);
GRANT INSERT ON public.enquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Pro can read own enquiries" ON public.enquiries FOR SELECT TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Pro can update own enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());
CREATE POLICY "Admin can manage enquiries" ON public.enquiries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_enquiries_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ reviews ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  rating smallint NOT NULL,
  title text,
  body text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  response text,
  responded_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_chk CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_status_chk CHECK (status IN ('pending','published','hidden','flagged'))
);
CREATE INDEX idx_reviews_pro_published ON public.reviews(professional_id, status, published_at DESC);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published reviews" ON public.reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Pro can read own reviews" ON public.reviews FOR SELECT TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Client can read own reviews" ON public.reviews FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Authenticated client can submit review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid());
CREATE POLICY "Pro can respond to own reviews" ON public.reviews FOR UPDATE TO authenticated USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());
CREATE POLICY "Admin can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ programmes_waitlist ============
CREATE TABLE public.programmes_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  email text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_programmes_waitlist_email ON public.programmes_waitlist(email);
GRANT INSERT ON public.programmes_waitlist TO anon, authenticated;
GRANT SELECT ON public.programmes_waitlist TO authenticated;
GRANT ALL ON public.programmes_waitlist TO service_role;
ALTER TABLE public.programmes_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join programme wait-list" ON public.programmes_waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Pro can read own wait-list rows" ON public.programmes_waitlist FOR SELECT TO authenticated USING (professional_id = auth.uid());
CREATE POLICY "Admin can manage programmes_waitlist" ON public.programmes_waitlist FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
