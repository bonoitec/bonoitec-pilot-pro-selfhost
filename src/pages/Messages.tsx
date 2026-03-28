import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, User } from "lucide-react";
import { RepairChat } from "@/components/messaging/RepairChat";

interface ConversationSummary {
  repair_id: string;
  repair_reference: string;
  client_name: string;
  organization_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface MessageRow {
  id: string;
  repair_id: string;
  content: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const [search, setSearch] = useState("");
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const qc = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
  } = useQuery<ConversationSummary[], Error>({
    queryKey: ["all-messages"],
    queryFn: async () => {
      const { data: messageRows, error: messagesError } = await supabase
        .from("repair_messages")
        .select("id, repair_id, content, sender_type, is_read, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (messagesError) throw messagesError;

      const uniqueById = new Map<string, MessageRow>();
      for (const row of (messageRows ?? []) as MessageRow[]) {
        if (!uniqueById.has(row.id)) {
          uniqueById.set(row.id, row);
        }
      }

      const repairMap = new Map<string, MessageRow[]>();
      for (const message of uniqueById.values()) {
        if (!repairMap.has(message.repair_id)) {
          repairMap.set(message.repair_id, []);
        }
        repairMap.get(message.repair_id)!.push(message);
      }

      const repairIds = Array.from(repairMap.keys());
      if (repairIds.length === 0) return [];

      const { data: repairs, error: repairsError } = await supabase
        .from("repairs")
        .select("id, reference, organization_id, clients(name)")
        .in("id", repairIds);

      if (repairsError) throw repairsError;

      const summaries: ConversationSummary[] = [];

      for (const repair of repairs || []) {
        const group = repairMap.get(repair.id);
        if (!group || group.length === 0) continue;

        const sorted = [...group].sort((a, b) => {
          const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.id.localeCompare(a.id);
        });

        const latest = sorted[0];
        const lastMessage = latest?.content?.trim() || "";
        if (!lastMessage) continue;

        const unreadCount = sorted.filter(
          (message) => !message.is_read && message.sender_type === "customer"
        ).length;

        summaries.push({
          repair_id: repair.id,
          repair_reference: repair.reference,
          client_name: repair.clients?.name ?? "Client",
          organization_id: repair.organization_id,
          last_message: lastMessage,
          last_message_at: latest.created_at,
          unread_count: unreadCount,
        });
      }

      return summaries.sort((a, b) => {
        const dateDiff = new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.repair_id.localeCompare(a.repair_id);
      });
    },
    staleTime: 15_000,
  });

  // Realtime subscription for new/updated messages
  useEffect(() => {
    const channel = supabase
      .channel("all-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "repair_messages",
        },
        () => {
          qc.invalidateQueries({ queryKey: ["all-messages"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "repair_messages",
        },
        () => {
          qc.invalidateQueries({ queryKey: ["all-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.client_name.toLowerCase().includes(term) ||
        conversation.repair_reference.toLowerCase().includes(term) ||
        conversation.last_message.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedRepairId(null);
      setSelectedOrgId("");
      return;
    }

    if (!selectedRepairId || !filtered.some((conversation) => conversation.repair_id === selectedRepairId)) {
      setSelectedRepairId(filtered[0].repair_id);
      setSelectedOrgId(filtered[0].organization_id);
    }
  }, [filtered, selectedRepairId]);

  const selectedConversation =
    conversations.find((conversation) => conversation.repair_id === selectedRepairId) ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">Conversations avec vos clients</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <div className="lg:col-span-1 flex min-h-[280px] flex-col lg:min-h-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1 rounded-md border border-border">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-sm text-destructive px-4">
                Impossible de charger les conversations.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Aucune conversation
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filtered.map((conversation) => (
                  <Card
                    key={conversation.repair_id}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedRepairId === conversation.repair_id ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      setSelectedRepairId(conversation.repair_id);
                      setSelectedOrgId(conversation.organization_id);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{conversation.client_name}</p>
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">{conversation.repair_reference}</p>
                          </div>
                        </div>

                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conversation.last_message_at
                            ? new Date(conversation.last_message_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                              })
                            : ""}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 pl-10">
                        {conversation.last_message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-2 min-h-[420px] lg:min-h-0">
          {selectedRepairId && selectedConversation ? (
            <Card className="h-full min-h-0 flex flex-col overflow-hidden">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedConversation.client_name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedConversation.repair_reference}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <RepairChat repairId={selectedRepairId} organizationId={selectedOrgId} />
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
