
-- Fix repair_templates UPDATE policy: add ownership check to USING condition
DROP POLICY IF EXISTS "Org members can update own templates" ON public.repair_templates;

CREATE POLICY "Org members can update own templates"
ON public.repair_templates
FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_org_id()
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  organization_id = get_user_org_id()
  AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  AND (is_public = false OR has_role(auth.uid(), 'admin'::app_role))
);
