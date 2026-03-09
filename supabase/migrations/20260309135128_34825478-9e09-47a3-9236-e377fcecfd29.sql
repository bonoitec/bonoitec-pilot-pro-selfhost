
-- Add tracking_code to repairs for public tracking
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS technician_message TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMPTZ;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Generate tracking code function
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  IF NEW.tracking_code IS NULL THEN
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    NEW.tracking_code := code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_repair_tracking_code
  BEFORE INSERT ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_code();

-- Allow public (anonymous) read on repairs by tracking_code
CREATE POLICY "Public can view repair by tracking code"
  ON public.repairs FOR SELECT TO anon
  USING (tracking_code IS NOT NULL);

-- DEPOSIT CODES for QR quick deposit
CREATE TABLE public.deposit_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deposit_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage deposit codes"
  ON public.deposit_codes FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Public can read active deposit codes"
  ON public.deposit_codes FOR SELECT TO anon
  USING (active = true);

-- Allow anon to insert clients for deposit
CREATE POLICY "Anon can insert clients via deposit"
  ON public.clients FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to insert repairs via deposit
CREATE POLICY "Anon can insert repairs via deposit"
  ON public.repairs FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to insert devices via deposit
CREATE POLICY "Anon can insert devices via deposit"
  ON public.devices FOR INSERT TO anon
  WITH CHECK (true);

-- REPAIR TEMPLATES (Library)
CREATE TABLE public.repair_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type TEXT NOT NULL,
  device_brand TEXT,
  device_model TEXT,
  repair_type TEXT NOT NULL,
  parts_needed JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT NOT NULL DEFAULT 'moyenne',
  avg_time_minutes INTEGER NOT NULL DEFAULT 30,
  avg_price NUMERIC,
  tips TEXT,
  created_by UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.repair_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_repair_templates_updated_at BEFORE UPDATE ON public.repair_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Anyone authenticated can view public templates"
  ON public.repair_templates FOR SELECT TO authenticated
  USING (is_public = true OR organization_id = public.get_user_org_id());

CREATE POLICY "Org members can insert templates"
  ON public.repair_templates FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can update own templates"
  ON public.repair_templates FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete templates"
  ON public.repair_templates FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- Enable realtime for repairs (for technician updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.repairs;
