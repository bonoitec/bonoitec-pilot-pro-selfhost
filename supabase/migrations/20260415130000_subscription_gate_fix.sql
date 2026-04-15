-- Fix-forward migration for the subscription access gate.
--
-- The previous migration (20260415120000) had three bugs that independent review
-- caught after it was already applied on the remote:
--   1. Wrong table names: it tried to gate `parts_inventory`, `stock_movements`,
--      `quote_items`, `invoice_items` — none of which exist in this schema. The
--      `IF EXISTS` guard silently skipped them, so 60% of the write surface
--      (inventory, services, technicians, repair_templates, repair_messages,
--      inventory_price_history, purchase_history, deposit_codes) remained
--      ungated. An expired user could still call the REST API directly to
--      modify stock, services, etc.
--   2. The `org_has_write_access` helper referenced `_past_due_elapsed` suffix
--      logic that nothing ever set — effectively dead code. A past_due user
--      who exhausted grace would still pass the trigger check.
--   3. The past_due grace window was computed from `current_period_end + 72h`,
--      which Stripe advances to the NEXT period as soon as the renewal invoice
--      is generated. Effective grace was ~30 days instead of 3 days.
--
-- This migration:
--   - Adds `organizations.past_due_since` timestamptz as the authoritative
--     server-side anchor for the grace window. Set by stripe-webhook on the
--     first `invoice.payment_failed` event, cleared on recovery.
--   - Rewrites `org_has_write_access` to use `past_due_since > now() - 72h`
--     with no reference to dead suffix strings.
--   - Attaches triggers to the actual table names in this schema.

-- ── 1. New column: past_due_since ──────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz NULL;

COMMENT ON COLUMN public.organizations.past_due_since IS
  'Timestamp when Stripe first reported this org''s subscription as past_due. Used to compute the 72h grace window. NULL when not in past_due state. Set by stripe-webhook on invoice.payment_failed, cleared on recovery.';

-- ── 2. Rewrite helper with fixed grace logic ────────────────────────────
CREATE OR REPLACE FUNCTION public.org_has_write_access(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = _org_id
        AND (
          (
            o.subscription_status = 'active'
            AND (
              o.past_due_since IS NULL
              OR o.past_due_since > (now() - interval '72 hours')
            )
          )
          OR (
            o.subscription_status = 'trial'
            AND o.trial_end_date IS NOT NULL
            AND o.trial_end_date > now()
          )
        )
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.org_has_write_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.org_has_write_access(uuid) TO authenticated;

-- Trigger function unchanged — the fix is in the helper it calls.
-- Re-declare CREATE OR REPLACE to make this migration self-sufficient.
CREATE OR REPLACE FUNCTION public.enforce_subscription_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org uuid;
BEGIN
  _org := COALESCE(NEW.organization_id, OLD.organization_id);
  IF _org IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.org_has_write_access(_org) THEN
    RAISE EXCEPTION 'Subscription required: this organization has no active subscription or its trial has ended'
      USING ERRCODE = '42501',
            HINT = 'Renew your subscription from the billing portal to continue writing.';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.enforce_subscription_access() FROM public;

-- ── 3. Attach triggers to the REAL write-gated tables ──────────────────
-- List verified against `grep "CREATE TABLE.*public\." supabase/migrations/*.sql`
-- on 2026-04-15. Any new write-gated table needs to be added here.
--
-- NOT gated (open after expiry so users can recover gracefully):
--   organizations, profiles, user_roles, notification_logs, notification_templates,
--   trial_history, rate_limit_hits, admin_audit_log, blog_posts, articles,
--   device_catalog.
DO $$
DECLARE
  _table text;
  _tables text[] := ARRAY[
    'repairs',
    'clients',
    'quotes',
    'invoices',
    'devices',
    'inventory',
    'inventory_price_history',
    'purchase_history',
    'services',
    'technicians',
    'repair_templates',
    'repair_messages',
    'deposit_codes'
  ];
  _missing text[] := ARRAY[]::text[];
BEGIN
  FOREACH _table IN ARRAY _tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _table
    ) THEN
      _missing := _missing || _table;
    ELSE
      EXECUTE format(
        'DROP TRIGGER IF EXISTS trg_enforce_subscription_access ON public.%I',
        _table
      );
      EXECUTE format(
        'CREATE TRIGGER trg_enforce_subscription_access
           BEFORE INSERT OR UPDATE ON public.%I
           FOR EACH ROW
           EXECUTE FUNCTION public.enforce_subscription_access()',
        _table
      );
    END IF;
  END LOOP;

  IF array_length(_missing, 1) > 0 THEN
    RAISE EXCEPTION
      'Subscription gate migration: % table(s) named in gate list but missing from public schema: %. Table renamed or removed? Fix the list before proceeding.',
      array_length(_missing, 1),
      array_to_string(_missing, ', ');
  END IF;
END $$;

-- ── 4. Drop any stale triggers left by the bad migration ──────────────
-- The previous migration attempted to attach triggers to non-existent tables
-- (parts_inventory, etc.), so no cleanup is needed there. But the repairs/
-- clients/quotes/invoices/devices triggers WERE created with the broken
-- helper — replacing the helper via CREATE OR REPLACE above automatically
-- fixes their behavior since triggers call the function by name. No action
-- needed on the existing triggers.

COMMENT ON FUNCTION public.org_has_write_access(uuid) IS
  'Returns true if the org has an active paid sub (optionally within 72h past_due grace) OR is in a valid trial. Used by enforce_subscription_access trigger.';
