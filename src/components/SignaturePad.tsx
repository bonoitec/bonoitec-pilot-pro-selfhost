/**
 * SECURITY NOTE: the signature captured here is saved as a PNG data URL to
 * repair-photos storage for legal/evidentiary purposes (proof the customer
 * acknowledged the intake terms). It is NOT an authentication credential and
 * is not used for identity verification. Org isolation on the storage bucket
 * path prevents cross-tenant reads.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  savedSignature?: string | null;
}

export function SignaturePad({ onSave, onClear, width = 500, height = 200, savedSignature }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "hsl(222, 47%, 11%)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas resolution to match CSS size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, [width, height]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasContent(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onClear?.();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  // L3: only render <img> if savedSignature is a valid PNG data URL or an https URL.
  // Blocks javascript:, data: application/xml, and other potentially executable sources.
  const isRenderableSignature =
    typeof savedSignature === "string" &&
    (savedSignature.startsWith("data:image/png;base64,") || savedSignature.startsWith("https://"));

  if (savedSignature && isRenderableSignature) {
    return (
      <div className="space-y-2">
        <div className="border border-border rounded-lg p-2 bg-card">
          <img src={savedSignature} alt="Signature client" className="max-h-[120px] mx-auto" />
        </div>
        <p className="text-xs text-success flex items-center gap-1"><Check className="h-3 w-3" />Signature enregistrée</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-border rounded-lg bg-card overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: `${height}px` }}
          className="cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground/50">Signez ici avec le doigt ou la souris</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasContent}>
          <Eraser className="h-3 w-3 mr-1" />Effacer
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasContent}>
          <Check className="h-3 w-3 mr-1" />Valider la signature
        </Button>
      </div>
    </div>
  );
}
