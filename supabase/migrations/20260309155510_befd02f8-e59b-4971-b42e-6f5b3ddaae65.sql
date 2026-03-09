
-- Fix repair_templates default to private
ALTER TABLE public.repair_templates ALTER COLUMN is_public SET DEFAULT false;

-- Explicitly recreate key policies AS PERMISSIVE to ensure correct type

-- CLIENTS
DROP POLICY IF EXISTS "Org members can view clients" ON public.clients;
CREATE POLICY "Org members can view clients" ON public.clients AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert clients" ON public.clients;
CREATE POLICY "Org members can insert clients" ON public.clients AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update clients" ON public.clients;
CREATE POLICY "Org members can update clients" ON public.clients AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients" ON public.clients AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- DEPOSIT_CODES
DROP POLICY IF EXISTS "Org members can manage deposit codes" ON public.deposit_codes;
CREATE POLICY "Org members can manage deposit codes" ON public.deposit_codes AS PERMISSIVE FOR ALL TO authenticated USING (organization_id = get_user_org_id());

-- DEVICE_CATALOG
DROP POLICY IF EXISTS "Anyone can view device catalog" ON public.device_catalog;
CREATE POLICY "Anyone can view device catalog" ON public.device_catalog AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage device catalog" ON public.device_catalog;
CREATE POLICY "Admins can manage device catalog" ON public.device_catalog AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- DEVICES
DROP POLICY IF EXISTS "Org members can view devices" ON public.devices;
CREATE POLICY "Org members can view devices" ON public.devices AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert devices" ON public.devices;
CREATE POLICY "Org members can insert devices" ON public.devices AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update devices" ON public.devices;
CREATE POLICY "Org members can update devices" ON public.devices AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete devices" ON public.devices;
CREATE POLICY "Admins can delete devices" ON public.devices AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- INVENTORY
DROP POLICY IF EXISTS "Org members can view inventory" ON public.inventory;
CREATE POLICY "Org members can view inventory" ON public.inventory AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert inventory" ON public.inventory;
CREATE POLICY "Org members can insert inventory" ON public.inventory AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update inventory" ON public.inventory;
CREATE POLICY "Org members can update inventory" ON public.inventory AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete inventory" ON public.inventory;
CREATE POLICY "Admins can delete inventory" ON public.inventory AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- INVOICES
DROP POLICY IF EXISTS "Org members can view invoices" ON public.invoices;
CREATE POLICY "Org members can view invoices" ON public.invoices AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert invoices" ON public.invoices;
CREATE POLICY "Org members can insert invoices" ON public.invoices AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update invoices" ON public.invoices;
CREATE POLICY "Org members can update invoices" ON public.invoices AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
CREATE POLICY "Admins can delete invoices" ON public.invoices AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- ORGANIZATIONS
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations AS PERMISSIVE FOR SELECT TO authenticated USING (id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can update own organization" ON public.organizations;
CREATE POLICY "Admins can update own organization" ON public.organizations AS PERMISSIVE FOR UPDATE TO authenticated USING (id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- PROFILES
DROP POLICY IF EXISTS "Users can view profiles in own org" ON public.profiles;
CREATE POLICY "Users can view profiles in own org" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id());

-- QUOTES
DROP POLICY IF EXISTS "Org members can view quotes" ON public.quotes;
CREATE POLICY "Org members can view quotes" ON public.quotes AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert quotes" ON public.quotes;
CREATE POLICY "Org members can insert quotes" ON public.quotes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update quotes" ON public.quotes;
CREATE POLICY "Org members can update quotes" ON public.quotes AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
CREATE POLICY "Admins can delete quotes" ON public.quotes AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- REPAIR_TEMPLATES
DROP POLICY IF EXISTS "Anyone authenticated can view public templates" ON public.repair_templates;
CREATE POLICY "Anyone authenticated can view public templates" ON public.repair_templates AS PERMISSIVE FOR SELECT TO authenticated USING (is_public = true OR organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert templates" ON public.repair_templates;
CREATE POLICY "Org members can insert templates" ON public.repair_templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update own templates" ON public.repair_templates;
CREATE POLICY "Org members can update own templates" ON public.repair_templates AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete templates" ON public.repair_templates;
CREATE POLICY "Admins can delete templates" ON public.repair_templates AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- REPAIRS
DROP POLICY IF EXISTS "Org members can view repairs" ON public.repairs;
CREATE POLICY "Org members can view repairs" ON public.repairs AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert repairs" ON public.repairs;
CREATE POLICY "Org members can insert repairs" ON public.repairs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update repairs" ON public.repairs;
CREATE POLICY "Org members can update repairs" ON public.repairs AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete repairs" ON public.repairs;
CREATE POLICY "Admins can delete repairs" ON public.repairs AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- TECHNICIANS
DROP POLICY IF EXISTS "Org members can view technicians" ON public.technicians;
CREATE POLICY "Org members can view technicians" ON public.technicians AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can manage technicians" ON public.technicians;
CREATE POLICY "Admins can manage technicians" ON public.technicians AS PERMISSIVE FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles in own org" ON public.user_roles;
CREATE POLICY "Admins can manage roles in own org" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (
  has_role(auth.uid(), 'admin') AND EXISTS (
    SELECT 1 FROM profiles p1
    WHERE p1.user_id = auth.uid() AND p1.organization_id = (
      SELECT p2.organization_id FROM profiles p2 WHERE p2.user_id = user_roles.user_id LIMIT 1
    )
  )
);

-- SERVICES
DROP POLICY IF EXISTS "Org members can view services" ON public.services;
CREATE POLICY "Org members can view services" ON public.services AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert services" ON public.services;
CREATE POLICY "Org members can insert services" ON public.services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update services" ON public.services;
CREATE POLICY "Org members can update services" ON public.services AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services" ON public.services AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- ARTICLES
DROP POLICY IF EXISTS "Org members can view articles" ON public.articles;
CREATE POLICY "Org members can view articles" ON public.articles AS PERMISSIVE FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can insert articles" ON public.articles;
CREATE POLICY "Org members can insert articles" ON public.articles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update articles" ON public.articles;
CREATE POLICY "Org members can update articles" ON public.articles AS PERMISSIVE FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
CREATE POLICY "Admins can delete articles" ON public.articles AS PERMISSIVE FOR DELETE TO authenticated USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));
