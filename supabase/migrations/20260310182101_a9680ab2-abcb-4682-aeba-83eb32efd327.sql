
CREATE TABLE public.inventory_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  old_price numeric NOT NULL DEFAULT 0,
  new_price numeric NOT NULL DEFAULT 0,
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view price history"
  ON public.inventory_price_history FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert price history"
  ON public.inventory_price_history FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE OR REPLACE FUNCTION public.log_inventory_price_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.buy_price IS DISTINCT FROM NEW.buy_price THEN
    INSERT INTO public.inventory_price_history (inventory_id, organization_id, old_price, new_price, supplier)
    VALUES (NEW.id, NEW.organization_id, OLD.buy_price, NEW.buy_price, NEW.supplier);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_price_change
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_price_change();
