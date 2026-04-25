-- Backfill clients.postal_code + clients.city when they're NULL but the locality
-- is embedded in clients.address (legacy CreateRepairWizard concatenated the
-- composite address as "street, 75011 Paris, France" or similar).
--
-- Heuristic: find a 5-digit French postal code in `address`. The token after it
-- (until the next comma or end) is the city. The text before it (trimmed) is
-- the street.

UPDATE public.clients
SET
  postal_code = sub.postal,
  city        = sub.city,
  address     = NULLIF(trim(BOTH ' ,' FROM sub.street), '')
FROM (
  SELECT
    id,
    address,
    (regexp_match(address, '\m(\d{5})\M'))[1] AS postal,
    NULLIF(trim(BOTH ' ,' FROM (regexp_match(address, '\m\d{5}\s+([^,]+?)(?:,|$)'))[1]), '') AS city,
    regexp_replace(address, '\s*,?\s*\d{5}\s+[^,]+(,|$)', '', 'g') AS street
  FROM public.clients
  WHERE address IS NOT NULL
    AND postal_code IS NULL
    AND city IS NULL
    AND address ~ '\m\d{5}\M'
) AS sub
WHERE clients.id = sub.id;
