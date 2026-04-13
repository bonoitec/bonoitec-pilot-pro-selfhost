-- Admin dashboard — full detail of one organization in a single query.
--
-- Returns a JSON object containing:
--   - shop: profile + subscription + stripe refs
--   - users: full list of user rows for this org (auth.users + profiles + user_roles)
--   - pieces: { total_items, total_quantity, low_stock_count, recent[10] }
--   - repairs: { total, last_7d, by_status map, recent[10] }
--   - invoices: { total, paid_count, paid_amount, recent[10] }
--
-- Guarded by _require_super_admin(). STABLE because no side effects.

CREATE OR REPLACE FUNCTION public.admin_get_organization_detail(_org_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _shop json;
  _users json;
  _pieces json;
  _repairs json;
  _invoices json;
BEGIN
  PERFORM public._require_super_admin();

  -- Shop header
  SELECT json_build_object(
    'id', o.id,
    'name', o.name,
    'email', o.email,
    'phone', o.phone,
    'address', o.address,
    'siret', o.siret,
    'logo_url', o.logo_url,
    'vat_enabled', o.vat_enabled,
    'vat_rate', o.vat_rate,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'subscription_status', o.subscription_status::text,
    'plan_name', o.plan_name,
    'trial_start_date', o.trial_start_date,
    'trial_end_date', o.trial_end_date,
    'stripe_customer_id', o.stripe_customer_id,
    'stripe_subscription_id', o.stripe_subscription_id
  )
  INTO _shop
  FROM public.organizations o
  WHERE o.id = _org_id;

  IF _shop IS NULL THEN
    RETURN NULL;
  END IF;

  -- Users belonging to this org
  SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
  INTO _users
  FROM (
    SELECT
      au.id AS user_id,
      au.email::text AS email,
      p.full_name,
      au.created_at,
      au.last_sign_in_at,
      au.email_confirmed_at,
      COALESCE(
        (SELECT ur.role::text FROM public.user_roles ur
         WHERE ur.user_id = au.id AND ur.organization_id = _org_id
         ORDER BY CASE ur.role::text
           WHEN 'super_admin' THEN 0
           WHEN 'admin'       THEN 1
           ELSE 2 END
         LIMIT 1),
        'technician'
      ) AS role
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.organization_id = _org_id
    ORDER BY au.created_at DESC
  ) u;

  -- Inventory / pieces summary
  SELECT json_build_object(
    'total_items', COALESCE((SELECT count(*) FROM public.inventory WHERE organization_id = _org_id), 0),
    'total_quantity', COALESCE((SELECT SUM(quantity) FROM public.inventory WHERE organization_id = _org_id), 0),
    'low_stock_count', COALESCE((SELECT count(*) FROM public.inventory
                                 WHERE organization_id = _org_id
                                   AND quantity <= min_quantity), 0),
    'recent', COALESCE((
      SELECT json_agg(row_to_json(r))
      FROM (
        SELECT id, name, category, quantity, min_quantity, buy_price, sell_price, updated_at
        FROM public.inventory
        WHERE organization_id = _org_id
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 10
      ) r
    ), '[]'::json)
  )
  INTO _pieces;

  -- Repairs summary + recent
  SELECT json_build_object(
    'total', COALESCE((SELECT count(*) FROM public.repairs WHERE organization_id = _org_id), 0),
    'last_7d', COALESCE((SELECT count(*) FROM public.repairs
                         WHERE organization_id = _org_id
                           AND created_at > now() - interval '7 days'), 0),
    'recent', COALESCE((
      SELECT json_agg(row_to_json(r))
      FROM (
        SELECT rp.id, rp.reference, rp.status::text, rp.final_price, rp.estimated_price,
               rp.created_at, rp.updated_at,
               d.brand AS device_brand, d.model AS device_model,
               c.name AS client_name
        FROM public.repairs rp
        LEFT JOIN public.devices d ON d.id = rp.device_id
        LEFT JOIN public.clients c ON c.id = rp.client_id
        WHERE rp.organization_id = _org_id
        ORDER BY rp.created_at DESC
        LIMIT 10
      ) r
    ), '[]'::json)
  )
  INTO _repairs;

  -- Invoices summary + recent
  SELECT json_build_object(
    'total', COALESCE((SELECT count(*) FROM public.invoices WHERE organization_id = _org_id), 0),
    'paid_count', COALESCE((SELECT count(*) FROM public.invoices
                            WHERE organization_id = _org_id AND status = 'payee'), 0),
    'paid_amount_ttc', COALESCE((SELECT SUM(total_ttc) FROM public.invoices
                                  WHERE organization_id = _org_id AND status = 'payee'), 0),
    'recent', COALESCE((
      SELECT json_agg(row_to_json(r))
      FROM (
        SELECT i.id, i.reference, i.status::text, i.total_ttc, i.total_ht, i.paid_at,
               i.created_at, i.payment_method::text,
               c.name AS client_name
        FROM public.invoices i
        LEFT JOIN public.clients c ON c.id = i.client_id
        WHERE i.organization_id = _org_id
        ORDER BY i.created_at DESC
        LIMIT 10
      ) r
    ), '[]'::json)
  )
  INTO _invoices;

  RETURN json_build_object(
    'shop', _shop,
    'users', _users,
    'pieces', _pieces,
    'repairs', _repairs,
    'invoices', _invoices
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_get_organization_detail(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_organization_detail(uuid) TO authenticated;
