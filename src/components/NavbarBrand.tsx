import { useState } from "react";
import Lottie from "lottie-react";
import { useReducedMotion } from "framer-motion";
import brandLight from "@/assets/brand-logo-light.png";
import brandLight2x from "@/assets/brand-logo-light@2x.png";
import brandDark from "@/assets/brand-logo-dark.png";
import brandDark2x from "@/assets/brand-logo-dark@2x.png";
import brandLottie from "@/assets/lottie/apps-brand.json";

export function NavbarBrand() {
  const reduce = useReducedMotion();
  const [playKey, setPlayKey] = useState(0);
  const retrigger = () => setPlayKey((k) => k + 1);

  return (
    <span
      onMouseEnter={retrigger}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.55rem",
        lineHeight: 0,
        userSelect: "none",
      }}
    >
      {!reduce && (
        <span
          aria-hidden="true"
          className="shrink-0 h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 inline-block"
          style={{ lineHeight: 0, transform: "translateY(-15%)" }}
        >
          <Lottie
            key={playKey}
            animationData={brandLottie}
            loop={false}
            autoplay
            rendererSettings={{
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: false,
            }}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </span>
      )}

      <img
        src={brandLight}
        srcSet={`${brandLight} 1x, ${brandLight2x} 2x`}
        alt="BonoitecPilot"
        draggable={false}
        className="block dark:hidden h-14 md:h-16 lg:h-20 w-auto"
        style={{ imageRendering: "auto" }}
      />
      <img
        src={brandDark}
        srcSet={`${brandDark} 1x, ${brandDark2x} 2x`}
        alt="BonoitecPilot"
        draggable={false}
        className="hidden dark:block h-14 md:h-16 lg:h-20 w-auto"
        style={{ imageRendering: "auto" }}
      />
    </span>
  );
}
