// HeroAnimation.tsx
// ──────────────────────────────────────────────────────────────────────────
// Production-ready cinematic hero animation for Bonoitec Pilot Pro.
//
// Drop-in replacement for the current <HeroSection /> visuals. French copy
// is preserved verbatim from the original hero. CTAs are real React Router
// <Link>s to /auth and /demo. Loops forever at 12.5s. Respects
// prefers-reduced-motion: renders the final hero composition statically.
// Background is TRANSPARENT — the component blends into the host section's
// gradient/mesh. Do not wrap it in an opaque container.
//
// No dependencies beyond react, react-router-dom, lucide-react. No images —
// everything is pure SVG. Uses brand tokens via hsl(var(--*)) so it adapts
// to your light/dark theme automatically.
//
// Install:
//   1. Save this file as src/components/landing/HeroAnimation.tsx
//   2. In HeroSection.tsx replace the RepairJourneyScene slot with
//      <HeroAnimation />, OR replace the whole <section> — see README.
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useMemo, memo, createContext, useContext, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";

// ─────────── Brand tokens (use CSS vars so theme switching Just Works) ───────────
const C = {
  primary:   "hsl(var(--primary))",
  gradStart: "hsl(var(--gradient-start))",
  gradEnd:   "hsl(var(--gradient-end))",
  success:   "hsl(var(--success))",
  warning:   "hsl(var(--warning))",
  fg:        "hsl(var(--foreground))",
  muted:     "hsl(var(--muted-foreground))",
  border:    "hsl(var(--border))",
  accent:    "hsl(var(--accent))",
  card:      "hsl(var(--card))",
  bg:        "hsl(var(--background))",
};

// ─────────── Timeline runtime (minimal; no playback UI) ───────────
type Ctx = { time: number; duration: number };
const TimelineCtx = createContext<Ctx>({ time: 0, duration: 12.5 });
const useTime = () => useContext(TimelineCtx).time;

