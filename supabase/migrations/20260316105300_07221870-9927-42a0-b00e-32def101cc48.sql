ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'devis_en_attente';
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'devis_valide';
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'pret_reparation';
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'reparation_en_cours';