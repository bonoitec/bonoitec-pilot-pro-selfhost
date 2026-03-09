
-- Drop overly permissive anon insert policies
DROP POLICY IF EXISTS "Anon can insert clients via deposit" ON public.clients;
DROP POLICY IF EXISTS "Anon can insert repairs via deposit" ON public.repairs;
DROP POLICY IF EXISTS "Anon can insert devices via deposit" ON public.devices;

-- Create a secure function for deposit instead
CREATE OR REPLACE FUNCTION public.create_deposit_repair(
  _deposit_code TEXT,
  _client_name TEXT,
  _client_phone TEXT,
  _device_type TEXT,
  _device_brand TEXT,
  _device_model TEXT,
  _issue TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _client_id UUID;
  _device_id UUID;
  _repair_id UUID;
  _tracking_code TEXT;
BEGIN
  -- Validate deposit code
  SELECT organization_id INTO _org_id
  FROM public.deposit_codes
  WHERE code = _deposit_code AND active = true;

  IF _org_id IS NULL THEN
    RETURN json_build_object('error', 'Code de dépôt invalide');
  END IF;

  -- Validate inputs
  IF _client_name IS NULL OR length(trim(_client_name)) < 2 THEN
    RETURN json_build_object('error', 'Nom invalide');
  END IF;
  IF _client_phone IS NULL OR length(trim(_client_phone)) < 6 THEN
    RETURN json_build_object('error', 'Téléphone invalide');
  END IF;

  -- Create client
  INSERT INTO public.clients (organization_id, name, phone)
  VALUES (_org_id, trim(_client_name), trim(_client_phone))
  RETURNING id INTO _client_id;

  -- Create device
  INSERT INTO public.devices (organization_id, client_id, type, brand, model)
  VALUES (_org_id, _client_id, COALESCE(_device_type, 'Smartphone'), COALESCE(_device_brand, 'Non spécifié'), COALESCE(_device_model, 'Non spécifié'))
  RETURNING id INTO _device_id;

  -- Create repair
  INSERT INTO public.repairs (organization_id, reference, client_id, device_id, issue, status)
  VALUES (_org_id, 'REP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 4), _client_id, _device_id, trim(_issue), 'nouveau')
  RETURNING id, tracking_code INTO _repair_id, _tracking_code;

  RETURN json_build_object('success', true, 'repair_id', _repair_id, 'tracking_code', _tracking_code);
END;
$$;
