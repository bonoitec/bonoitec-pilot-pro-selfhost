-- C5 part 1: extend app_role enum with 'super_admin'.
-- Postgres requires `ALTER TYPE ADD VALUE` to commit BEFORE the value can be used,
-- so the function that uses it lives in a separate migration file.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
