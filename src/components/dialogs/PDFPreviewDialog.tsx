import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Aperçu — {reference}
            </DialogTitle>
          </div>
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
            onClick={() => {
              if (!pdfUrl) return;
              const printWindow = window.open(pdfUrl);
              if (printWindow) {
                printWindow.addEventListener("load", () => {
                  printWindow.print();
                });
              }
            }}
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
