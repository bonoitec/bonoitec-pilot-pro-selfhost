# Admin Dashboard — Redesign + Actions

**Date:** 2026-04-13
**Status:** Design approved, implementation pending
**Project:** BonoitecPilot (bonoitecpilot.fr)

---

## Context

BonoitecPilot is a multi-tenant SaaS for French electronics repair shops. An earlier session built a basic `/admin` page with 4 tabs (Overview, Organizations, Users, Activity) — read-only, using generic data tables. The non-technical platform owner rejected it with specific critiques:

1. **It doesn't match the rest of the website.** BonoitecPilot uses Cards, Badges, and Dialogs heavily (see `Index.tsx`, `Repairs.tsx`, `RepairDetailDialog.tsx`). The admin page was a table-heavy "backend admin" look — out of place.
2. **Multi-tab navigation forces context switching.** To see everything about one shop, you have to jump between "Organizations" (info) and "Users" (its users) and "Activity" (its recent events). Non-technical admin wants to **drill into one shop and see everything**.
3. **Read-only is useless for daily operations.** Owner needs to:
   - Extend a trial when a customer asks for more time
   - Grant complimentary subscriptions to partners/VIPs
   - Suspend/delete abusive shops
   - Reset locked-out users' passwords
   - Change a user's role when the shop owner leaves
   - Delete users on GDPR requests
4. **The sidebar doesn't belong on the admin page.** Admin is a separate mental context — it should feel like its own app, not a section of the customer app.

**Goal of this redesign:** replace the current `/admin` page with a **single-page, website-styled dashboard** where the owner can (a) see platform stats at a glance, (b) browse a grid of shop cards that look like the rest of the app, (c) click a shop to drill into a rich detail dialog with all its data, and (d) perform 11 admin actions (edit/delete/suspend/extend/etc.) with an audit trail.

---

## Non-goals (explicit for v1)

- **Impersonation** — "log in as user X to debug" is powerful but risky without legal/audit framework. Deferred.
- **Broadcast emails** — needs UI for composing + audience selection. Own subproject.
- **Announcement banners** — needs new table + component. Scope creep.
- **Live Stripe / Resend / OpenRouter API calls** — all stats come from DB state (already kept in sync by existing functions).
- **Mobile responsiveness** — desktop-first; admin doesn't need mobile urgency.
- **Separate login credentials** — owner explicitly said: keep the existing Google OAuth admin account (`medrafa.bbgh@gmail.com`, already has `super_admin` role).
- **Cohort / retention analytics** — needs time-series infra.

---

## Architecture

```
/admin                                   ← route, outside <AppLayout>
│
├─ SuperAdminRoute guard                 ← existing, unchanged
│   (useIsSuperAdmin() → redirect if not)
│
└─ AdminShell layout (NEW)               ← full-width, no sidebar, thin top bar
    │
    └─ SuperAdmin page (REPLACES current)
        │
        ├─ StatsBar                      ← 6 KPI cards + alerts strip
        ├─ ShopGrid                      ← search + filter + card grid
        │   └─ ShopCard[]                ← one per organization
        │
        ├─ ShopDetailDialog (modal)      ← opens on card click
        │   ├─ ShopActionsBar
        │   ├─ ShopUsersSection          ← users list + per-user actions
        │   ├─ ShopPiecesSection         ← inventory summary + alerts
        │   ├─ ShopRepairsSection        ← repairs summary + recents
        │   └─ ShopInvoicesSection       ← invoices summary + recents
        │
        └─ AuditLogSheet (slide-in)      ← opened from top-bar button
```

**Routing change:** `/admin` is moved OUT of the `<ProtectedRoute><AppLayout>` wrapper and into its own dedicated block, so it does not render `AppSidebar`, customer top bar, or trial banners. It gets its own `AdminShell` layout.

**Auth model (unchanged):** Supabase session via Google OAuth. The existing `useIsSuperAdmin()` hook queries the `is_super_admin()` RPC. `medrafa.bbgh@gmail.com` already has `super_admin` role in `user_roles`. No new credentials.

---

## File tree

### NEW files

