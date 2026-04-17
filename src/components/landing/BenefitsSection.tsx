// BenefitsSection.tsx
// ──────────────────────────────────────────────────────────────────────────
// Production-ready scroll-scrubbed benefits film for Bonoitec Pilot Pro.
//
// Replaces the current src/components/landing/BenefitsSection.tsx. French
// copy preserved verbatim. The section is 600vh tall: as you scroll, a
// pinned 16:9 stage scrubs through 6 cinematic beats (clock, shield,
// receipt, avatars, boxes, chart) and settles into the final card grid.
//
// Background is TRANSPARENT — inherits the host page gradient/mesh.
// Respects prefers-reduced-motion: renders only the final card grid.
// Uses brand tokens via hsl(var(--*)).
//
// No new dependencies beyond react. Remove framer-motion imports — this
// file does not need them. lucide-react icons are kept inline for the
// final grid to match the rest of the landing's visual language.
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

// ─────────── Brand tokens ───────────
const C = {
  primary:   "hsl(var(--primary))",
  gradStart: "hsl(var(--gradient-start))",
  gradEnd:   "hsl(var(--gradient-end))",
  success:   "hsl(var(--success))",
  warning:   "hsl(var(--warning))",
  fg:        "hsl(var(--foreground))",
  muted:     "hsl(var(--muted-foreground))",
  border:    "hsl(var(--border))",
  card:      "hsl(var(--card))",
};

// ─────────── Copy (verbatim from original BenefitsSection) ───────────
const BENEFITS = [
  { title: "Gain de temps",       desc: "Automatisez les tâches administratives et gardez votre attention sur la réparation." },
  { title: "Moins d'erreurs",     desc: "Suivez chaque intervention avec des statuts clairs et un workflow structuré." },
  { title: "Facturation rapide",  desc: "Créez devis, factures et acomptes en quelques clics." },
  { title: "Suivi client fluide", desc: "Historique, messages, notifications et informations centralisés." },
  { title: "Gestion du stock",    desc: "Gardez un œil sur vos pièces, besoins et disponibilités." },
  { title: "Pilotage d'activité", desc: "Suivez vos performances, vos ventes et vos marges en temps réel." },
];

// ─────────── Utils ───────────
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic:  (t: number) => t * t * t,
};
const beatLocal = (p: number, idx: number, total = 7) => {
  const span = 1 / total;
  return clamp((p - idx * span) / span, 0, 1);
};

// ─────────── SVG props ───────────
function ClockProp({ w = 220, progress = 1 }: { w?: number; progress?: number }) {
  const sweep = progress * 360 * 1.5;
  return (
    <svg width={w} height={w} viewBox="0 0 220 220" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="clockRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="hsl(var(--muted))" /></linearGradient>
        <filter id="clockSh"><feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="hsl(var(--primary))" floodOpacity="0.22" /></filter>
      </defs>
      <circle cx="110" cy="110" r="96" fill="url(#clockRing)" stroke={C.border} strokeWidth="2" filter="url(#clockSh)" />
      <circle cx="110" cy="110" r="82" fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="2 10" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const r1 = i % 3 === 0 ? 72 : 78, r2 = 86;
        return <line key={i} x1={110 + Math.cos(a) * r1} y1={110 + Math.sin(a) * r1} x2={110 + Math.cos(a) * r2} y2={110 + Math.sin(a) * r2} stroke={i % 3 === 0 ? C.fg : C.muted} strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />;
      })}
      <g transform={`rotate(${sweep * 0.08} 110 110)`}><line x1="110" y1="110" x2="110" y2="60" stroke={C.fg} strokeWidth="5" strokeLinecap="round" /></g>
      <g transform={`rotate(${sweep} 110 110)`}><line x1="110" y1="110" x2="110" y2="40" stroke={C.primary} strokeWidth="3" strokeLinecap="round" /></g>
      <circle cx="110" cy="110" r="9" fill={C.primary} />
      <circle cx="110" cy="110" r="4" fill="#fff" />
    </svg>
  );
}

