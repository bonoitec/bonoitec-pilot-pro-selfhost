
-- ============================================
-- 1. Repair Messages table (conversation system)
-- ============================================
CREATE TABLE public.repair_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('technician', 'customer', 'system')),
  sender_name TEXT,
  channel TEXT NOT NULL DEFAULT 'internal' CHECK (channel IN ('internal', 'sms', 'whatsapp', 'email')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view repair messages" ON public.repair_messages
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert repair messages" ON public.repair_messages
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Org members can update repair messages" ON public.repair_messages
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

-- ============================================
-- 2. Notification Templates table
-- ============================================
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status_trigger TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('sms', 'whatsapp', 'email')),
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, status_trigger, channel)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view notification templates" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can insert notification templates" ON public.notification_templates
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notification templates" ON public.notification_templates
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notification templates" ON public.notification_templates
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id() AND has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. Notification Logs table
-- ============================================
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view notification logs" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert notification logs" ON public.notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- ============================================
-- 4. Enable realtime on repair_messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_messages;

-- ============================================
-- 5. Public RPC for customer to send messages
-- ============================================
CREATE OR REPLACE FUNCTION public.send_customer_message(
  _tracking_code TEXT,
  _content TEXT,
  _sender_name TEXT DEFAULT 'Client'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _repair RECORD;
BEGIN
  IF _content IS NULL OR length(trim(_content)) < 1 THEN
    RETURN json_build_object('error', 'Message vide');
  END IF;

  SELECT r.id, r.organization_id INTO _repair
  FROM repairs r
  WHERE r.tracking_code = _tracking_code
  LIMIT 1;

  IF _repair.id IS NULL THEN
    RETURN json_build_object('error', 'Réparation introuvable');
  END IF;

  INSERT INTO repair_messages (repair_id, organization_id, sender_type, sender_name, channel, content)
  VALUES (_repair.id, _repair.organization_id, 'customer', trim(_sender_name), 'internal', trim(_content));

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- 6. Public RPC for customer to fetch messages
-- ============================================
CREATE OR REPLACE FUNCTION public.get_repair_messages_by_tracking(_tracking_code TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'sender_type', m.sender_type,
      'sender_name', m.sender_name,
      'content', m.content,
      'created_at', m.created_at
    ) ORDER BY m.created_at ASC
  ), '[]'::json)
  FROM repair_messages m
  JOIN repairs r ON r.id = m.repair_id
  WHERE r.tracking_code = _tracking_code
$$;

-- ============================================
-- 7. Trigger for updated_at on notification_templates
-- ============================================
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
