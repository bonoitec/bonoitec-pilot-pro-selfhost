-- Extend create_deposit_repair to accept split first/last name + email + postal_code + city,
-- so QR-deposit clients land in the same shape as clients created from inside the app.
-- Backwards-compatible: caller can omit the new params.

CREATE OR REPLACE FUNCTION public.create_deposit_repair(
  _deposit_code TEXT,
  _client_name TEXT,
  _client_phone TEXT,
  _device_type TEXT,
  _device_brand TEXT,
  _device_model TEXT,
  _issue TEXT,
  _client_first_name TEXT DEFAULT NULL,
  _client_last_name  TEXT DEFAULT NULL,
  _client_email      TEXT DEFAULT NULL,
  _client_postal_code TEXT DEFAULT NULL,
  _client_city       TEXT DEFAULT NULL
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
  _full_name TEXT;
  _first TEXT;
  _last TEXT;
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

  -- Compute first/last with fallbacks
  -- If caller provides explicit first/last, use them; otherwise split _client_name on first space.
  IF _client_first_name IS NOT NULL AND length(trim(_client_first_name)) > 0 THEN
    _first := trim(_client_first_name);
    _last  := NULLIF(trim(COALESCE(_client_last_name, '')), '');
    _full_name := trim(concat_ws(' ', _first, _last));
  ELSE
    _full_name := trim(_client_name);
    _first := split_part(_full_name, ' ', 1);
    _last  := NULLIF(substr(_full_name, length(split_part(_full_name, ' ', 1)) + 2), '');
  END IF;

  -- Create client
  INSERT INTO public.clients (
    organization_id, name, first_name, last_name, phone, email, postal_code, city
  )
  VALUES (
    _org_id,
    _full_name,
    _first,
    _last,
    trim(_client_phone),
    NULLIF(trim(COALESCE(_client_email, '')), ''),
    NULLIF(trim(COALESCE(_client_postal_code, '')), ''),
    NULLIF(trim(COALESCE(_client_city, '')), '')
  )
  RETURNING id INTO _client_id;

  -- Create device
  INSERT INTO public.devices (organization_id, client_id, type, brand, model)
  VALUES (
    _org_id, _client_id,
    COALESCE(_device_type, 'Smartphone'),
    COALESCE(_device_brand, 'Non spécifié'),
    COALESCE(_device_model, 'Non spécifié')
  )
  RETURNING id INTO _device_id;

  -- Create repair
  INSERT INTO public.repairs (organization_id, reference, client_id, device_id, issue, status)
  VALUES (
    _org_id,
    'REP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 4),
    _client_id, _device_id,
    trim(_issue),
    'nouveau'
  )
  RETURNING id, tracking_code INTO _repair_id, _tracking_code;

  RETURN json_build_object('success', true, 'repair_id', _repair_id, 'tracking_code', _tracking_code);
END;
$$;
