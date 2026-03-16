import { Check, CheckCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReadReceiptProps {
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export function ReadReceipt({ isRead, readAt, createdAt }: ReadReceiptProps) {
  const label = isRead
    ? `Lu${readAt ? ` · ${new Date(readAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
    : "Envoyé";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center">
          {isRead ? (
            <CheckCheck className="h-3 w-3 text-primary" />
          ) : (
            <Check className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