function ShieldProp({ w = 220, progress = 1 }: { w?: number; progress?: number }) {
  const pathLen = 80;
  const dash = pathLen * (1 - Math.max(0, Math.min(1, (progress - 0.3) / 0.5)));
  return (
    <svg width={w} height={w} viewBox="0 0 220 220" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="shldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.gradStart} /><stop offset="1" stopColor={C.gradEnd} /></linearGradient>
        <filter id="shldSh"><feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="hsl(var(--primary))" floodOpacity="0.32" /></filter>
      </defs>
      <path d="M110 20 L190 55 Q190 135 110 200 Q30 135 30 55 Z" fill="url(#shldFill)" filter="url(#shldSh)" />
      <path d="M110 20 L190 55 Q190 135 110 200 Q30 135 30 55 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path d="M70 110 L100 140 L155 80" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={pathLen} strokeDashoffset={dash} />
    </svg>
  );
}

function ReceiptProp({ w = 220, progress = 1, total = 1240 }: { w?: number; progress?: number; total?: number }) {
  const shown = Math.floor(total * progress);
  const lines = 5;
  return (
    <svg width={w} height={w * 1.2} viewBox="0 0 220 264" style={{ overflow: "visible" }}>
      <defs><filter id="rcSh"><feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#2a2a48" floodOpacity="0.20" /></filter></defs>
      <path d="M20 20 H200 V220 L185 210 L170 220 L155 210 L140 220 L125 210 L110 220 L95 210 L80 220 L65 210 L50 220 L35 210 L20 220 Z" fill="hsl(var(--card))" stroke={C.border} strokeWidth="2" filter="url(#rcSh)" />
      <rect x="36" y="36" width="60" height="10" rx="2" fill={C.primary} opacity="0.9" />
      <rect x="36" y="52" width="100" height="6" rx="1.5" fill={C.muted} opacity="0.4" />
      {Array.from({ length: lines }).map((_, i) => {
        const rowY = 80 + i * 18;
        const show = progress > (i + 1) / (lines + 2) ? 1 : 0;
        return (
          <g key={i} opacity={show}>
            <rect x="36" y={rowY} width={70 + i * 10} height="5" rx="1" fill={C.muted} opacity="0.35" />
            <rect x="160" y={rowY} width="28" height="5" rx="1" fill={C.fg} />
          </g>
        );
      })}
      <line x1="36" y1="182" x2="184" y2="182" stroke={C.border} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="36" y="202" fontFamily="'Switzer','Inter',sans-serif" fontSize="13" fontWeight="700" fill={C.fg}>TOTAL TTC</text>
      <text x="184" y="202" fontFamily="'Switzer','Inter',sans-serif" fontSize="17" fontWeight="800" fill={C.primary} textAnchor="end">{shown},00 €</text>
    </svg>
  );
}

function AvatarsProp({ w = 260, progress = 1 }: { w?: number; progress?: number }) {
  const a1 = Math.min(1, Math.max(0, (progress - 0.1) / 0.3));
  const a2 = Math.min(1, Math.max(0, (progress - 0.3) / 0.3));
  const a3 = Math.min(1, Math.max(0, (progress - 0.5) / 0.3));
  const bubble = Math.min(1, Math.max(0, (progress - 0.7) / 0.3));
  return (
    <svg width={w} height={w} viewBox="0 0 260 260" style={{ overflow: "visible" }}>
      <defs>
        <filter id="avSh"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="hsl(var(--primary))" floodOpacity="0.18" /></filter>
        <linearGradient id="av1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.gradStart} /><stop offset="1" stopColor={C.gradEnd} /></linearGradient>
        <linearGradient id="av2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="hsl(38 92% 60%)" /><stop offset="1" stopColor="hsl(14 90% 58%)" /></linearGradient>
        <linearGradient id="av3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="hsl(151 65% 55%)" /><stop offset="1" stopColor="hsl(175 70% 45%)" /></linearGradient>
      </defs>
      {[{ cx: 70, cy: 120, g: "av1", t: a1, letter: "M" }, { cx: 130, cy: 100, g: "av2", t: a2, letter: "J" }, { cx: 190, cy: 140, g: "av3", t: a3, letter: "C" }].map((p, i) => (
        <g key={i} transform={`translate(${p.cx},${p.cy}) scale(${p.t})`} opacity={p.t} filter="url(#avSh)">
          <circle cx="0" cy="0" r="38" fill={`url(#${p.g})`} stroke="#fff" strokeWidth="4" />
          <text x="0" y="6" fontFamily="'Switzer','Inter',sans-serif" fontSize="28" fontWeight="700" fill="#fff" textAnchor="middle">{p.letter}</text>
        </g>
      ))}
      <g transform="translate(150,195)" opacity={bubble}>
        <path d="M0 0 H80 Q90 0 90 10 V40 Q90 50 80 50 H25 L15 62 L15 50 H10 Q0 50 0 40 V10 Q0 0 10 0 Z" fill="#fff" stroke={C.border} strokeWidth="1.5" filter="url(#avSh)" />
        <rect x="10" y="12" width="50" height="4" rx="1" fill={C.muted} opacity="0.5" />
        <rect x="10" y="22" width="70" height="4" rx="1" fill={C.muted} opacity="0.5" />
        <rect x="10" y="32" width="35" height="4" rx="1" fill={C.primary} />
      </g>
    </svg>
  );
}

