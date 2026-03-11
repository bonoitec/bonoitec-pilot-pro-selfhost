
-- Drop existing INSERT and UPDATE policies on repair_templates
DROP POLICY IF EXISTS "Org members can insert templates" ON public.repair_templates;
DROP POLICY IF EXISTS "Org members can update own templates" ON public.repair_templates;

-- Recreate INSERT policy with ownership enforcement
CREATE POLICY "Org members can insert templates" ON public.repair_templates
FOR INSERT TO authenticated
WITH CHECK (
  organization_id = get_user_org_id()
  AND (created_by = auth.uid() OR created_by IS NULL)
  AND (is_public = false OR has_role(auth.uid(), 'admin'::app_role))
);

-- Recreate UPDATE policy with ownership enforcement
CREATE POLICY "Org members can update own templates" ON public.repair_templates
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id())
WITH CHECK (
  organization_id = get_user_org_id()
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  AND (is_public = false OR has_role(auth.uid(), 'admin'::app_role))
);
