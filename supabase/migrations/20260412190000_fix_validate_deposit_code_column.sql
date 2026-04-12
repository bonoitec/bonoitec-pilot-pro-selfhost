-- Fix: validate_deposit_code referenced deposit_codes.is_active (doesn't exist).
-- The real column is named `active`. The bug was introduced in the H6 rate-limit
-- migration (20260412165055_rate_limit_public_rpcs.sql). Customers using the
-- public deposit flow would have gotten a 42703 undefined_column error until
-- this migration runs.

CREATE OR REPLACE FUNCTION public.validate_deposit_code(_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed boolean;
  _exists boolean;
  _normalized text;
BEGIN
  _normalized := trim(COALESCE(_code, ''));
  IF length(_normalized) = 0 OR length(_normalized) > 64 THEN
    RETURN false;
  END IF;

  -- Rate limit: 30 lookups per minute per code
  SELECT public.check_rate_limit('deposit-validate:' || _normalized, 60, 30) INTO _allowed;
  IF _allowed = false THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '23P01';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.deposit_codes
    WHERE code = _normalized AND active = true
  ) INTO _exists;

  RETURN _exists;
END;
$function$;
