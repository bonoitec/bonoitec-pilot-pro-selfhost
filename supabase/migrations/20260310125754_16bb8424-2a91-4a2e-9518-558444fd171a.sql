
-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE
-- We must DROP and recreate each policy

-- ============ articles ============
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
CREATE POLICY "Admins can delete articles" ON public.articles FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert articles" ON public.articles;
CREATE POLICY "Org members can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update articles" ON public.articles;
CREATE POLICY "Org members can update articles" ON public.articles FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view articles" ON public.articles;
CREATE POLICY "Org members can view articles" ON public.articles FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ clients ============
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert clients" ON public.clients;
CREATE POLICY "Org members can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update clients" ON public.clients;
CREATE POLICY "Org members can update clients" ON public.clients FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view clients" ON public.clients;
CREATE POLICY "Org members can view clients" ON public.clients FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ deposit_codes ============
DROP POLICY IF EXISTS "Org members can manage deposit codes" ON public.deposit_codes;
CREATE POLICY "Org members can manage deposit codes" ON public.deposit_codes FOR ALL TO authenticated USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ============ device_catalog ============
DROP POLICY IF EXISTS "Admins can manage device catalog" ON public.device_catalog;
CREATE POLICY "Admins can manage device catalog" ON public.device_catalog FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view device catalog" ON public.device_catalog;
CREATE POLICY "Anyone can view device catalog" ON public.device_catalog FOR SELECT TO authenticated USING (true);

-- ============ devices ============
DROP POLICY IF EXISTS "Admins can delete devices" ON public.devices;
CREATE POLICY "Admins can delete devices" ON public.devices FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert devices" ON public.devices;
CREATE POLICY "Org members can insert devices" ON public.devices FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update devices" ON public.devices;
CREATE POLICY "Org members can update devices" ON public.devices FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view devices" ON public.devices;
CREATE POLICY "Org members can view devices" ON public.devices FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ inventory ============
DROP POLICY IF EXISTS "Admins can delete inventory" ON public.inventory;
CREATE POLICY "Admins can delete inventory" ON public.inventory FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert inventory" ON public.inventory;
CREATE POLICY "Org members can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update inventory" ON public.inventory;
CREATE POLICY "Org members can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view inventory" ON public.inventory;
CREATE POLICY "Org members can view inventory" ON public.inventory FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ invoices ============
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert invoices" ON public.invoices;
CREATE POLICY "Org members can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update invoices" ON public.invoices;
CREATE POLICY "Org members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view invoices" ON public.invoices;
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ notification_logs ============
DROP POLICY IF EXISTS "Org members can insert notification logs" ON public.notification_logs;
CREATE POLICY "Org members can insert notification logs" ON public.notification_logs FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view notification logs" ON public.notification_logs;
CREATE POLICY "Org members can view notification logs" ON public.notification_logs FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ notification_templates ============
DROP POLICY IF EXISTS "Admins can delete notification templates" ON public.notification_templates;
CREATE POLICY "Admins can delete notification templates" ON public.notification_templates FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert notification templates" ON public.notification_templates;
CREATE POLICY "Admins can insert notification templates" ON public.notification_templates FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update notification templates" ON public.notification_templates;
CREATE POLICY "Admins can update notification templates" ON public.notification_templates FOR UPDATE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can view notification templates" ON public.notification_templates;
CREATE POLICY "Org members can view notification templates" ON public.notification_templates FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ organizations ============
DROP POLICY IF EXISTS "Admins can insert organization" ON public.organizations;
CREATE POLICY "Admins can insert organization" ON public.organizations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update own organization" ON public.organizations;
CREATE POLICY "Admins can update own organization" ON public.organizations FOR UPDATE TO authenticated USING ((id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;
CREATE POLICY "Org members can view organization" ON public.organizations FOR SELECT TO authenticated USING (id = get_user_org_id());

-- ============ profiles ============
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view profiles in own org" ON public.profiles;
CREATE POLICY "Users can view profiles in own org" ON public.profiles FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ quotes ============
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;
CREATE POLICY "Admins can delete quotes" ON public.quotes FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert quotes" ON public.quotes;
CREATE POLICY "Org members can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update quotes" ON public.quotes;
CREATE POLICY "Org members can update quotes" ON public.quotes FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view quotes" ON public.quotes;
CREATE POLICY "Org members can view quotes" ON public.quotes FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ repair_messages ============
DROP POLICY IF EXISTS "Org members can insert repair messages" ON public.repair_messages;
CREATE POLICY "Org members can insert repair messages" ON public.repair_messages FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update repair messages" ON public.repair_messages;
CREATE POLICY "Org members can update repair messages" ON public.repair_messages FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view repair messages" ON public.repair_messages;
CREATE POLICY "Org members can view repair messages" ON public.repair_messages FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ repair_templates ============
DROP POLICY IF EXISTS "Admins can delete templates" ON public.repair_templates;
CREATE POLICY "Admins can delete templates" ON public.repair_templates FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone authenticated can view public templates" ON public.repair_templates;
CREATE POLICY "Anyone authenticated can view public templates" ON public.repair_templates FOR SELECT TO authenticated USING ((is_public = true) OR (organization_id = get_user_org_id()));

DROP POLICY IF EXISTS "Org members can insert templates" ON public.repair_templates;
CREATE POLICY "Org members can insert templates" ON public.repair_templates FOR INSERT TO authenticated WITH CHECK ((organization_id = get_user_org_id()) AND ((is_public = false) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Org members can update own templates" ON public.repair_templates;
CREATE POLICY "Org members can update own templates" ON public.repair_templates FOR UPDATE TO authenticated USING (organization_id = get_user_org_id()) WITH CHECK ((organization_id = get_user_org_id()) AND ((is_public = false) OR has_role(auth.uid(), 'admin'::app_role)));

-- ============ repairs ============
DROP POLICY IF EXISTS "Admins can delete repairs" ON public.repairs;
CREATE POLICY "Admins can delete repairs" ON public.repairs FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert repairs" ON public.repairs;
CREATE POLICY "Org members can insert repairs" ON public.repairs FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update repairs" ON public.repairs;
CREATE POLICY "Org members can update repairs" ON public.repairs FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view repairs" ON public.repairs;
CREATE POLICY "Org members can view repairs" ON public.repairs FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ services ============
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can insert services" ON public.services;
CREATE POLICY "Org members can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can update services" ON public.services;
CREATE POLICY "Org members can update services" ON public.services FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Org members can view services" ON public.services;
CREATE POLICY "Org members can view services" ON public.services FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ technicians ============
DROP POLICY IF EXISTS "Admins can manage technicians" ON public.technicians;
CREATE POLICY "Admins can manage technicians" ON public.technicians FOR ALL TO authenticated USING ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role)) WITH CHECK ((organization_id = get_user_org_id()) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can view technicians" ON public.technicians;
CREATE POLICY "Org members can view technicians" ON public.technicians FOR SELECT TO authenticated USING (organization_id = get_user_org_id());

-- ============ user_roles ============
DROP POLICY IF EXISTS "Admins can manage roles in own org" ON public.user_roles;
CREATE POLICY "Admins can manage roles in own org" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND (EXISTS (SELECT 1 FROM profiles p1 WHERE p1.user_id = auth.uid() AND p1.organization_id = (SELECT p2.organization_id FROM profiles p2 WHERE p2.user_id = user_roles.user_id LIMIT 1))));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
