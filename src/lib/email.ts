import { supabase } from "@/integrations/supabase/client";

type EmailTemplate =
  | "quote_ready"
  | "repair_completed"
  | "repair_created"
  | "invoice_sent"
  | "status_update"
  | "client_notification"
  | "welcome_signup"
  | "login_alert";

interface EmailAttachment {
  filename: string;
  content: string; // base64
}

interface SendEmailParams {
  template: EmailTemplate;
  to: string;
  data: Record<string, string>;
  organizationId: string;
  repairId?: string;
  attachments?: EmailAttachment[];
}

export async function sendTransactionalEmail({
  template,
  to,
  data,
  organizationId,
  repairId,
  attachments,
}: SendEmailParams) {
  const { data: result, error } = await supabase.functions.invoke("send-email", {
    body: {
      template,
      to,
      data,
      organization_id: organizationId,
      repair_id: repairId,
      attachments,
    },
  });

  if (error) throw error;
  return result;
}
