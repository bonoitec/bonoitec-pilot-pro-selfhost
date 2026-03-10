import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, X, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendTransactionalEmail } from "@/lib/email";

const defaultMessages: Record<string, { subject: string; body: string }> = {
  diagnostic: {
    subject: "Diagnostic en cours",
    body: "Bonjour,\n\nNous avons commencé le diagnostic de votre appareil {{device}}.\nRéférence : {{reference}}\n\nNous vous tiendrons informé des résultats.\n\nCordialement,\nL'équipe de réparation",
  },
  en_cours: {
    subject: "Réparation démarrée",
    body: "Bonjour,\n\nLa réparation de votre appareil {{device}} est maintenant en cours.\nRéférence : {{reference}}\n\nNous vous notifierons dès qu'elle sera terminée.\n\nCordialement,\nL'équipe de réparation",
  },
  en_attente_piece: {
    subject: "Pièce en commande",
    body: "Bonjour,\n\nUne pièce a été commandée pour la réparation de votre {{device}}.\nRéférence : {{reference}}\n\nNous reprendrons la réparation dès réception.\n\nCordialement,\nL'équipe de réparation",
  },
  termine: {
    subject: "Réparation terminée",
    body: "Bonjour,\n\nLa réparation de votre {{device}} est terminée !\nRéférence : {{reference}}\n\nVous pouvez venir le récupérer à notre atelier.\n\nCordialement,\nL'équipe de réparation",
  },
  pret_a_recuperer: {
    subject: "Appareil prêt à récupérer",
    body: "Bonjour,\n\nVotre {{device}} est prêt à être récupéré.\nRéférence : {{reference}}\n\nN'hésitez pas à nous contacter pour convenir d'un créneau.\n\nMerci de votre confiance !",
  },
};

interface Props {
  repair: any;
  newStatus: string;
  onDismiss: () => void;
}

export function StatusNotificationSuggester({ repair, newStatus, onDismiss }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const template = defaultMessages[newStatus];
  const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "votre appareil";
  const reference = repair.reference || repair.tracking_code || "";

  const fillTemplate = (text: string) =>
    text.replace(/\{\{device\}\}/g, device).replace(/\{\{reference\}\}/g, reference);

  const [message, setMessage] = useState(template ? fillTemplate(template.body) : "");

  if (!template) return null;

  const sendNotification = useMutation({
    mutationFn: async () => {
      // Save as a system message in the conversation
      const { error } = await supabase.from("repair_messages").insert({
        repair_id: repair.id,
        organization_id: repair.organization_id,
        sender_type: "system",
        sender_name: "Notification",
        channel: repair.clients?.email ? "email" : "internal",
        content: message.trim(),
      });
      if (error) throw error;

      // Send real email if client has email
      if (repair.clients?.email) {
        const statusTemplateMap: Record<string, string> = {
          termine: "repair_completed",
          pret_a_recuperer: "repair_completed",
        };
        const emailTemplate = statusTemplateMap[newStatus] || "status_update";

        await sendTransactionalEmail({
          template: emailTemplate as any,
          to: repair.clients.email,
          data: {
            clientName: repair.clients?.name || "",
            reference: reference,
            device: device,
            status: newStatus,
            statusLabel: fillTemplate(template.subject),
            message: message.trim(),
          },
          organizationId: repair.organization_id,
          repairId: repair.id,
        });
      }
    },
    onSuccess: () => {
      const desc = repair.clients?.email
        ? "Email envoyé et message ajouté à la conversation."
        : "Le message a été ajouté à la conversation.";
      toast({ title: "Notification envoyée", description: desc });
      qc.invalidateQueries({ queryKey: ["repair-messages", repair.id] });
      qc.invalidateQueries({ queryKey: ["all-messages"] });
      onDismiss();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-primary/30 bg-primary/5 animate-fade-in">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Notification suggérée</span>
            <Badge variant="outline" className="text-[10px]">
              {repair.clients?.email ? "Email" : repair.clients?.phone ? "SMS" : "Interne"}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="text-sm min-h-[100px] resize-none"
          rows={5}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onDismiss}>Ignorer</Button>
          <Button size="sm" onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending}>
            <Send className="h-3 w-3 mr-1" />
            Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
