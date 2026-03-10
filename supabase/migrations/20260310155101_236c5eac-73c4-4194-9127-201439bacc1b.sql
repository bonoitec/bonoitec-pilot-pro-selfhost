
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS checklist_label text NOT NULL DEFAULT 'Checklist de prise en charge',
  ADD COLUMN IF NOT EXISTS article_categories jsonb NOT NULL DEFAULT '["Chargeur","Câble","Coque","Protection écran","Adaptateur","Accessoire","Autre"]'::jsonb;