type SpriteCtx = { localTime: number; progress: number; duration: number; visible: boolean };
const SpriteContext = createContext<SpriteCtx>({ localTime: 0, progress: 0, duration: 0, visible: false });
const useSprite = () => useContext(SpriteContext);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic:  (t: number) => t * t * t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuad:  (t: number) => 1 - (1 - t) * (1 - t),
  outBack:  (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

function Sprite({ start, end, children }: { start: number; end: number; children: (ctx: SpriteCtx) => ReactNode }) {
  const { time } = useContext(TimelineCtx);
  const visible = time >= start && time <= end;
  if (!visible) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 ? clamp(localTime / duration, 0, 1) : 0;
  const value: SpriteCtx = { localTime, progress, duration, visible };
  return <SpriteContext.Provider value={value}>{children(value)}</SpriteContext.Provider>;
}

// ─────────── Illustrated SVG props (inline, compact) ───────────
function Phone({ w = 220, crackProgress = 0, healProgress = 0, state = "broken" as "broken" | "healed" }) {
  const isHealed = state === "healed" || healProgress > 0.6;
  return (
    <svg width={w} height={w * 2} viewBox="0 0 220 440" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="phBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2a38" /><stop offset="1" stopColor="#10101a" /></linearGradient>
        <linearGradient id="phScr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.gradStart} /><stop offset="1" stopColor={C.gradEnd} /></linearGradient>
        <filter id="phSh" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="22" floodColor={C.primary} floodOpacity="0.28" /></filter>
        <clipPath id="phClip"><rect x="16" y="18" width="188" height="404" rx="26" ry="26" /></clipPath>
      </defs>
      <rect x="4" y="4" width="212" height="432" rx="34" fill="url(#phBody)" filter="url(#phSh)" />
      <rect x="12" y="14" width="196" height="412" rx="30" fill="#050510" />
      <rect x="16" y="18" width="188" height="404" rx="26" fill={isHealed ? "url(#phScr)" : "#0b0b18"} />
      {isHealed && (
        <g clipPath="url(#phClip)" opacity={Math.min(1, healProgress * 1.4)}>
          <circle cx="110" cy="38" r="5" fill="rgba(255,255,255,0.5)" />
          <g transform="translate(110 220)">
            <circle r="56" fill="rgba(255,255,255,0.18)" />
            <circle r="40" fill="rgba(255,255,255,0.92)" />
            <path d="M-18 2 l12 12 l26 -26" stroke={C.primary} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <rect x="46" y="310" width="128" height="10" rx="5" fill="rgba(255,255,255,0.6)" />
          <rect x="66" y="330" width="88" height="8" rx="4" fill="rgba(255,255,255,0.4)" />
        </g>
      )}
      {!isHealed && (
        <g opacity={crackProgress} clipPath="url(#phClip)">
          <path d="M 70 80 L 120 150 L 95 200 L 150 250 L 110 320 L 160 400" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" fill="none" />
          <path d="M 120 150 L 180 140 M 120 150 L 60 180 M 95 200 L 40 220 M 150 250 L 190 270 M 110 320 L 55 340" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" fill="none" />
          <circle cx="120" cy="150" r="3" fill="rgba(255,255,255,0.9)" />
        </g>
      )}
      <rect x="90" y="26" width="40" height="6" rx="3" fill="#050510" />
    </svg>
  );
}

function Screwdriver({ w = 170 }) {
  return (
    <svg width={w} height={w * 0.32} viewBox="0 0 300 96" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sdH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.gradStart} /><stop offset="1" stopColor="hsl(var(--primary-deep, var(--primary)))" /></linearGradient>
        <linearGradient id="sdS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8dbe3" /><stop offset="0.5" stopColor="#f2f4fa" /><stop offset="1" stopColor="#9ea4b6" /></linearGradient>
        <filter id="sdSh"><feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" /></filter>
      </defs>
      <g filter="url(#sdSh)">
        <rect x="4" y="10" width="130" height="76" rx="14" fill="url(#sdH)" />
        <rect x="16" y="18" width="110" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
        {[0, 1, 2, 3, 4].map((i) => (<rect key={i} x={24 + i * 20} y="38" width="6" height="40" rx="2" fill="rgba(0,0,0,0.18)" />))}
        <rect x="130" y="34" width="14" height="28" rx="3" fill="#353846" />
        <rect x="142" y="42" width="110" height="12" rx="3" fill="url(#sdS)" />
        <path d="M252 36 L278 48 L252 60 Z" fill="#4a5064" />
      </g>
    </svg>
  );
}

function Wrench({ w = 170 }) {
  return (
    <svg width={w} height={w * 0.32} viewBox="0 0 300 96" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="wrM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7e9f0" /><stop offset="0.5" stopColor="#b8bdcb" /><stop offset="1" stopColor="#7e8497" /></linearGradient>
        <filter id="wrSh"><feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" /></filter>
      </defs>
      <g filter="url(#wrSh)">
        <path d="M 10 48 C 10 36, 28 32, 44 40 L 200 40 C 215 30, 240 30, 256 42 L 282 22 L 296 36 L 272 62 C 280 80, 262 96, 244 88 C 232 84, 228 70, 236 58 L 44 58 C 28 66, 10 62, 10 48 Z" fill="url(#wrM)" stroke="#5a607a" strokeWidth="1.2" />
        <circle cx="30" cy="49" r="6" fill="#353846" />
      </g>
    </svg>
  );
}

