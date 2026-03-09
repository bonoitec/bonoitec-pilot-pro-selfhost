
-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC NOT NULL DEFAULT 0,
  estimated_time_minutes INTEGER NOT NULL DEFAULT 30,
  compatible_categories JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view services" ON public.services FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "Org members can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Org members can update services" ON public.services FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- Articles table (products/accessories for sale)
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  category TEXT NOT NULL DEFAULT 'Autre',
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view articles" ON public.articles FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "Org members can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Org members can update articles" ON public.articles FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "Admins can delete articles" ON public.articles FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- Add device_compatibility to inventory for better parts management
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS device_compatibility TEXT;
