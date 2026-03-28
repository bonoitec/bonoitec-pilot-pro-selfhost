CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_hits_key_created ON public.rate_limit_hits (key, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_hits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limit_hits WHERE created_at < now() - interval '10 minutes';
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _window_seconds int DEFAULT 60,
  _max_requests int DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int;
BEGIN
  IF random() < 0.1 THEN
    PERFORM public.cleanup_rate_limit_hits();
  END IF;

  SELECT count(*) INTO _count
  FROM public.rate_limit_hits
  WHERE key = _key
    AND created_at > now() - (_window_seconds || ' seconds')::interval;

  IF _count >= _max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_hits (key) VALUES (_key);

  RETURN true;
END;
$$;

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;