function ReplacementScreen({ w = 140 }) {
  return (
    <svg width={w} height={w * 1.7} viewBox="0 0 140 238" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="rsG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgba(180,200,255,0.7)" /><stop offset="0.5" stopColor="rgba(220,230,255,0.35)" /><stop offset="1" stopColor="rgba(180,210,255,0.6)" /></linearGradient>
        <filter id="rsSh"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor={C.primary} floodOpacity="0.3" /></filter>
      </defs>
      <rect x="4" y="4" width="132" height="230" rx="18" fill="url(#rsG)" stroke={C.primary} strokeWidth="1.5" filter="url(#rsSh)" />
      <path d="M 16 20 L 60 20 L 30 200 L 16 200 Z" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

function Battery({ w = 150 }) {
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 150 75" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="btF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.success} /><stop offset="1" stopColor="hsl(152, 62%, 55%)" /></linearGradient>
        <filter id="btSh"><feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" /></filter>
      </defs>
      <g filter="url(#btSh)">
        <rect x="6" y="10" width="124" height="55" rx="8" fill={C.card} stroke={C.fg} strokeWidth="2" />
        <rect x="130" y="26" width="10" height="23" rx="2" fill={C.fg} />
        <rect x="14" y="18" width="108" height="39" rx="4" fill="url(#btF)" />
        <path d="M 58 24 L 46 42 L 60 42 L 54 56 L 70 36 L 58 36 L 64 24 Z" fill="#fff" />
      </g>
    </svg>
  );
}

