import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Props {
  value: number[];
  onChange: (pattern: number[]) => void;
  readOnly?: boolean;
  size?: number;
}

const DOT_POSITIONS = [
  // Row 0
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  // Row 1
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  // Row 2
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
];

export function PatternLockInput({ value, onChange, readOnly = false, size = 200 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<number[]>(value);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setCurrentPattern(value);
  }, [value]);

  const padding = size * 0.15;
  const gridSize = size - padding * 2;
  const spacing = gridSize / 2;
  const dotRadius = size * 0.04;
  const hitRadius = size * 0.12;

  const getDotCenter = (index: number) => {
    const { row, col } = DOT_POSITIONS[index];
    return {
      x: padding + col * spacing,
      y: padding + row * spacing,
    };
  };

  const getSvgCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * size,
      y: ((clientY - rect.top) / rect.height) * size,
    };
  }, [size]);

  const findDotAt = useCallback((pos: { x: number; y: number }) => {
    for (let i = 0; i < 9; i++) {
      const center = getDotCenter(i);
      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return i;
    }
    return -1;
  }, [hitRadius]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const pos = getSvgCoords(e);
    if (!pos) return;
    const dot = findDotAt(pos);
    if (dot >= 0) {
      setDrawing(true);
      setCurrentPattern([dot]);
      setCursorPos(pos);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || readOnly) return;
    e.preventDefault();
    const pos = getSvgCoords(e);
    if (!pos) return;
    setCursorPos(pos);
    const dot = findDotAt(pos);
    if (dot >= 0 && !currentPattern.includes(dot)) {
      setCurrentPattern(prev => [...prev, dot]);
    }
  };

  const handleEnd = () => {
    if (!drawing) return;
    setDrawing(false);
    setCursorPos(null);
    if (currentPattern.length >= 2) {
      onChange(currentPattern);
    } else {
      setCurrentPattern(value);
    }
  };

  useEffect(() => {
    const handleGlobalEnd = () => {
      if (drawing) handleEnd();
    };
    window.addEventListener("mouseup", handleGlobalEnd);
    window.addEventListener("touchend", handleGlobalEnd);
    return () => {
      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  });

  const handleReset = () => {
    setCurrentPattern([]);
    onChange([]);
  };

  const displayPattern = drawing ? currentPattern : value;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="touch-none select-none rounded-xl border border-border bg-muted/30"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Lines between selected dots */}
        {displayPattern.map((dot, i) => {
          if (i === 0) return null;
          const from = getDotCenter(displayPattern[i - 1]);
          const to = getDotCenter(dot);
          return (
            <line
              key={`line-${i}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke="hsl(var(--primary))"
              strokeWidth={size * 0.02}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* Line from last dot to cursor while drawing */}
        {drawing && cursorPos && displayPattern.length > 0 && (
          <line
            x1={getDotCenter(displayPattern[displayPattern.length - 1]).x}
            y1={getDotCenter(displayPattern[displayPattern.length - 1]).y}
            x2={cursorPos.x}
            y2={cursorPos.y}
            stroke="hsl(var(--primary))"
            strokeWidth={size * 0.015}
            strokeLinecap="round"
            opacity={0.4}
            strokeDasharray={`${size * 0.02} ${size * 0.015}`}
          />
        )}

        {/* Dots */}
        {DOT_POSITIONS.map((_, i) => {
          const center = getDotCenter(i);
          const isActive = displayPattern.includes(i);
          const orderIndex = displayPattern.indexOf(i);
          return (
            <g key={i}>
              {/* Hit area (invisible) */}
              <circle
                cx={center.x} cy={center.y} r={hitRadius}
                fill="transparent"
              />
              {/* Outer ring when active */}
              {isActive && (
                <circle
                  cx={center.x} cy={center.y}
                  r={dotRadius * 2.8}
                  fill="hsl(var(--primary) / 0.12)"
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth={1}
                />
              )}
              {/* Dot */}
              <circle
                cx={center.x} cy={center.y}
                r={isActive ? dotRadius * 1.5 : dotRadius}
                fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                className="transition-all duration-150"
              />
              {/* Order number */}
              {isActive && !readOnly && (
                <text
                  x={center.x} y={center.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="hsl(var(--primary-foreground))"
                  fontSize={dotRadius * 1.6}
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {orderIndex + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-2">
        {displayPattern.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {displayPattern.length} point{displayPattern.length > 1 ? "s" : ""}
          </span>
        )}
        {!readOnly && displayPattern.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />Effacer
          </Button>
        )}
      </div>
    </div>
  );
}

/** Serialize pattern to a storable string like "pattern:0,4,8,6,2" */
export function serializePattern(dots: number[]): string {
  if (dots.length === 0) return "";
  return `pattern:${dots.join(",")}`;
}

/** Deserialize pattern string back to array */
export function deserializePattern(value: string): number[] | null {
  if (!value.startsWith("pattern:")) return null;
  const parts = value.slice(8).split(",").map(Number);
  if (parts.some(isNaN) || parts.length < 2) return null;
  return parts;
}

/** Check if a password string is a pattern */
export function isPatternPassword(value: string): boolean {
  return value.startsWith("pattern:");
}