function StockProp({ w = 260, progress = 1 }: { w?: number; progress?: number }) {
  const boxes = [
    { x: 60, y: 150, w: 70, h: 50, d: 0.00, c: C.primary },
    { x: 135, y: 150, w: 70, h: 50, d: 0.15, c: C.gradEnd },
    { x: 97, y: 95, w: 70, h: 50, d: 0.30, c: C.warning },
    { x: 60, y: 40, w: 70, h: 50, d: 0.45, c: C.success },
    { x: 135, y: 40, w: 70, h: 50, d: 0.55, c: C.primary },
  ];
  return (
    <svg width={w} height={w} viewBox="0 0 260 260" style={{ overflow: "visible" }}>
      <defs><filter id="stSh"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#2a2a48" floodOpacity="0.18" /></filter></defs>
      <rect x="30" y="210" width="200" height="10" rx="3" fill={C.border} />
      {boxes.map((b, i) => {
        const t = Math.min(1, Math.max(0, (progress - b.d) / 0.35));
        const e = 1 - Math.pow(1 - t, 3);
        const y = b.y - 200 * (1 - e);
        return (
          <g key={i} opacity={t} filter="url(#stSh)">
            <rect x={b.x} y={y} width={b.w} height={b.h} rx="4" fill={b.c} opacity="0.92" />
            <rect x={b.x + 4} y={y + 4} width={b.w - 8} height="10" rx="2" fill="rgba(255,255,255,0.25)" />
            <line x1={b.x + b.w / 2} y1={y + 14} x2={b.x + b.w / 2} y2={y + b.h - 4} stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="2 3" />
          </g>
        );
      })}
    </svg>
  );
}

function ChartProp({ w = 280, progress = 1 }: { w?: number; progress?: number }) {
  const bars = [0.30, 0.45, 0.38, 0.62, 0.55, 0.78, 0.92];
  const lineLen = 500;
  const lineDash = lineLen * (1 - Math.max(0, Math.min(1, (progress - 0.5) / 0.4)));
  return (
    <svg width={w} height={w * 0.75} viewBox="0 0 280 210" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.gradStart} /><stop offset="1" stopColor={C.gradEnd} /></linearGradient>
        <filter id="chSh"><feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="hsl(var(--primary))" floodOpacity="0.22" /></filter>
      </defs>
      <rect x="10" y="10" width="260" height="190" rx="14" fill="hsl(var(--card))" stroke={C.border} strokeWidth="1.5" filter="url(#chSh)" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1="26" y1={40 + i * 36} x2="254" y2={40 + i * 36} stroke={C.border} strokeWidth="1" strokeDasharray="2 4" />)}
      {bars.map((v, i) => {
        const t = Math.min(1, Math.max(0, (progress - 0.1 - i * 0.05) / 0.35));
        const e = 1 - Math.pow(1 - t, 3);
        const h = v * 140 * e;
        const x = 40 + i * 30;
        return <rect key={i} x={x} y={188 - h} width="18" height={h} rx="3" fill="url(#chBar)" />;
      })}
      <polyline points={bars.map((v, i) => `${49 + i * 30},${188 - v * 140}`).join(" ")} fill="none" stroke={C.fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={lineLen} strokeDashoffset={lineDash} />
      {bars.map((v, i) => {
        const t = Math.max(0, Math.min(1, (progress - 0.65 - i * 0.02) / 0.2));
        return <circle key={i} cx={49 + i * 30} cy={188 - v * 140} r={t * 4} fill={C.fg} />;
      })}
      <g transform="translate(210,30)">
        <circle cx="0" cy="0" r="14" fill="hsl(var(--success))" opacity="0.15" />
        <text x="0" y="4" fontFamily="'Switzer',sans-serif" fontSize="11" fontWeight="800" fill="hsl(var(--success))" textAnchor="middle">+24%</text>
      </g>
    </svg>
  );
}

