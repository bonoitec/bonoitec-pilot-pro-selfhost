
CREATE TABLE public.purchase_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  order_number TEXT,
  notes TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view purchase history"
  ON public.purchase_history FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can insert purchase history"
  ON public.purchase_history FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can update purchase history"
  ON public.purchase_history FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete purchase history"
  ON public.purchase_history FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.has_role(auth.uid(), 'admin'));
