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
import { statusLabels } from "@/lib/repairStatuses";

const defaultMessages: Record<string, { subject: string; body: string }> = {
  diagnostic: {
    subject: "Diagnostic en cours",
    body: "Bonjour,\n\nVotre {{device}} est en cours de diagnostic.\nRéférence : {{reference}}\n\nNous vous informerons des résultats.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  devis_en_attente: {
    subject: "Devis envoyé",
    body: "Bonjour,\n\nUn devis vous a été envoyé pour la réparation de votre {{device}}.\nRéférence : {{reference}}\n\nMerci de le valider pour que nous puissions poursuivre.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  devis_valide: {
    subject: "Devis validé",
    body: "Bonjour,\n\nVotre devis pour la réparation de votre {{device}} a été validé.\nRéférence : {{reference}}\n\nNous allons préparer l'intervention.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  en_cours: {
    subject: "Pièces à commander",
    body: "Bonjour,\n\nUne ou plusieurs pièces doivent être commandées pour la réparation de votre {{device}}.\nRéférence : {{reference}}\n\nNous vous informerons dès leur réception.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  en_attente_piece: {
    subject: "En attente de pièce",
    body: "Bonjour,\n\nLa commande de pièces pour votre {{device}} est en cours de livraison.\nRéférence : {{reference}}\n\nNous reprendrons dès réception.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  pret_reparation: {
    subject: "Prêt pour réparation",
    body: "Bonjour,\n\nToutes les pièces nécessaires sont disponibles. La réparation de votre {{device}} va bientôt débuter.\nRéférence : {{reference}}\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  reparation_en_cours: {
    subject: "Réparation en cours",
    body: "Bonjour,\n\nLa réparation de votre {{device}} a débuté.\nRéférence : {{reference}}\n\nNous vous tiendrons informé(e) de l'avancement.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  termine: {
    subject: "Réparation terminée",
    body: "Bonjour,\n\nLa réparation de votre {{device}} est terminée !\nRéférence : {{reference}}\n\nVotre appareil est prêt à être récupéré à notre atelier.\n\nCordialement,\nL'équipe BonoitecPilot",
  },
  pret_a_recuperer: {
    subject: "Intervention clôturée — Restitution",
    body: "Bonjour,\n\nVotre {{device}} vous a été restitué. L'intervention est désormais clôturée.\nRéférence : {{reference}}\n\nMerci de votre confiance !\n\nCordialement,\nL'équipe BonoitecPilot",
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
      const { error } = await supabase.from("repair_messages").insert({
        repair_id: repair.id,
        organization_id: repair.organization_id,
        sender_type: "system",
        sender_name: "Notification",
        channel: repair.clients?.email ? "email" : "internal",
        content: message.trim(),
      });
      if (error) throw error;

      if (repair.clients?.email) {
        const emailTemplate = newStatus === "termine" || newStatus === "pret_a_recuperer"
          ? "repair_completed"
          : "status_update";

        await sendTransactionalEmail({
          template: emailTemplate as any,
          to: repair.clients.email,
          data: {
            clientName: repair.clients?.name || "",
            reference,
            device,
            status: newStatus,
            statusLabel: statusLabels[newStatus] || newStatus,
            message: message.trim(),
            trackingUrl: repair.tracking_code ? `https://bonoitec-pilot-pro.lovable.app/repair/${repair.tracking_code}` : "",
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
            <Badge variant="outline" className={`text-[10px] ${repair.clients?.email ? 'border-primary/40 text-primary' : ''}`}>
              {repair.clients?.email ? <><Mail className="h-3 w-3 mr-1 inline" />Email</> : repair.clients?.phone ? "SMS" : "Interne"}
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
            <Send className="h-3 w-3 mr-1" />Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
