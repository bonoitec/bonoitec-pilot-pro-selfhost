
-- Add compatibility fields to inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS compatible_brand text DEFAULT NULL;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS compatible_model text DEFAULT NULL;

-- Add compatibility fields to services  
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS compatible_brand text DEFAULT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS compatible_model text DEFAULT NULL;

-- Add services_used to repairs for tracking selected services
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS services_used jsonb DEFAULT '[]'::jsonb;
