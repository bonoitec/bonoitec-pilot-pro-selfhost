import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Wrench, Bot, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeMessages, upsertMessage } from "@/components/messaging/message-utils";
import { ReadReceipt } from "@/components/messaging/ReadReceipt";

interface CustomerChatProps {
  trackingCode: string;
  repairId?: string;
}

interface Message {
  id: string;
  repair_id?: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  channel?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
}

interface SendCustomerMessageResponse {
  success?: boolean;
  error?: string;
  repair_id?: string;
  message?: Message;
}

export function CustomerChat({ trackingCode, repairId }: CustomerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [resolvedRepairId, setResolvedRepairId] = useState<string | null>(repairId ?? null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(0);

  const normalizedTrackingCode = trackingCode.toUpperCase();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const fetchMessages = async () => {
    const { data, error: fetchError } = await supabase.rpc("get_repair_messages_by_tracking", {
      _tracking_code: normalizedTrackingCode,
    });

    if (fetchError) {
      setError("Impossible de charger les messages pour le moment.");
      return;
    }

    const normalized = normalizeMessages((Array.isArray(data) ? data : []) as unknown as Message[]);
    setMessages(normalized);

    const messageWithRepair = normalized.find((message) => !!message.repair_id);
    if (messageWithRepair?.repair_id) {
      setResolvedRepairId(messageWithRepair.repair_id);
    }

    setError("");
  };

  useEffect(() => {
    setResolvedRepairId(repairId ?? null);
  }, [repairId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [normalizedTrackingCode]);

  useEffect(() => {
    if (!resolvedRepairId) return;

    const channel = supabase
      .channel(`customer-chat-${resolvedRepairId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "repair_messages",
          filter: `repair_id=eq.${resolvedRepairId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => upsertMessage(current, incoming));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "repair_messages",
          filter: `repair_id=eq.${resolvedRepairId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => upsertMessage(current, incoming));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedRepairId]);

  useEffect(() => {
    const behavior: ScrollBehavior = previousCountRef.current === 0 ? "auto" : "smooth";
    previousCountRef.current = messages.length;
    scrollToBottom(behavior);
  }, [messages]);

  const handleSend = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    setError("");

    const { data, error: sendError } = await supabase.rpc("send_customer_message", {
      _tracking_code: normalizedTrackingCode,
      _content: trimmedMessage,
      _sender_name: customerName.trim() || "Client",
    });

    if (sendError) {
      setError("Envoi impossible, veuillez réessayer.");
      setSending(false);
      return;
    }

    const response = (data ?? {}) as SendCustomerMessageResponse;

    if (!response.success) {
      setError(response.error || "Envoi impossible, veuillez réessayer.");
      setSending(false);
      return;
    }

    setNewMessage("");

    if (response.repair_id) {
      setResolvedRepairId(response.repair_id);
    }

    if (response.message) {
      setMessages((current) => upsertMessage(current, response.message as Message));
    } else {
      await fetchMessages();
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const senderIcons: Record<string, typeof User> = {
    technician: Wrench,
    customer: User,
    system: Bot,
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Messages
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3">
        <div ref={scrollContainerRef} className="h-[320px] sm:h-[360px] overflow-y-auto mb-3 border rounded-lg p-2 bg-muted/20">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun message pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const Icon = senderIcons[msg.sender_type] || Bot;
                const isCustomer = msg.sender_type === "customer";

                return (
                  <div key={msg.id} className={`flex gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isCustomer ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className={`max-w-[80%] ${isCustomer ? "text-right" : ""}`}>
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm inline-block text-left ${
                          isCustomer
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>

                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isCustomer ? "justify-end" : ""}`}>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.sender_name || (isCustomer ? "Vous" : "Technicien")} ·{" "}
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

        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

        {!nameConfirmed && (
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              placeholder="Votre nom..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
              maxLength={100}
              className="flex-1 text-sm rounded-lg border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && customerName.trim()) {
                  setNameConfirmed(true);
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (customerName.trim()) setNameConfirmed(true);
              }}
              disabled={!customerName.trim()}
            >
              OK
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message... (max 2000 car.)"
            maxLength={2000}
            className="min-h-[40px] max-h-[80px] resize-none text-sm"
            rows={1}
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