```
src/pages/admin/
├── AdminShell.tsx                   # layout: thin top bar + full-width content
├── SuperAdmin.tsx                    # page entry (replaces src/pages/SuperAdmin.tsx)
├── components/
│   ├── StatsBar.tsx                  # 6 KPI cards + alerts strip
│   ├── ShopGrid.tsx                  # search + status filter + grid container
│   ├── ShopCard.tsx                  # single shop card
│   ├── ShopDetailDialog.tsx          # big modal
│   ├── ShopActionsBar.tsx            # action buttons inside the dialog
│   ├── ShopUsersSection.tsx          # users list + per-row actions
│   ├── ShopPiecesSection.tsx         # inventory summary
│   ├── ShopRepairsSection.tsx        # repairs summary
│   ├── ShopInvoicesSection.tsx       # invoices summary
│   ├── AuditLogSheet.tsx             # slide-in right drawer (shadcn Sheet)
│   └── dialogs/
│       ├── ExtendTrialDialog.tsx
│       ├── GrantSubscriptionDialog.tsx
│       ├── EditOrgDialog.tsx
│       ├── DeleteOrgDialog.tsx       # typed confirmation (type org name)
│       ├── EditUserDialog.tsx
│       ├── ChangeRoleDialog.tsx
│       ├── VerifyEmailDialog.tsx
│       ├── DeleteUserDialog.tsx      # typed confirmation (type email)
│       ├── ResetPasswordDialog.tsx
│       ├── PromoteSuperAdminDialog.tsx  # triple confirmation, can't self-promote via UI
│       └── ReasonPromptDialog.tsx    # generic wrapper for actions needing a reason
├── FailedNotificationsSheet.tsx      # slide-in drawer for delivery failures (same pattern as AuditLogSheet)

supabase/migrations/
├── {ts}_admin_audit_log_table.sql            # audit log table + RLS
├── {ts}_admin_read_rpcs.sql                  # new/extended read RPCs
└── {ts}_admin_write_rpcs.sql                 # write RPCs (all log to audit table)

supabase/functions/
└── admin-reset-user-password/index.ts        # password reset (needs auth admin API)
```

### EDITED files

