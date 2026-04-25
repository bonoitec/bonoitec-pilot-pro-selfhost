-- Split clients.name into first_name + last_name for norme-européenne facture buyer identification.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_name  TEXT;

-- Best-effort backfill: split existing "name" on first space.
UPDATE public.clients
SET first_name = split_part(name, ' ', 1),
    last_name  = NULLIF(substr(name, length(split_part(name, ' ', 1)) + 2), '')
WHERE first_name IS NULL
  AND last_name  IS NULL
  AND name IS NOT NULL;
