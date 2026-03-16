import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, User, Wrench, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeMessages, upsertMessage } from "@/components/messaging/message-utils";

interface RepairChatProps {
  repairId: string;
  organizationId: string;
  compact?: boolean;
}

interface Message {
  id: string;
  repair_id: string;
  organization_id: string;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(0);
  const { toast } = useToast();
  const qc = useQueryClient();

  const queryKey = ["repair-messages", repairId] as const;

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repair_messages")
        .select("*")
        .eq("repair_id", repairId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;
      return normalizeMessages((data ?? []) as Message[]);
    },
    staleTime: 15_000,
  });

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  // Mark unread customer messages as read
  useEffect(() => {
    const unreadIds = messages
      .filter((message) => !message.is_read && message.sender_type === "customer")
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    supabase
      .from("repair_messages")
      .update({ is_read: true })
      .in("id", unreadIds)
      .then(({ error }) => {
        if (!error) {
          qc.setQueryData<Message[]>(queryKey, (current = []) =>
            current.map((message) =>
              unreadIds.includes(message.id) ? { ...message, is_read: true } : message
            )
          );
          qc.invalidateQueries({ queryKey: ["all-messages"] });
        }
      });
  }, [messages, qc, queryKey]);

  // Realtime subscription scoped to one repair conversation
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${repairId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "repair_messages",
          filter: `repair_id=eq.${repairId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          qc.setQueryData<Message[]>(queryKey, (current = []) => upsertMessage(current, incoming));
          qc.invalidateQueries({ queryKey: ["all-messages"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "repair_messages",
          filter: `repair_id=eq.${repairId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          qc.setQueryData<Message[]>(queryKey, (current = []) => upsertMessage(current, incoming));
          qc.invalidateQueries({ queryKey: ["all-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [repairId, qc, queryKey]);

  // Auto-scroll only within the chat container (prevents page jump)
  useEffect(() => {
    const behavior: ScrollBehavior = previousCountRef.current === 0 ? "auto" : "smooth";
    previousCountRef.current = messages.length;
    scrollToBottom(behavior);
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from("repair_messages")
        .insert({
          repair_id: repairId,
          organization_id: organizationId,
          sender_type: "technician",
          sender_name: "Technicien",
          channel: "internal",
          content: content.trim(),
          is_read: true,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Message;
    },
    onMutate: async (content: string) => {
      const trimmed = content.trim();
      await qc.cancelQueries({ queryKey });

      const previousMessages = qc.getQueryData<Message[]>(queryKey) ?? [];
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        repair_id: repairId,
        organization_id: organizationId,
        sender_type: "technician",
        sender_name: "Technicien",
        channel: "internal",
        is_read: true,
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      qc.setQueryData<Message[]>(queryKey, normalizeMessages([...previousMessages, optimisticMessage]));
      setNewMessage("");

      return {
        previousMessages,
        optimisticId: optimisticMessage.id,
        sentContent: trimmed,
      };
    },
    onSuccess: (savedMessage, _content, context) => {
      qc.setQueryData<Message[]>(queryKey, (current = []) => {
        const withoutOptimistic = context?.optimisticId
          ? current.filter((message) => message.id !== context.optimisticId)
          : current;
        return upsertMessage(withoutOptimistic, savedMessage);
      });
      qc.invalidateQueries({ queryKey: ["all-messages"] });
    },
    onError: (error: Error, _content, context) => {
      if (context?.previousMessages) {
        qc.setQueryData<Message[]>(queryKey, context.previousMessages);
      }
      if (context?.sentContent) {
        setNewMessage(context.sentContent);
      }
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex min-h-0 flex-col ${compact ? "h-[320px]" : "h-full"}`}>
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
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
              const isTech = msg.sender_type === "technician";

              return (
                <div key={msg.id} className={`flex gap-2 ${isTech ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className={`max-w-[80%] ${isTech ? "text-right" : ""}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm inline-block text-left ${
                        isTech
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isTech ? "justify-end" : ""}`}>
                      <span className="text-[10px] text-muted-foreground">{msg.sender_name || cfg.label}</span>
                      {msg.channel !== "internal" && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {msg.channel}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t p-2 flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message..."
          maxLength={2000}
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