// ─────────── Beat heading ───────────
function BeatHeading({ index, title, desc, localP, side = "right" }: { index: number; title: string; desc: string; localP: number; side?: "left" | "right" }) {
  const enter = ease.outCubic(clamp(localP / 0.25, 0, 1));
  const exit = ease.inCubic(clamp((localP - 0.75) / 0.25, 0, 1));
  const op = enter * (1 - exit);
  const ty = (1 - enter) * 30 + exit * -20;
  return (
    <div style={{ position: "absolute", top: 260, [side === "left" ? "left" : "right"]: 120, maxWidth: 720, opacity: op, transform: `translateY(${ty}px)`, textAlign: side === "left" ? "left" : "right" }}>
      <div style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, background: "hsl(var(--primary) / 0.1)", color: C.primary, fontSize: 14, fontWeight: 700, marginBottom: 24, letterSpacing: 0.8 }}>
        0{index + 1} · Bénéfice {index + 1}/6
      </div>
      <h2 style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.0, letterSpacing: -2.2, margin: 0, color: C.fg, textWrap: "pretty" as const }}>{title}</h2>
      <p style={{ fontSize: 22, lineHeight: 1.5, color: C.muted, marginTop: 22, textWrap: "pretty" as const }}>{desc}</p>
    </div>
  );
}

// ─────────── Ambient bg ───────────
function Ambient({ p }: { p: number }) {
  const x1 = Math.sin(p * Math.PI * 2) * 80;
  const y1 = Math.cos(p * Math.PI * 2) * 40;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -100 + y1, left: "30%", width: 900, height: 700, background: "radial-gradient(ellipse, hsl(var(--primary) / 0.10), transparent 60%)", filter: "blur(70px)", transform: `translateX(${x1}px)` }} />
      <div style={{ position: "absolute", bottom: -100, right: "20%", width: 700, height: 700, background: "radial-gradient(circle, hsl(var(--gradient-end) / 0.08), transparent 60%)", filter: "blur(70px)" }} />
    </div>
  );
}

// ─────────── Beats ───────────
function Beat({ index, localP, icon, side }: { index: number; localP: number; icon: React.ReactNode; side: "left" | "right" }) {
  const enter = ease.outCubic(clamp(localP / 0.25, 0, 1));
  const exit = ease.inCubic(clamp((localP - 0.75) / 0.25, 0, 1));
  const scale = 0.8 + enter * 0.3 - exit * 0.1;
  const y = (1 - enter) * 80 + exit * -40;
  const op = enter * (1 - exit);
  const horiz = side === "left" ? { left: 340 } : { right: 340 };
  return (
    <>
      <div style={{ position: "absolute", ...horiz, top: "50%", transform: `translateY(-50%) translateY(${y}px) scale(${scale})`, opacity: op }}>
        {icon}
      </div>
      <BeatHeading index={index} title={BENEFITS[index].title} desc={BENEFITS[index].desc} localP={localP} side={side === "left" ? "right" : "left"} />
    </>
  );
}

// ─────────── Progress pips ───────────
function ProgressPips({ p }: { p: number }) {
  return (
    <div style={{ position: "absolute", left: "50%", bottom: 60, transform: "translateX(-50%)", display: "flex", gap: 10, pointerEvents: "none" }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const start = i / 7, end = (i + 1) / 7;
        const active = p >= start && p < end + 0.01;
        const done = p > end;
        return <div key={i} style={{ width: active ? 56 : 32, height: 6, borderRadius: 3, background: done || active ? C.primary : "hsl(var(--primary) / 0.2)", transition: "width 280ms ease" }} />;
      })}
    </div>
  );
}

