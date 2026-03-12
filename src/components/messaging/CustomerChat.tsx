import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Wrench, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface CustomerChatProps {
  trackingCode: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  created_at: string;
}

export function CustomerChat({ trackingCode }: CustomerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase.rpc("get_repair_messages_by_tracking", {
      _tracking_code: trackingCode.toUpperCase(),
    });
    if (data && Array.isArray(data)) {
      setMessages(data as unknown as Message[]);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [trackingCode]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const { data } = await supabase.rpc("send_customer_message", {
      _tracking_code: trackingCode.toUpperCase(),
      _content: newMessage.trim(),
      _sender_name: customerName.trim() || "Client",
    });
    if (data && typeof data === "object" && "success" in (data as any)) {
      setNewMessage("");
      fetchMessages();
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
        <ScrollArea className="h-[250px] mb-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun message pour le moment.
            </p>
          ) : (
            <div className="space-y-3 pr-2">
              {messages.map((msg) => {
                const Icon = senderIcons[msg.sender_type] || Bot;
                const isCustomer = msg.sender_type === "customer";
                return (
                  <div key={msg.id} className={`flex gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isCustomer ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className={`max-w-[75%] ${isCustomer ? "text-right" : ""}`}>
                      <div className={`rounded-2xl px-3 py-2 text-sm ${
                        isCustomer
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {msg.sender_name || (isCustomer ? "Vous" : "Technicien")} · {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {!customerName && (
          <div className="mb-2">
            <input
              type="text"
              placeholder="Votre nom..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
