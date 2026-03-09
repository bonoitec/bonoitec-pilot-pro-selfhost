
-- Add intake and timer fields to repairs
ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS intake_checklist jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS screen_condition integer,
  ADD COLUMN IF NOT EXISTS frame_condition integer,
  ADD COLUMN IF NOT EXISTS back_condition integer,
  ADD COLUMN IF NOT EXISTS customer_signature_url text,
  ADD COLUMN IF NOT EXISTS repair_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS repair_ended_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Add intake_items to organizations for customizable checklists
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS intake_checklist_items jsonb DEFAULT '["Alimentation / charge", "Écran", "Boutons", "Caméra", "Son", "Réseau", "Face ID / empreinte", "Autres problèmes"]'::jsonb;