// ─────────── Final card grid ───────────
function BenefitsGrid({ p }: { p: number }) {
  const ICON_MAP = [
    (s: number) => <ClockProp w={s} />,
    (s: number) => <ShieldProp w={s} />,
    (s: number) => <ReceiptProp w={s * 0.7} />,
    (s: number) => <AvatarsProp w={s} />,
    (s: number) => <StockProp w={s} />,
    (s: number) => <ChartProp w={s * 1.1} />,
  ];
  const titleOp = ease.outCubic(clamp(p / 0.25, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "80px 120px", opacity: p > 0 ? 1 : 0, pointerEvents: p > 0.5 ? "auto" : "none" }}>
      <div style={{ textAlign: "center", marginBottom: 56, opacity: titleOp, transform: `translateY(${(1 - titleOp) * 24}px)` }}>
        <h2 style={{ fontSize: 68, fontWeight: 800, letterSpacing: -2.0, margin: 0, color: C.fg }}>Votre atelier, parfaitement organisé.</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, flex: 1 }}>
        {BENEFITS.map((b, i) => {
          const t = ease.outCubic(clamp((p - 0.15 - i * 0.06) / 0.3, 0, 1));
          return (
            <div key={b.title} style={{ background: "hsl(var(--card))", borderRadius: 24, padding: 40, border: `1px solid ${C.border}`, boxShadow: "0 8px 30px hsl(var(--primary) / 0.06)", opacity: t, transform: `translateY(${(1 - t) * 40}px)`, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>{ICON_MAP[i](80)}</div>
              <h3 style={{ fontSize: 26, fontWeight: 700, color: C.fg, margin: 0, letterSpacing: -0.5 }}>{b.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: C.muted, margin: 0, textWrap: "pretty" as const }}>{b.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────── Film (takes progress 0→1) ───────────
function BenefitsFilm({ progress }: { progress: number }) {
  const p = clamp(progress, 0, 1);
  const beatIdx = Math.min(5, Math.floor(p * 7));
  const inBeat = p < 6 / 7;
  const inGrid = p >= 6 / 7 - 0.02;
  const gridP = clamp((p - 6 / 7) / (1 / 7 + 0.02), 0, 1);
  const locals = [0, 1, 2, 3, 4, 5].map((i) => beatLocal(p, i));

  const beatConfigs: { side: "left" | "right"; icon: React.ReactNode }[] = [
    { side: "left",  icon: <ClockProp w={380} progress={locals[0]} /> },
    { side: "right", icon: <ShieldProp w={400} progress={locals[1]} /> },
    { side: "left",  icon: <ReceiptProp w={340} progress={locals[2]} /> },
    { side: "right", icon: <AvatarsProp w={440} progress={locals[3]} /> },
    { side: "left",  icon: <StockProp w={420} progress={locals[4]} /> },
    { side: "right", icon: <ChartProp w={500} progress={locals[5]} /> },
  ];

  return (
    <div style={{ position: "relative", width: 1920, height: 1080, overflow: "hidden" }}>
      <Ambient p={p} />
      {inBeat && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Beat index={beatIdx} localP={locals[beatIdx]} {...beatConfigs[beatIdx]} />
          <ProgressPips p={p} />
        </div>
      )}
      {inGrid && <BenefitsGrid p={gridP} />}
    </div>
  );
}

// ─────────── Section wrapper (600vh, sticky stage, auto-scaled) ───────────
const BenefitsSection = () => {
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) { setProgress(1); return; }

    const updateScale = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      setScale(Math.min(vw / 1920, vh / 1080));
    };
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      setProgress(p);
    };

    updateScale();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScale);
    };
  }, [reducedMotion]);

  // Reduced motion: render static grid at normal section height, no scroll-scrub.
  if (reducedMotion) {
    return (
      <section className="landing-section relative">
        <div className="landing-container relative" style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", maxWidth: 1600, margin: "0 auto" }}>
          <BenefitsFilm progress={1} />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "600vh" }} aria-label="Bénéfices">
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0 }}>
          <BenefitsFilm progress={progress} />
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
