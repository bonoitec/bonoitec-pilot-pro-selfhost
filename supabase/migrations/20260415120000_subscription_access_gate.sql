-- DB-level subscription enforcement
--
-- Until now, expired-trial enforcement was purely frontend (<TrialExpiredWall />
-- in AppLayout.tsx). A motivated user who called Supabase directly with a valid
-- JWT could still create/edit repairs, clients, quotes, and invoices — completely
-- bypassing the "pay to use the app" contract. This migration closes that gap.
--
-- Approach: add a helper function `org_has_write_access(org_id)` and BEFORE
-- INSERT/UPDATE triggers on the write-gated tables. The trigger raises an
-- exception (SQLSTATE 42501 — insufficient_privilege) if the org's subscription
-- is invalid. SELECT is left open so users can still see/export their data
-- after expiry (cooperative, not punitive).
--
-- What counts as "valid write access":
--   1) Super-admin user (ops/support bypass)
--   2) subscription_status = 'active' AND (past_due_since IS NULL OR within 72h)
--      — i.e. paying customer, possibly in a card-failure grace window
--   3) subscription_status = 'trial' AND trial_end_date > now()
-- Everything else is blocked.

-- ── 1. Add past_due_since column ────────────────────────────────────────
-- Tracks when the org first went past_due (server-side anchor for the 72h
-- grace window). Cleared when the renewal eventually succeeds. Previously the
-- grace was computed from `current_period_end + 72h`, but Stripe advances
-- current_period_end when the renewal invoice is generated, so that formula
-- made grace ≈ 30 days instead of 3 days. past_due_since fixes that.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz NULL;

COMMENT ON COLUMN public.organizations.past_due_since IS
  'Timestamp when Stripe first reported this org''s subscription as past_due. Used to compute the 72h grace window. NULL when not in past_due state. Set by stripe-webhook on invoice.payment_failed, cleared on invoice.payment_succeeded or subscription recovery.';

-- ── 2. Helper function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.org_has_write_access(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    -- Super-admins always have access (ops/support bypass)
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = _org_id
        AND (
          -- Paid and in good standing (active), possibly inside the 72h
          -- past_due grace window anchored to the first failed-payment event.
          (
            o.subscription_status = 'active'
            AND (
              o.past_due_since IS NULL
              OR o.past_due_since > (now() - interval '72 hours')
            )
          )
          -- OR still within the free trial window
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

-- ── 3. Trigger function: raises if no access ───────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_subscription_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org uuid;
BEGIN
  -- Resolve the org_id from the row. All gated tables have organization_id NOT NULL.
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

-- ── 4. Attach trigger to write-gated tables ────────────────────────────
-- Gated tables = anything that represents operational business data. These
-- are the tables where a non-paying user could otherwise create/modify records
-- by calling the Supabase REST/RPC API directly with their JWT.
--
-- NOT gated (intentionally open after expiry, so users can recover gracefully):
--   - organizations (settings/billing updates)
--   - profiles, user_roles (user management)
--   - notification_logs (system writes)
--   - notification_templates (settings)
--   - trial_history, rate_limit_hits, admin_audit_log (system/audit tables)
--   - blog_posts, articles, device_catalog (shared content)
--
-- Any new write-gated table added in the future needs to be added here.
-- The loop raises if a named table doesn't exist, so table renames can't
-- silently un-gate the rest of the system.
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

COMMENT ON FUNCTION public.org_has_write_access(uuid) IS
  'Returns true if the given organization has an active paid sub (optionally in 72h past_due grace) OR is within a valid trial window. Used by enforce_subscription_access trigger to block writes at the DB layer.';

COMMENT ON FUNCTION public.enforce_subscription_access() IS
  'BEFORE INSERT/UPDATE trigger that raises SQLSTATE 42501 if the row''s organization has no valid subscription. Attached to repairs/clients/quotes/invoices/inventory/etc.';
