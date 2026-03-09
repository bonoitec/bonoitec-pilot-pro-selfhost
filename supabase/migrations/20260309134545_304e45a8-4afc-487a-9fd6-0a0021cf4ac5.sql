
-- ============================================================
-- Fix: update_updated_at search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================================
CREATE POLICY "Users can view own organization"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id());

CREATE POLICY "Admins can update own organization"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS POLICIES: PROFILES
-- ============================================================
CREATE POLICY "Users can view profiles in own org"
  ON public.profiles FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: USER_ROLES
-- ============================================================
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in own org"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- BUSINESS TABLES
-- ============================================================

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- DEVICES
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'Smartphone',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  accessories TEXT,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view devices"
  ON public.devices FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert devices"
  ON public.devices FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update devices"
  ON public.devices FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete devices"
  ON public.devices FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- REPAIRS
CREATE TYPE public.repair_status AS ENUM ('nouveau', 'diagnostic', 'en_cours', 'en_attente_piece', 'termine', 'pret_a_recuperer');

CREATE TABLE public.repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  technician_id UUID,
  status public.repair_status NOT NULL DEFAULT 'nouveau',
  issue TEXT NOT NULL,
  diagnostic TEXT,
  internal_notes TEXT,
  estimated_price NUMERIC,
  final_price NUMERIC,
  parts_used JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_repairs_updated_at BEFORE UPDATE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view repairs"
  ON public.repairs FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert repairs"
  ON public.repairs FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update repairs"
  ON public.repairs FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete repairs"
  ON public.repairs FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- INVENTORY
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autre',
  buy_price NUMERIC NOT NULL DEFAULT 0,
  sell_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view inventory"
  ON public.inventory FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert inventory"
  ON public.inventory FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update inventory"
  ON public.inventory FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete inventory"
  ON public.inventory FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- QUOTES (Devis)
CREATE TYPE public.quote_status AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse');

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES public.repairs(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'brouillon',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 20,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view quotes"
  ON public.quotes FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert quotes"
  ON public.quotes FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update quotes"
  ON public.quotes FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete quotes"
  ON public.quotes FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- INVOICES (Factures)
CREATE TYPE public.invoice_status AS ENUM ('brouillon', 'envoyee', 'payee', 'partiel', 'annulee');
CREATE TYPE public.payment_method AS ENUM ('cb', 'especes', 'virement', 'cheque', 'autre');

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES public.repairs(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  status public.invoice_status NOT NULL DEFAULT 'brouillon',
  payment_method public.payment_method,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 20,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view invoices"
  ON public.invoices FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can insert invoices"
  ON public.invoices FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Org members can update invoices"
  ON public.invoices FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- TECHNICIANS
CREATE TABLE public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_technicians_updated_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Org members can view technicians"
  ON public.technicians FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "Admins can manage technicians"
  ON public.technicians FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUTO-CREATE PROFILE + ORG ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a default organization for the new user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Mon atelier'))
  RETURNING id INTO new_org_id;

  -- Create profile
  INSERT INTO public.profiles (user_id, organization_id, full_name)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Give admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
