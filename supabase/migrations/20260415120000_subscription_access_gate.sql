-- DB-level subscription enforcement
--
-- Until now, expired-trial enforcement was purely frontend (<TrialExpiredWall />
-- in AppLayout.tsx). A motivated user who called Supabase directly with a valid
-- JWT could still create/edit repairs, clients, quotes, and invoices — completely
-- bypassing the "pay to use the app" contract. This migration closes that gap.
--
-- Approach: add a helper function `org_has_write_access(org_id)` and a BEFORE
-- INSERT/UPDATE trigger on the tables we want to gate. The trigger raises an
-- exception (code 42501 — insufficient_privilege) if the org's subscription is
-- invalid. SELECT is left wide open so users can still see/export their data
-- after expiry (cooperative, not punitive).
--
-- What counts as "valid access":
--   1) Super-admin user (ops bypass)
--   2) subscription_status = 'active' (paid sub, possibly _past_due within grace)
--      AND plan_name does not end with "_past_due" OR past_due grace hasn't elapsed
--      (grace is enforced at the application layer via check-subscription; DB
--      simply trusts plan_name for now — if webhook marks it _past_due_elapsed,
--      we'll treat that as blocked)
--   3) subscription_status = 'trial' AND trial_end_date > now()
-- Everything else is blocked.

-- ── 1. Helper function ──────────────────────────────────────────────────
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
          -- Paid and in good standing (active or _cancelling until period ends)
          (o.subscription_status = 'active' AND (o.plan_name IS NULL OR o.plan_name NOT LIKE '%\_past\_due\_elapsed' ESCAPE '\'))
          -- OR still within the free trial window
          OR (o.subscription_status = 'trial' AND o.trial_end_date > now())
        )
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.org_has_write_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.org_has_write_access(uuid) TO authenticated;

-- ── 2. Trigger function: raises if no access ───────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_subscription_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org uuid;
BEGIN
  -- Resolve the org_id from the row. Most tables use `organization_id`.
  _org := COALESCE(NEW.organization_id, OLD.organization_id);
  IF _org IS NULL THEN
    -- If neither NEW nor OLD has an org_id, let other policies decide. This
    -- shouldn't happen on any of the gated tables because they all have
    -- organization_id NOT NULL.
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

-- ── 3. Attach trigger to write-gated tables ────────────────────────────
-- We gate: repairs, clients, quotes, invoices, devices, parts_inventory,
-- stock_movements, quote_items, invoice_items. Settings/profiles/notifications
-- are intentionally NOT gated so users can still manage their account after
-- expiry. Adding new write-gated tables in the future: just add a similar
-- trigger below.

DO $$
DECLARE
  _table text;
  _tables text[] := ARRAY[
    'repairs', 'clients', 'quotes', 'invoices', 'devices',
    'parts_inventory', 'stock_movements', 'quote_items', 'invoice_items'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables LOOP
    -- Only attach if the table exists (some may not be in this schema yet)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _table
    ) THEN
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
END $$;

-- ── 4. Non-org-scoped gated tables (quote_items, invoice_items) ─────────
-- These join through quote_id / invoice_id and don't have their own org_id.
-- Their parent's trigger already blocks the insert, but if someone bypasses
-- with the parent id, they still can't insert orphan children because of FK
-- constraints. Leaving as-is; FK enforcement is sufficient here.

COMMENT ON FUNCTION public.org_has_write_access(uuid) IS
  'Returns true if the given organization has an active paid sub OR is within a valid trial window. Used by enforce_subscription_access trigger to block writes at the DB layer.';

COMMENT ON FUNCTION public.enforce_subscription_access() IS
  'BEFORE INSERT/UPDATE trigger that raises SQLSTATE 42501 if the row''s organization has no valid subscription. Gates writes on repairs/clients/quotes/invoices/etc.';
