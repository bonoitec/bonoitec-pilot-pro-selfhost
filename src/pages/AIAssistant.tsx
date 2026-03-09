import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Zap, Wrench, DollarSign, FileText } from "lucide-react";

const suggestions = [
  { icon: Wrench, label: "Diagnostic IA", example: "iPhone qui ne charge plus, quelles causes possibles ?" },
  { icon: DollarSign, label: "Estimation prix", example: "Quel est le prix moyen pour remplacer un écran iPhone 14 ?" },
  { icon: FileText, label: "Générer un devis", example: "Génère un devis pour un remplacement de batterie Samsung S23" },
  { icon: Zap, label: "Analyse", example: "Quel technicien est le plus performant ce mois-ci ?" },
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock response for now — will connect to Lovable AI Gateway
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Voici mon analyse pour "${userMsg.content}" :\n\n**Causes possibles :**\n- Connecteur de charge endommagé\n- Problème de carte mère\n- Batterie défectueuse\n\n**Pièces à vérifier :**\n- Connecteur Lightning/USB-C\n- Batterie\n- Nappe de charge\n\n**Temps estimé :** 30-60 minutes\n**Prix estimé :** 45-89 € selon la pièce`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Assistant IA
        </h1>
        <p className="text-muted-foreground text-sm">
          Posez vos questions sur les diagnostics, prix, pièces et performances
        </p>
      </div>

      {messages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <Card
              key={s.label}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => setInput(s.example)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.example}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-xl px-4 py-3 text-sm text-muted-foreground">
                <span className="animate-pulse">Analyse en cours...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Posez votre question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