function Screw({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" style={{ overflow: "visible" }}>
      <defs><radialGradient id="scG" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stopColor="#eef0f6" /><stop offset="1" stopColor="#7c8397" /></radialGradient></defs>
      <circle cx="13" cy="13" r="11" fill="url(#scG)" stroke="#5a607a" strokeWidth="0.8" />
      <path d="M13 5 V21 M5 13 H21" stroke="#2b2f3c" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Invoice({ w = 220 }) {
  return (
    <svg width={w} height={w * 1.3} viewBox="0 0 220 286" style={{ overflow: "visible" }}>
      <defs><filter id="ivSh"><feDropShadow dx="0" dy="14" stdDeviation="16" floodColor={C.primary} floodOpacity="0.22" /></filter></defs>
      <g filter="url(#ivSh)">
        <path d="M 10 6 L 210 6 L 210 270 L 195 280 L 180 270 L 165 280 L 150 270 L 135 280 L 120 270 L 105 280 L 90 270 L 75 280 L 60 270 L 45 280 L 30 270 L 10 280 Z" fill={C.card} stroke={C.border} strokeWidth="1" />
        <rect x="24" y="22" width="6" height="30" rx="2" fill={C.primary} />
        <text x="38" y="32" fontFamily="Switzer, Inter, sans-serif" fontSize="11" fontWeight="700" fill={C.muted} letterSpacing="1">FACTURE</text>
        <text x="38" y="48" fontFamily="Switzer, Inter, sans-serif" fontSize="15" fontWeight="800" fill={C.fg}>F-0429</text>
        {[72, 96, 120, 144].map((y, i) => (
          <g key={y}>
            <rect x="24" y={y} width={[120, 150, 110, 140][i]} height="7" rx="2" fill={C.border} />
            <rect x="160" y={y} width="36" height="7" rx="2" fill={C.accent} />
          </g>
        ))}
        <line x1="24" y1="176" x2="196" y2="176" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />
        <text x="24" y="200" fontFamily="Switzer, Inter, sans-serif" fontSize="11" fontWeight="600" fill={C.muted}>TOTAL TTC</text>
        <text x="196" y="204" fontFamily="Switzer, Inter, sans-serif" fontSize="22" fontWeight="800" fill={C.fg} textAnchor="end">189,00 €</text>
        <g transform="translate(140 232) rotate(-8)">
          <rect x="0" y="0" width="60" height="26" rx="4" fill="none" stroke={C.success} strokeWidth="2" />
          <text x="30" y="18" fontFamily="Switzer, Inter, sans-serif" fontSize="12" fontWeight="800" fill={C.success} textAnchor="middle" letterSpacing="1.5">PAYÉE</text>
        </g>
      </g>
    </svg>
  );
}

function Clipboard({ w = 180 }) {
  return (
    <svg width={w} height={w * 1.3} viewBox="0 0 180 234" style={{ overflow: "visible" }}>
      <defs><filter id="cbSh"><feDropShadow dx="0" dy="12" stdDeviation="12" floodOpacity="0.2" /></filter></defs>
      <g filter="url(#cbSh)">
        <rect x="8" y="18" width="164" height="210" rx="8" fill="#f0ddb8" stroke="#c8a86a" strokeWidth="1.5" />
        <rect x="18" y="30" width="144" height="186" rx="4" fill={C.card} stroke={C.border} strokeWidth="0.8" />
        <rect x="60" y="4" width="60" height="26" rx="4" fill="#8e95aa" />
        <rect x="66" y="10" width="48" height="16" rx="2" fill="#60667a" />
        <rect x="28" y="44" width="80" height="8" rx="2" fill={C.primary} />
        {[62, 82, 102, 122, 142, 162].map((y, i) => (
          <g key={y}>
            <circle cx="32" cy={y + 3.5} r="3" fill="none" stroke={C.muted} strokeWidth="1" />
            {i < 3 && <path d={`M 30 ${y + 3.5} l 2 3 l 5 -5`} stroke={C.success} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="42" y={y} width={[80, 100, 72, 92, 60, 84][i]} height="6" rx="2" fill={C.border} />
          </g>
        ))}
      </g>
    </svg>
  );
}

function EuroChip({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="ecG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.success} /><stop offset="1" stopColor="hsl(152, 62%, 30%)" /></linearGradient>
        <filter id="ecSh"><feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.25" /></filter>
      </defs>
      <circle cx="35" cy="35" r="32" fill="url(#ecG)" filter="url(#ecSh)" />
      <text x="35" y="47" textAnchor="middle" fontFamily="Switzer, Inter, sans-serif" fontSize="36" fontWeight="800" fill="#fff">€</text>
    </svg>
  );
}

function Sparkle({ size = 40, color = C.primary, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ overflow: "visible", opacity }}>
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="20" y1="4" x2="20" y2="12" />
        <line x1="20" y1="28" x2="20" y2="36" />
        <line x1="4" y1="20" x2="12" y2="20" />
        <line x1="28" y1="20" x2="36" y2="20" />
      </g>
      <circle cx="20" cy="20" r="3" fill={color} />
    </svg>
  );
}

// ─────────── Ambient background — intentionally empty so the host section's
// own gradient/dots show through cleanly. No fills, no dots, no gradients here.
const AmbientBG = memo(function AmbientBG() {
  return null;
});

// ─────────── Caption — editorial, typographic, no container ───────────
function Caption({ text, sub }: { text: string; sub?: string }) {
  const { localTime, duration } = useSprite();
  const entryDur = 0.55, exitDur = 0.45;
  const exitStart = duration - exitDur;
  let op = 1, ty = 0, lineScale = 1;
  if (localTime < entryDur) {
    const t = Ease.outCubic(localTime / entryDur);
    op = t;
    ty = (1 - t) * 20;
    lineScale = t;
  } else if (localTime > exitStart) {
    const t = Ease.inCubic((localTime - exitStart) / exitDur);
    op = 1 - t;
    ty = -t * 10;
    lineScale = 1 - t;
  }
  return (
    <div style={{ position: "absolute", left: "50%", bottom: 110, transform: `translate3d(-50%, ${ty}px, 0)`, opacity: op, textAlign: "center", pointerEvents: "none", width: "min(1100px, 82%)" }}>
      {/* Chapter marker — thin tangerine accent line that draws in/out with the caption */}
      <div style={{ margin: "0 auto 26px", width: 72, height: 2, background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`, transform: `scaleX(${lineScale})`, transformOrigin: "center", borderRadius: 2 }} />
      <div
        style={{
          fontFamily: "'Switzer','Inter',system-ui,sans-serif",
          fontSize: 56,
          fontWeight: 700,
          color: C.fg,
          letterSpacing: -1.6,
          lineHeight: 1.08,
          textWrap: "balance" as unknown as undefined,
        }}
      >
        {text}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "'Switzer','Inter',system-ui,sans-serif",
            fontSize: 22,
            fontWeight: 400,
            color: C.muted,
            marginTop: 18,
            letterSpacing: 0.2,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─────────── Scenes 1-4 (story build) ───────────
function Scene1() {
  return (
    <Sprite start={0} end={2.2}>
      {({ localTime, progress }) => {
        const enter = Ease.outCubic(Math.min(1, localTime / 0.55));
        const crack = Ease.outQuad(Math.max(0, Math.min(1, (localTime - 0.6) / 0.7)));
        const camScale = 0.92 + enter * 0.15 + progress * 0.08;
        const rot = lerp(-6, 0, enter) + Math.sin(localTime * 1.3) * 0.7;
        return (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) translateY(-110px) translateY(${(1 - enter) * 60}px) scale(${camScale}) rotate(${rot}deg)`, opacity: enter, filter: `drop-shadow(0 30px 40px hsl(var(--primary) / ${0.22 + crack * 0.12}))` }}>
            <Phone w={300} crackProgress={crack} state="broken" />
          </div>
        );
      }}
    </Sprite>
  );
}

