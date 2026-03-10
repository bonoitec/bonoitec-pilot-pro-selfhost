import { supabase } from "@/integrations/supabase/client";

type EmailTemplate =
  | "quote_ready"
  | "repair_completed"
  | "invoice_sent"
  | "status_update"
  | "client_notification";

interface SendEmailParams {
  template: EmailTemplate;
  to: string;
  data: Record<string, string>;
  organizationId: string;
  repairId?: string;
}

export async function sendTransactionalEmail({
  template,
  to,
  data,
  organizationId,
  repairId,
}: SendEmailParams) {
  const { data: result, error } = await supabase.functions.invoke("send-email", {
    body: {
      template,
      to,
      data,
      organization_id: organizationId,
      repair_id: repairId,
    },
  });

  if (error) throw error;
  return result;
}