- `src/App.tsx` — move `/admin` out of `<ProtectedRoute><AppLayout>` into its own block; import new page path
- `src/components/AppSidebar.tsx` — **remove** the conditional admin section (since the admin page won't have a sidebar anyway; we still want a way for admins to reach `/admin` from the customer app — keep a small link in the user menu dropdown instead)
- `src/components/SuperAdminRoute.tsx` — add a wrapper around `AdminShell` since the admin route is no longer inside `AppLayout`
- `src/pages/SuperAdmin.tsx` — **delete**, replaced by `src/pages/admin/SuperAdmin.tsx`
- `src/integrations/supabase/types.ts` — optionally regenerate, otherwise cast `(supabase as any).rpc(...)` in new code

---

## Data flow

### New table: `admin_audit_log`

```sql
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,           -- e.g. 'extend_trial', 'delete_org', 'change_user_role'
  target_type text NOT NULL,      -- 'organization' | 'user' | 'platform'
  target_id uuid,
  target_description text,        -- human-readable snapshot, e.g. shop name
  details jsonb,                  -- { reason, before, after, ...extras }
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log (created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all direct access" ON public.admin_audit_log
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
```

**Access pattern:** no direct table access. All reads go through `admin_get_audit_log()`; all writes happen inside `admin_*` write RPCs via a helper `_admin_log_action()`.

### New read RPCs (SECURITY DEFINER, super_admin guard)

| RPC | Returns | Purpose |
|---|---|---|
| `admin_get_platform_stats()` | json | **Extended** from existing. Add `trials_expiring_72h`, `failed_notifications_24h`, `signups_24h` for the alerts strip |
| `admin_get_organizations(_limit, _offset, _search, _status_filter)` | setof rows | **Extended** from existing. Add `_status_filter` (`'all'|'active'|'trial'|'expired'`) |
| `admin_get_organization_detail(_org_id)` | json | **NEW** — returns ONE shop's full profile + subscription + all users (full list) + inventory summary (counts + 10 recent) + repairs summary (counts + 10 recent) + invoices summary (counts + 10 recent) in a single query |
| `admin_get_audit_log(_limit, _offset, _action_filter)` | json | **NEW** — paginated audit trail, optional filter by action type |
| `admin_get_failed_notifications(_limit)` | json | **NEW** — last N `notification_logs` rows where status='failed' |

### New write RPCs (SECURITY DEFINER, super_admin guard, audit-logged)

Each write RPC takes a `_reason text NOT NULL` parameter. Each writes exactly one `admin_audit_log` row inside the same transaction, so the action + audit are atomic.

**Shop-level (5):**
| RPC | Params | Behavior |
|---|---|---|
| `admin_update_organization` | `_org_id, _name, _email, _phone, _siret, _reason` | UPDATE organizations SET ... + log |
| `admin_extend_trial` | `_org_id, _days int, _reason` | trial_end_date += `_days::interval`. Days must be 1-365. |
| `admin_grant_subscription` | `_org_id, _plan text, _months int, _reason` | subscription_status='active', plan_name=`_plan`, trial_end_date = now() + `_months` months. Plan must be in `('monthly','quarterly','annual')`. |
| `admin_set_subscription_active` | `_org_id, _active boolean, _reason` | ON → restore to 'trial' or 'active' depending on current plan. OFF → subscription_status='trial_expired'. |
| `admin_delete_organization` | `_org_id, _confirm_name, _reason` | Verifies `_confirm_name = organizations.name`. Cascade delete via FKs. |

**User-level (5):**
| RPC | Params | Behavior |
|---|---|---|
| `admin_update_user` | `_user_id, _full_name, _reason` | UPDATE profiles SET full_name + log. (Email change is deferred — requires auth admin API.) |
| `admin_change_user_role` | `_user_id, _org_id, _new_role, _reason` | UPDATE user_roles + log. `_new_role IN ('admin','technician')`. Cannot self-demote from super_admin. |
| `admin_verify_user_email` | `_user_id, _reason` | UPDATE auth.users SET email_confirmed_at = now() + log. |
| `admin_delete_user` | `_user_id, _confirm_email, _reason` | Verifies `_confirm_email = auth.users.email`. DELETE FROM auth.users (cascades via existing trigger). Cannot self-delete. |
| (password reset) | — | Not an RPC — see edge function below |

**Platform-level (1):**
| RPC | Params | Behavior |
|---|---|---|
| `admin_promote_super_admin` | `_user_id, _org_id, _reason` | Inserts user_roles row with role='super_admin'. Caller cannot promote themselves via this RPC (must be done manually via service_role). Triple-confirmation on the UI side. |

### New edge function: `admin-reset-user-password`

Why: the `auth.admin.generateLink()` API is only callable server-side with service_role. Cannot be done from SQL.

```ts
// supabase/functions/admin-reset-user-password/index.ts
// Flow:
// 1. Require Bearer token → check is_super_admin() via RPC
// 2. Read { user_id, reason } from body (validated)
// 3. Load user email from auth.users
// 4. Call supabase.auth.admin.generateLink({ type: 'recovery', email })
// 5. Send the link via Resend (reuse send-email templates)
// 6. Call admin_log_action RPC to write audit row
// 7. Return { success: true }
```

Uses the existing `_shared/cors.ts`, `_shared/limits.ts`, and the `send-email` template infrastructure. Same fail-closed rate limit pattern.

### Helper: `_admin_log_action()`

```sql
CREATE OR REPLACE FUNCTION public._admin_log_action(
  _action text,
  _target_type text,
  _target_id uuid,
  _target_description text,
  _details jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, target_description, details)
  VALUES (auth.uid(), _action, _target_type, _target_id, _target_description, _details);
$$;
```

Called inside every write RPC.

---

## UI details (critical for match with site)

**AdminShell top bar:**
- Left: 🛡 icon + "BonoitecPilot Admin" (font-display)
- Right: [Audit] button (opens `AuditLogSheet`), [Emails échoués] button (opens `FailedNotificationsSheet`, badge counter when > 0), [Déconnect.] button
- On mobile the buttons collapse into an overflow menu (not a priority; desktop-first)

**FailedNotificationsSheet** (slide-in from right, same `Sheet` component as audit log):
- Title: "Emails non délivrés"
- List of the last 50 failed notifications, most recent first
- Each row: recipient (masked in logs but visible here), organization, error message (truncated), timestamp
- No actions — read-only observability
- Refetch every 60 s while the sheet is open

**StatsBar:** reuses the exact Card pattern from `src/pages/Index.tsx:60-93`:
- `grid grid-cols-2 md:grid-cols-6 gap-4`
- Each: 10x10 icon square + value (large font-display) + label (text-xs muted)
- Gradient accent on 1-2 most important cards

**Alerts strip:** below StatsBar, only shown if there are alerts. Card with yellow/orange accent. Each alert is a bullet with icon + text + optional "Voir" button.

**ShopGrid:**
- Search input (debounced 300ms) + status filter `<Select>` (Tous / Actifs / En essai / Expirés)
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Empty state: "Aucun atelier trouvé" with icon

**ShopCard** (crucial for non-technical feel):
- Compact, ~280px wide
- Header: 🏢 icon + shop name (font-medium) + subscription badge
- Contact line: email (truncate) · phone
- 2×2 mini-stat grid: 👤 users / 🔧 repairs / 📦 pieces / 💶 total paid
- Actions row: `[⚡ ON/OFF toggle]` (Switch component) + `[Détails]` button
- Hover: subtle lift (`hover-lift` class — already exists)

**ShopDetailDialog:**
- `max-w-3xl` — big modal
- `max-h-[90vh] overflow-y-auto`
- Header: shop name + closing ✕
- Contact sub-header
- `ShopActionsBar` — 6 action buttons with icons:
  - [✏ Modifier infos] → `EditOrgDialog`
  - [⏱ Prolonger essai] → `ExtendTrialDialog`
  - [🎁 Offrir abonnement] → `GrantSubscriptionDialog`
  - [⚡ Abonnement ON/OFF] (inline switch with confirmation)
  - [🔗 Stripe] (deep link, new tab, only if `stripe_customer_id` present)
  - [🗑 Supprimer] → `DeleteOrgDialog` (destructive variant, red)
- Then 4 stacked sections, each a `<Card>` with `CardHeader` + content.

**ReasonPromptDialog:**
- Standard form dialog
- Textarea "Raison de cette action" — required, min 3 chars
- Cancel / Confirm buttons
- All destructive dialogs embed this

**Typed-confirmation (DeleteOrgDialog / DeleteUserDialog):**
- Text: "Tapez **`<shop-name>`** pour confirmer la suppression."
- Input field; submit button disabled until `input.trim() === target.name`
- Red "Supprimer définitivement" submit button

---

## Error handling & safety

| Case | Handling |
|---|---|
| Non-super-admin hits `/admin` | `SuperAdminRoute` redirects to `/dashboard` (UX). Also all RPCs return `42501` (defense in depth). |
| RPC returns error | Toast (sonner) with French message + correlation ID. |
| Typed confirmation wrong | Submit button stays disabled — no RPC call made. |
| Destructive action partially fails (org deleted, audit log insert fails) | Prevented — both in one transaction. |
| Self-delete attempt | RPC rejects if `_user_id = auth.uid()`. |
| Self-demote from super_admin | Blocked by client (button hidden) + RPC rejection. |
| Reason field empty | Client validation (required) + RPC validation (`length(trim(_reason)) >= 3`). |
| Audit log write blocked by RLS | Impossible — the write RPC uses SECURITY DEFINER which bypasses RLS. |
| Password reset edge function called with non-admin JWT | Returns 403, no email sent. |

---

## Existing utilities to reuse (no duplication)

| From | Purpose |
|---|---|
| `src/lib/superAdmin.ts` `useIsSuperAdmin()` | Role gate in `SuperAdminRoute` + top-bar conditional |
| `src/components/SuperAdminRoute.tsx` | Already written, extended to wrap `AdminShell` |
| `src/components/ui/*` (shadcn) | Card, Badge, Button, Input, Dialog, Sheet, Select, Switch, Skeleton, Table, AlertDialog, Textarea — all already installed |
| `supabase/functions/_shared/cors.ts` | Used by new edge function |
| `supabase/functions/_shared/limits.ts` | Same |
| `supabase/functions/send-email/index.ts` | Template for password-reset delivery |
| `public.is_super_admin()` RPC | Called by `_require_super_admin()` helper |
| `public._require_super_admin()` helper | Reused for all new RPCs |
| `public.check_rate_limit()` RPC | Called inside the new edge function |
| `src/pages/Index.tsx:60-93` KPI card pattern | Copied for `StatsBar` |
| `recharts` (BarChart, PieChart, ResponsiveContainer) | Reused if StatsBar includes any chart |
| `date-fns` + `fr` locale | Relative timestamps throughout |
| `@tanstack/react-query` `useQuery` + `useMutation` | Same patterns as `Statistics.tsx` and `SettingsPage.tsx` |
| `sonner` toast | Same error display pattern as elsewhere |

**No new npm dependencies.**

---

## Verification

### Build + typecheck
```
cd C:\Users\3440\bonoitec-pilot-pro
npm run build
```
Must succeed with no TS errors.

### Migration apply
```
npx supabase db push --password <redacted> --include-all
```

### Edge function deploy
```
npx supabase functions deploy admin-reset-user-password
```

### Manual smoke test (in dev)
1. Sign in as `medrafa.bbgh@gmail.com` → refresh → `/admin` loads with new `AdminShell`, no sidebar.
2. StatsBar populates with platform KPIs and any alerts.
3. Shop grid shows at least one card (your own org).
4. Click the card → `ShopDetailDialog` opens with all 4 sections populated.
5. Click `[Modifier infos]` → dialog → change a field → reason → submit → toast "Modifié" → dialog refreshes with new value.
6. Click `[Prolonger essai]` → pick 7 days → reason → submit → see `trial_end_date` update.
7. Click `[Offrir abonnement]` → pick monthly / 3 months → reason → submit → see status change.
8. Toggle `⚡ ON/OFF` → confirm → reason → see status change.
9. Inside users section: click edit on a user → change full_name → reason → submit → see row update.
10. Change a user's role → submit → see badge change.
11. Verify email manually → see check icon turn green.
12. Reset password → see "Email envoyé" toast; check inbox (in test with a real email address).
13. Delete a test user → typed email confirmation → deleted.
14. Open Audit drawer → see 11 audit rows in reverse chronological order, each with actor, action, target, reason.
15. Delete a test org → typed name confirmation → org gone + all its data cascaded + audit row logged.

### Pentest additions
Append to `.pentest_hardcheck.py`:
- Non-admin JWT → each of the 10 new write RPCs → expect 42501.
- Non-admin JWT → edge function `admin-reset-user-password` → expect 401/403.
- Delete org with wrong `_confirm_name` → expect error, org still exists.
- Delete user with wrong `_confirm_email` → expect error, user still exists.
- Attempt self-delete → expect error.

---

## Risks & open questions

| Risk | Mitigation |
|---|---|
| **Accidental mass-delete** if admin clicks wrong shop | Typed name confirmation + reason field + audit log for reversibility investigation |
| **types.ts lag** — `Database` type doesn't know new RPCs | Cast `(supabase as any).rpc(...)` for new calls; regenerate types.ts offline and commit periodically |
| **Large shops with 1000s of repairs** blowing up `admin_get_organization_detail` | RPC returns only summaries (counts) + last 10 items per section. No full lists inline. |
| **Password reset email deliverability** | Reuse existing Resend verified domain + template infrastructure |
| **Audit log growing unbounded** | Not addressed in v1. Can add monthly partition / TTL later if it becomes a problem. |
| **No "undo"** | All destructive actions are hard deletes. Audit log captures before-state in `details.before` so it could theoretically be reconstructed — but this is a v2 feature. |

---

## Estimated effort

| Phase | Effort |
|---|---|
| Migration: audit table + 5 read RPCs + 10 write RPCs + helper | 2 h |
| Edge function: admin-reset-user-password | 30 min |
| `AdminShell` layout + routing change | 20 min |
| `StatsBar` + alerts | 30 min |
| `ShopGrid` + `ShopCard` + search/filter | 1 h |
| `ShopDetailDialog` + 4 sections | 1.5 h |
| 10 action dialogs (edit/extend/grant/delete/role/verify/reset/etc.) | 2 h |
| `AuditLogSheet` | 30 min |
| Manual smoke test | 30 min |
| Pentest additions | 20 min |
| Build / commit / deploy | 20 min |
| **Total** | **~9 hours** |

---

## Deletion / cleanup

- **Delete** `src/pages/SuperAdmin.tsx` (old version, replaced by `src/pages/admin/SuperAdmin.tsx`)
- **Delete** the "Admin" sidebar group in `AppSidebar.tsx` (admin shouldn't be reachable from customer sidebar; instead we add a small entry in the user-menu dropdown for convenience)