function Scene2() {
  return (
    <Sprite start={2.0} end={4.7}>
      {({ localTime, progress }) => {
        const enter = Ease.outCubic(Math.min(1, localTime / 0.5));
        const camScale = 1.0 + progress * 0.04;
        const phoneX = lerp(0, -260, enter);
        const clipX = lerp(900, 320, enter);
        const clipRot = lerp(15, -3, enter) + Math.sin(localTime * 0.8) * 0.6;
        const orbit = localTime * 1.1, r = 220;
        const sdX = Math.cos(orbit + 0.3) * r, sdY = Math.sin(orbit + 0.3) * r * 0.55;
        const wrX = Math.cos(orbit + Math.PI + 0.3) * r, wrY = Math.sin(orbit + Math.PI + 0.3) * r * 0.55;
        return (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${camScale})` }}>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${phoneX}px), calc(-50% - 100px)) rotate(${Math.sin(localTime * 1.1) * 0.8}deg)`, opacity: enter }}>
              <Phone w={300} crackProgress={1} />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${phoneX + sdX}px), calc(-50% - 100px + ${sdY}px)) rotate(${orbit * 57.2958 + 20}deg)`, opacity: enter }}><Screwdriver w={210} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${phoneX + wrX}px), calc(-50% - 100px + ${wrY}px)) rotate(${orbit * 57.2958 + 200}deg)`, opacity: enter }}><Wrench w={210} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${clipX}px, calc(-50% - 100px)) rotate(${clipRot}deg)`, opacity: enter }}><Clipboard w={240} /></div>
          </div>
        );
      }}
    </Sprite>
  );
}

function Scene3() {
  return (
    <Sprite start={4.5} end={7.2}>
      {({ localTime, progress }) => {
        const enter = Ease.outCubic(Math.min(1, localTime / 0.4));
        const heal = Ease.inOutCubic(Math.max(0, Math.min(1, (localTime - 1.0) / 1.0)));
        const crack = 1 - heal;
        const camScale = 1.05 + progress * 0.05;
        const screenT = Math.min(1, Math.max(0, (localTime - 0.2) / 0.7));
        const screenE = Ease.outCubic(screenT);
        const screenOp = Math.min(1, screenT * 2) * (1 - Ease.inCubic(Math.max(0, (localTime - 1.2) / 0.4)));
        const batT = Math.min(1, Math.max(0, (localTime - 0.35) / 0.7));
        const batE = Ease.outCubic(batT);
        const batOp = Math.min(1, batT * 2) * (1 - Ease.inCubic(Math.max(0, (localTime - 1.3) / 0.4)));
        const screws = [{ d: 0.25, dx: -120, dy: 180, sa: -60 }, { d: 0.4, dx: 140, dy: -160, sa: 40 }, { d: 0.3, dx: -160, dy: -140, sa: 200 }, { d: 0.45, dx: 130, dy: 170, sa: 140 }];
        return (
          <>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,calc(-50% - 100px)) scale(${camScale})`, opacity: enter, filter: heal > 0.5 ? `drop-shadow(0 24px 40px hsl(var(--primary) / ${0.30 + heal * 0.15}))` : "drop-shadow(0 20px 32px rgba(0,0,0,0.18))" }}>
              <Phone w={300} crackProgress={crack} healProgress={heal} state={heal > 0.6 ? "healed" : "broken"} />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(-800, -170, screenE)}px), calc(-50% - 100px + ${lerp(-200, -30, screenE)}px)) rotate(${lerp(-30, -8, screenE)}deg)`, opacity: screenOp }}><ReplacementScreen w={170} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(900, 190, batE)}px), calc(-50% - 100px + ${lerp(300, 80, batE)}px)) rotate(${lerp(40, 10, batE)}deg)`, opacity: batOp }}><Battery w={180} /></div>
            {screws.map((s, i) => {
              const t = Math.min(1, Math.max(0, (localTime - s.d) / 0.55));
              const e = Ease.outBack(t);
              const x = lerp(Math.cos((s.sa * Math.PI) / 180) * 800, s.dx, e);
              const y = lerp(Math.sin((s.sa * Math.PI) / 180) * 800, s.dy, e);
              const op = t * (1 - Ease.inCubic(Math.max(0, (localTime - 1.3) / 0.4)));
              return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% - 100px + ${y}px)) rotate(${t * 360}deg)`, opacity: op }}><Screw size={28} /></div>;
            })}
            {heal > 0.3 && heal < 0.95 && (
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,calc(-50% - 100px)) scale(${0.6 + heal * 1.8})`, width: 400, height: 400, borderRadius: "50%", border: `2px solid hsl(var(--primary) / ${0.6 * (1 - heal)})`, boxShadow: `0 0 80px hsl(var(--primary) / ${0.4 * (1 - heal)})`, pointerEvents: "none" }} />
            )}
          </>
        );
      }}
    </Sprite>
  );
}

