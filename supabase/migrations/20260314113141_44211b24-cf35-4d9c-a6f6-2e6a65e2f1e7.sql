
-- Fix repair_templates SELECT: restrict public templates to own org only
DROP POLICY IF EXISTS "Anyone authenticated can view public templates" ON public.repair_templates;

CREATE POLICY "Org members can view templates"
ON public.repair_templates FOR SELECT TO authenticated
USING (organization_id = get_user_org_id());
