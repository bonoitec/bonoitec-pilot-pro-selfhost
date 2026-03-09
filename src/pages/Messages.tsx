import { useState, forwardRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, User } from "lucide-react";
import { RepairChat } from "@/components/messaging/RepairChat";
import { useEffect } from "react";

interface ConversationSummary {
  repair_id: string;
  repair_reference: string;
  client_name: string;
  organization_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const Messages = forwardRef<HTMLDivElement>(function Messages(_props, ref) {
  const [search, setSearch] = useState("");
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const qc = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["all-messages"],
    queryFn: async () => {
      // Get all repairs that have messages
      const { data: messages, error } = await supabase
        .from("repair_messages")
        .select("repair_id, content, sender_type, is_read, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by repair_id
      const repairMap = new Map<string, { messages: typeof messages }>();
      for (const msg of messages || []) {
        if (!repairMap.has(msg.repair_id)) {
          repairMap.set(msg.repair_id, { messages: [] });
        }
        repairMap.get(msg.repair_id)!.messages.push(msg);
      }

      // Fetch repair details for those repair IDs
      const repairIds = Array.from(repairMap.keys());
      if (repairIds.length === 0) return [];

      const { data: repairs } = await supabase
        .from("repairs")
        .select("id, reference, organization_id, clients(name)")
        .in("id", repairIds);

      const summaries: ConversationSummary[] = [];
      for (const repair of repairs || []) {
        const group = repairMap.get(repair.id);
        if (!group) continue;
        const sorted = group.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const unread = sorted.filter(m => !m.is_read && m.sender_type === "customer").length;
        summaries.push({
          repair_id: repair.id,
          repair_reference: repair.reference,
          client_name: repair.clients?.name ?? "Client",
          organization_id: repair.organization_id,
          last_message: sorted[0]?.content || "",
          last_message_at: sorted[0]?.created_at || "",
          unread_count: unread,
        });
      }

      return summaries.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
  });

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel("all-messages-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "repair_messages",
      }, () => {
        qc.invalidateQueries({ queryKey: ["all-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const filtered = conversations.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.repair_reference.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">Conversations avec vos clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* Conversation list */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Aucune conversation
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((conv) => (
                  <Card
                    key={conv.repair_id}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedRepairId === conv.repair_id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedRepairId(conv.repair_id);
                      setSelectedOrgId(conv.organization_id);
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
                              <p className="text-sm font-medium truncate">{conv.client_name}</p>
                              {conv.unread_count > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">{conv.repair_reference}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conv.last_message_at
                            ? new Date(conv.last_message_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 pl-10">
                        {conv.last_message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-2">
          {selectedRepairId ? (
            <Card className="h-full flex flex-col">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {conversations.find(c => c.repair_id === selectedRepairId)?.client_name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {conversations.find(c => c.repair_id === selectedRepairId)?.repair_reference}
                  </Badge>
                </div>
              </div>
              <div className="flex-1">
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
});

export default Messages;