function Scene4() {
  return (
    <Sprite start={7.0} end={9.0}>
      {({ localTime, progress }) => {
        const enter = Ease.outCubic(Math.min(1, localTime / 0.4));
        const phoneX = lerp(0, -200, enter);
        const invT = Ease.outCubic(Math.min(1, localTime / 0.7));
        const invY = lerp(900, 40, invT);
        const invRot = lerp(20, 5, invT) + Math.sin(localTime * 0.8) * 0.8;
        const chipT = Math.min(1, Math.max(0, (localTime - 0.6) / 0.35));
        const chipE = Ease.outBack(chipT);
        return (
          <>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${phoneX}px), -50%) scale(${1 + progress * 0.04})`, filter: "drop-shadow(0 30px 60px hsl(var(--primary) / 0.4))" }}>
              <Phone w={320} healProgress={1} state="healed" />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + 180px), calc(-50% + ${invY}px)) rotate(${invRot}deg)` }}><Invoice w={260} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + 360px), calc(-50% - 160px)) scale(${chipE})`, opacity: chipT }}><EuroChip size={90} /></div>
          </>
        );
      }}
    </Sprite>
  );
}

const CAPTIONS = [
  { start: 0.5, end: 2.1, text: "Un téléphone arrive à l'atelier.", sub: "Dépôt enregistré, client prévenu." },
  { start: 2.4, end: 4.6, text: "Diagnostic et devis.", sub: "Suivi en temps réel." },
  { start: 4.9, end: 7.0, text: "Pièces, stock, réparation.", sub: "Tout synchronisé." },
  { start: 7.3, end: 8.9, text: "Devis et facture en un clic.", sub: "Paiement encaissé." },
];

// ─────────── Scene 5: final hero composition with REAL CTAs ───────────
function HeroComposition() {
  return (
    <Sprite start={8.6} end={12.5}>
      {({ localTime }) => {
        const settle = Ease.inOutCubic(Math.min(1, localTime / 1.0));
        const textT = Math.min(1, Math.max(0, (localTime - 0.6) / 0.6));
        const textE = Ease.outCubic(textT);
        const ctaT = Math.min(1, Math.max(0, (localTime - 1.5) / 0.5));
        const ctaE = Ease.outBack(ctaT);
        const badgeE = Ease.outCubic(Math.min(1, Math.max(0, (localTime - 2.0) / 0.5)));
        const idle = Math.sin(localTime * 0.9), idle2 = Math.cos(localTime * 0.7);
        const phoneX = lerp(-80, 640, settle);
        const phoneY = lerp(0, 40, settle) + idle * 6;
        const phoneRot = lerp(0, 4, settle) + idle * 0.5;
        const phoneScale = lerp(1.0, 0.9, settle);
        const invSettle = Ease.inOutCubic(Math.min(1, localTime / 1.2));
        const toolSettle = Ease.inOutCubic(Math.min(1, Math.max(0, (localTime - 0.2) / 1.0)));
        return (
          <>
            {/* LEFT — text column (hero copy preserved verbatim) */}
            <div style={{ position: "absolute", left: 32, top: 220, maxWidth: 1180 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, background: `linear-gradient(135deg, hsl(var(--gradient-start) / 0.08), hsl(var(--gradient-end) / 0.08))`, border: "1px solid hsl(var(--primary) / 0.25)", color: C.primary, fontSize: 16, fontWeight: 700, opacity: textE, transform: `translateY(${(1 - textE) * 16}px)`, marginBottom: 30 }}>
                <Sparkles className="w-4 h-4" /> Le logiciel de gestion pensé pour les réparateurs
              </div>
              <h1 style={{ fontSize: 96, lineHeight: 1.0, fontWeight: 800, letterSpacing: -3.0, margin: 0, color: C.fg, opacity: textE, transform: `translateY(${(1 - textE) * 24}px)`, textWrap: "pretty" as const }}>
                Toute la gestion de votre atelier dans{" "}
                <span style={{ backgroundImage: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontStyle: "italic", display: "inline-block", paddingRight: "0.12em" }}>une seule plateforme</span>
              </h1>
              <p style={{ fontSize: 24, lineHeight: 1.5, color: C.muted, maxWidth: 980, margin: "28px 0 36px", opacity: textE * Math.min(1, Math.max(0, (localTime - 1.0) / 0.5)), textWrap: "pretty" as const }}>
                Gérez vos réparations, vos clients, vos devis, vos factures, votre stock et votre activité depuis une interface simple, rapide et pensée pour le terrain.
              </p>
              <div style={{ display: "flex", gap: 18, opacity: ctaT, transform: `scale(${ctaE})`, transformOrigin: "left center", pointerEvents: ctaT > 0.3 ? "auto" : "none" }}>
                <HeroCtaPrimary to="/auth" />
                <HeroCtaSecondary to="/demo" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 30px", marginTop: 32, opacity: badgeE }}>
                {["Essai gratuit 14 jours", "Sans engagement", "Support réactif", "Pensé pour les ateliers"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: C.muted, fontWeight: 500 }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: C.success }} /> {t}
                  </div>
                ))}
              </div>
            </div>
            {/* RIGHT — props settled */}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate3d(calc(-50% + 680px), -50%, 0)`, width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, hsl(var(--primary) / 0.22), transparent 65%)`, opacity: settle, pointerEvents: "none", willChange: "opacity" }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(180, 760, invSettle)}px), calc(-50% + ${lerp(40, 240, invSettle) + idle2 * 5}px)) rotate(${lerp(5, -6, invSettle) + idle2 * 0.7}deg)`, zIndex: 2, pointerEvents: "none" }}><Invoice w={240} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${phoneX}px), calc(-50% + ${phoneY}px)) rotate(${phoneRot}deg) scale(${phoneScale})`, filter: "drop-shadow(0 32px 40px hsl(var(--primary) / 0.28))", zIndex: 3, pointerEvents: "none" }}><Phone w={320} healProgress={1} state="healed" /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(0, 280, toolSettle)}px), calc(-50% + ${lerp(0, -260, toolSettle) + idle * 4}px)) rotate(${lerp(0, -18, toolSettle)}deg) scale(0.7)`, opacity: toolSettle, zIndex: 4, pointerEvents: "none" }}><Screwdriver w={180} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(0, 760, toolSettle)}px), calc(-50% + ${lerp(0, -80, toolSettle) + idle2 * 4}px)) rotate(${lerp(0, 14, toolSettle)}deg) scale(0.7)`, opacity: toolSettle, zIndex: 4, pointerEvents: "none" }}><Wrench w={180} /></div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${lerp(360, 920, settle)}px), calc(-50% + ${lerp(-160, -300, settle) + idle * 3}px)) scale(${lerp(1, 0.75, settle)})`, opacity: settle, zIndex: 5, pointerEvents: "none" }}><EuroChip size={76} /></div>
          </>
        );
      }}
    </Sprite>
  );
}

