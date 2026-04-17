import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Phone3D } from "./journey/Phone3D";
import { SceneProps } from "./journey/SceneProps";
import { JourneyCaption } from "./journey/JourneyCaption";
import { JourneySVGFallback } from "./journey/JourneySVGFallback";
import { clientTimelineSteps } from "@/lib/repairStatuses";

const SCENE_DURATION_MS = 2500;

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}

export function RepairJourneyScene() {
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const visible = useRef(true);

  useEffect(() => {
    setWebglReady(hasWebGL());
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      visible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(() => {
      if (!visible.current) return;
      setIndex((i) => (i + 1) % clientTimelineSteps.length);
    }, SCENE_DURATION_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
    };
  }, []);

  const cameraProps = useMemo(
    () => ({ position: [0, 0.3, 7.2] as [number, number, number], fov: 28 }),
    []
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 40%, #0f0f18 0%, #06060a 70%, #030307 100%)" }}>
      <div
        className="absolute left-1/2 top-1/2 w-[140%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(245 82% 60% / 0.18), hsl(280 76% 55% / 0.22), hsl(36 92% 50% / 0.12), hsl(152 62% 42% / 0.18), hsl(245 82% 60% / 0.18))",
          filter: "blur(60px)",
          animation: "journeyAura 14s linear infinite",
          opacity: 0.75,
        }}
      />
      <style>{`@keyframes journeyAura { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
      {webglReady === true ? (
        <Canvas
          dpr={[1, 2]}
          frameloop="always"
          camera={cameraProps}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.45} />
            <directionalLight position={[3, 4, 5]} intensity={0.8} color="#ffffff" />
            <directionalLight position={[-3, -2, 3]} intensity={0.35} color="#a78bfa" />
            <Environment preset="city" />
            <group position={[-0.75, 0.3, 0]}>
              <Phone3D sceneIndex={index} reducedMotion={reducedMotion} />
            </group>
            <group position={[0.85, 0.3, 0]}>
              <SceneProps index={index} />
            </group>
          </Suspense>
        </Canvas>
      ) : webglReady === false ? (
        <JourneySVGFallback index={index} reducedMotion={reducedMotion} />
      ) : null}
      <JourneyCaption index={index} />
    </div>
  );
}

export default RepairJourneyScene;
