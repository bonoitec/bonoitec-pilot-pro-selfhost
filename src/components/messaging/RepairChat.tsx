import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Wrench, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RepairChatProps {
  repairId: string;
  organizationId: string;
  compact?: boolean;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  channel: string;
  is_read: boolean;
  created_at: string;
}

const senderConfig: Record<string, { icon: typeof User; label: string; color: string }> = {
  technician: { icon: Wrench, label: "Technicien", color: "bg-primary text-primary-foreground" },
  customer: { icon: User, label: "Client", color: "bg-muted text-foreground" },
  system: { icon: Bot, label: "Système", color: "bg-accent text-accent-foreground" },
};

export function RepairChat({ repairId, organizationId, compact = false }: RepairChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["repair-messages", repairId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repair_messages")
        .select("*")
        .eq("repair_id", repairId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  // Mark unread messages as read
  useEffect(() => {
    if (messages.some(m => !m.is_read && m.sender_type === "customer")) {
      supabase
        .from("repair_messages")
        .update({ is_read: true })
        .eq("repair_id", repairId)
        .eq("sender_type", "customer")
        .eq("is_read", false)
        .then();
    }
  }, [messages, repairId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${repairId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "repair_messages",
        filter: `repair_id=eq.${repairId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["repair-messages", repairId] });
        qc.invalidateQueries({ queryKey: ["all-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [repairId, qc]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("repair_messages").insert({
        repair_id: repairId,
        organization_id: organizationId,
        sender_type: "technician",
        sender_name: "Technicien",
        channel: "internal",
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["repair-messages", repairId] });
      qc.invalidateQueries({ queryKey: ["all-messages"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col ${compact ? "h-[300px]" : "h-[400px]"}`}>
      <ScrollArea className="flex-1 px-3 py-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-8">Chargement...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Aucun message. Envoyez le premier message au client.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const cfg = senderConfig[msg.sender_type] || senderConfig.system;
              const Icon = cfg.icon;
              const isCustomer = msg.sender_type === "customer";
              return (
                <div key={msg.id} className={`flex gap-2 ${isCustomer ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className={`max-w-[75%] ${isCustomer ? "" : "text-right"}`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm ${
                      isCustomer
                        ? "bg-muted text-foreground rounded-bl-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
                    }`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {msg.sender_name || cfg.label}
                      </span>
                      {msg.channel !== "internal" && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">{msg.channel}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-2 flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message..."
          className="min-h-[40px] max-h-[80px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sendMessage.isPending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
