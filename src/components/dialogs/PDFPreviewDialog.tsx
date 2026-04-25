import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, X, Loader2, Printer } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  loading?: boolean;
  reference: string;
  onDownload: () => void;
}

export function PDFPreviewDialog({ open, onOpenChange, pdfUrl, loading, reference, onDownload }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    if (!pdfUrl) return;

    // 1. Try the visible preview iframe first.
    const visible = iframeRef.current?.contentWindow;
    if (visible) {
      try {
        visible.focus();
        visible.print();
        return;
      } catch { /* fall through */ }
    }

    // 2. Fallback: a HIDDEN iframe attached to document.body. This avoids
    // window.open / new-tab navigation entirely (those routes were getting
    // blocked by host security pages — "Contact site owner") and prints the
    // blob: URL directly through the browser's native PDF dialog.
    const hidden = document.createElement("iframe");
    hidden.setAttribute("aria-hidden", "true");
    hidden.style.position = "fixed";
    hidden.style.right = "0";
    hidden.style.bottom = "0";
    hidden.style.width = "1px";
    hidden.style.height = "1px";
    hidden.style.opacity = "0";
    hidden.style.border = "0";
    hidden.style.pointerEvents = "none";
    hidden.src = pdfUrl;

    let printed = false;
    hidden.onload = () => {
      // Some browsers need a tick for the PDF viewer to mount.
      setTimeout(() => {
        try {
          hidden.contentWindow?.focus();
          hidden.contentWindow?.print();
          printed = true;
        } catch { /* fall through to download */ }
        // Clean up after the user has had time to interact with the print dialog.
        setTimeout(() => hidden.remove(), 60_000);
      }, 200);
    };

    // 3. If even the hidden iframe fails to mount or print within 1.5s,
    // fall back to the download path so the user always gets the PDF.
    setTimeout(() => {
      if (!printed) {
        hidden.remove();
        onDownload();
        toast({
          title: "Impression non disponible",
          description: "Le PDF a été téléchargé. Ouvrez-le pour imprimer (Ctrl/⌘ + P).",
        });
      }
    }, 1500);

    document.body.appendChild(hidden);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Aperçu — {reference}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">Aperçu du document {reference}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">Génération du PDF…</span>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Aperçu ${reference}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Impossible de générer l'aperçu
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border/60 flex-shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />Fermer
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!pdfUrl}
          >
            <Printer className="h-4 w-4 mr-2" />Imprimer
          </Button>
          <Button onClick={onDownload} disabled={!pdfUrl}>
            <Download className="h-4 w-4 mr-2" />Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