// ─────────── Static fallback (reduced motion) — same final layout, no animation ───────────
function StaticHero() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <AmbientBG />
      <Sprite start={0} end={999}>
        {() => <HeroComposition />}
      </Sprite>
    </div>
  );
}

// ─────────── First-paint poster — faint ghost of the final hero shown before
// Scene 1 has had time to draw. Fades out completely by t ≈ 0.9 s so it never
// competes with the scenes. Eliminates the dead blank frame at page load. ───────────
function HeroPoster() {
  const t = useTime();
  const op = Math.max(0, 0.12 - t * 0.14);
  if (op <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, pointerEvents: "none" }}>
      <Sprite start={0} end={999}>
        {() => <HeroComposition />}
      </Sprite>
    </div>
  );
}

// ─────────── Hero CTAs — polished hover (lift + shadow deepen + icon shift) ───────────
function HeroCtaPrimary({ to }: { to: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "28px 48px",
        borderRadius: 999,
        background: `linear-gradient(135deg, ${C.gradStart}, ${C.gradEnd})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: 24,
        boxShadow: hover
          ? "0 26px 60px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.28)"
          : "0 18px 50px hsl(var(--primary) / 0.45), inset 0 1px 0 rgba(255,255,255,0.22)",
        textDecoration: "none",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      Commencer gratuitement{" "}
      <ArrowRight
        className="w-7 h-7"
        style={{
          transform: hover ? "translateX(4px)" : "translateX(0)",
          transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </Link>
  );
}

function HeroCtaSecondary({ to }: { to: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "28px 44px",
        borderRadius: 999,
        background: hover ? "hsl(var(--primary) / 0.08)" : "transparent",
        color: C.primary,
        border: `2px solid ${hover ? "hsl(var(--primary) / 0.85)" : "hsl(var(--primary) / 0.4)"}`,
        fontWeight: 600,
        fontSize: 24,
        textDecoration: "none",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "background 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <Play className="w-6 h-6" fill="currentColor" /> Voir la démo
    </Link>
  );
}

// ─────────── Main component ───────────
export default function HeroAnimation({ duration = 12.5, loop = true, className = "" }: { duration?: number; loop?: boolean; className?: string }) {
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(1);
  const hostRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Auto-scale 1920×1080 canvas to host width
  useEffect(() => {
    if (!hostRef.current) return;
    const el = hostRef.current;
    const measure = () => setScale(el.clientWidth / 1920);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Timeline loop — paused if reduced motion
  useEffect(() => {
    if (reducedMotion) { setTime(17); return; }
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      setTime(loop ? elapsed % duration : Math.min(elapsed, duration));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); startRef.current = null; };
  }, [duration, loop, reducedMotion]);

  const ctx = useMemo(() => ({ time, duration }), [time, duration]);

  return (
    <div ref={hostRef} className={className} style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: "transparent" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <TimelineCtx.Provider value={ctx}>
          {reducedMotion ? (
            <StaticHero />
          ) : (
            <>
              <HeroPoster />
              <AmbientBG />
              <Scene1 />
              <Scene2 />
              <Scene3 />
              <Scene4 />
              <HeroComposition />
              {CAPTIONS.map((c, i) => (
                <Sprite key={i} start={c.start} end={c.end}>
                  {() => <Caption text={c.text} sub={c.sub} />}
                </Sprite>
              ))}
            </>
          )}
        </TimelineCtx.Provider>
      </div>
    </div>
  );
}
