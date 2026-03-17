
-- 1. Create trial_history table to track emails that have used a free trial
CREATE TABLE public.trial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organization_id uuid,
  trial_start_date timestamptz NOT NULL DEFAULT now(),
  trial_end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX trial_history_email_idx ON public.trial_history (email);

-- Enable RLS (no public access - only accessed by SECURITY DEFINER functions)
ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;
