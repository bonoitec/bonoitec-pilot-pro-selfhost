
-- Device catalog table
CREATE TABLE public.device_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Smartphone',
  brand text NOT NULL,
  model text NOT NULL,
  model_number text,
  release_year integer,
  storage_variants jsonb DEFAULT '[]'::jsonb,
  color_variants jsonb DEFAULT '[]'::jsonb,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand, model)
);

-- Index for fast search
CREATE INDEX idx_device_catalog_brand ON public.device_catalog(brand);
CREATE INDEX idx_device_catalog_category ON public.device_catalog(category);
CREATE INDEX idx_device_catalog_search ON public.device_catalog USING gin(
  to_tsvector('simple', brand || ' ' || model)
);

-- RLS
ALTER TABLE public.device_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read catalog
CREATE POLICY "Anyone can view device catalog"
  ON public.device_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage catalog
CREATE POLICY "Admins can manage device catalog"
  ON public.device_catalog FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_device_catalog_updated_at
  BEFORE UPDATE ON public.device_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
