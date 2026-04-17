import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { Group, MathUtils } from "three";

type PropComponent = React.FC;

function useFadeIn(delay = 0) {
  const ref = useRef<Group>(null);
  const opacity = useRef(0);
  useFrame((_, delta) => {
    opacity.current = MathUtils.lerp(opacity.current, 1, Math.min(delta * 4, 1));
    if (!ref.current) return;
    ref.current.traverse((obj) => {
      if ((obj as any).material) {
        const mat = (obj as any).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            m.transparent = true;
            m.opacity = opacity.current;
          });
        } else {
          mat.transparent = true;
          mat.opacity = opacity.current;
        }
      }
    });
  });
  void delay;
  return ref;
}

const PRIMARY = "#7c3aed";
const PRIMARY_GLOW = "#ad7dfc";
const SUCCESS = "#28a773";
const WARNING = "#f6a61a";

// 1. Réparation reçue — inbox tray + down-arrow ticket
const PropReceived: PropComponent = () => {
  const ref = useFadeIn();
  return (
    <group ref={ref}>
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.5}>
        <RoundedBox args={[0.9, 0.2, 0.7]} radius={0.04} smoothness={4} position={[0, -0.4, 0]}>
          <meshStandardMaterial color={PRIMARY_GLOW} metalness={0.3} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.04]} />
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.15, 0.03]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.12, 0.18, 3]} />
          <meshStandardMaterial color={PRIMARY} emissive={PRIMARY} emissiveIntensity={0.4} />
        </mesh>
      </Float>
    </group>
  );
};

// 2. Pièce à commander — shopping cart (stylized cube on wheels)
const PropPartsToOrder: PropComponent = () => {
  const ref = useFadeIn();
  return (
    <group ref={ref} position={[1.9, 0.3, 0]}>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
        <RoundedBox args={[0.8, 0.6, 0.6]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color={PRIMARY} metalness={0.4} roughness={0.3} />
        </RoundedBox>
        <mesh position={[-0.3, 0.32, 0]}>
          <boxGeometry args={[0.05, 0.35, 0.05]} />
          <meshStandardMaterial color="#e4e7ec" />
        </mesh>
        <mesh position={[-0.28, -0.4, 0.24]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a1b1f" roughness={0.8} />
        </mesh>
        <mesh position={[0.28, -0.4, 0.24]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a1b1f" roughness={0.8} />
        </mesh>
        <mesh position={[-0.28, -0.4, -0.24]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a1b1f" roughness={0.8} />
        </mesh>
        <mesh position={[0.28, -0.4, -0.24]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a1b1f" roughness={0.8} />
        </mesh>
      </Float>
    </group>
  );
};

// 3. En attente de livraison — package box
const PropAwaitingParts: PropComponent = () => {
  const ref = useFadeIn();
  return (
    <group ref={ref}>
      <Float speed={1.3} rotationIntensity={0.6} floatIntensity={0.4}>
        <RoundedBox args={[0.85, 0.85, 0.85]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#c69a5c" metalness={0.1} roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.43, 0]}>
          <boxGeometry args={[0.88, 0.01, 0.15]} />
          <meshStandardMaterial color={PRIMARY} emissive={PRIMARY} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.43]}>
          <boxGeometry args={[0.15, 0.88, 0.01]} />
          <meshStandardMaterial color={PRIMARY} emissive={PRIMARY} emissiveIntensity={0.3} />
        </mesh>
      </Float>
    </group>
  );
};

// 4. Débuté — floating wrench + rotating gear
const PropInProgress: PropComponent = () => {
  const ref = useFadeIn();
  const gearRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (gearRef.current) gearRef.current.rotation.z += delta * 1.5;
  });

  return (
    <group ref={ref}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={gearRef}>
          <mesh>
            <torusGeometry args={[0.35, 0.12, 12, 24]} />
            <meshStandardMaterial color={WARNING} metalness={0.6} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0]} rotation={[0, 0, angle]}>
                <boxGeometry args={[0.1, 0.2, 0.15]} />
                <meshStandardMaterial color={WARNING} metalness={0.6} roughness={0.3} />
              </mesh>
            );
          })}
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
            <meshStandardMaterial color="#1a1b1f" metalness={0.8} />
          </mesh>
        </group>
        <group position={[0.5, 0.55, 0]} rotation={[0, 0, -0.6]}>
          <mesh>
            <boxGeometry args={[0.08, 0.55, 0.08]} />
            <meshStandardMaterial color="#c4c7d0" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <torusGeometry args={[0.1, 0.04, 8, 16]} />
            <meshStandardMaterial color="#c4c7d0" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

// 5. Terminé — checkmark in a circle
const PropDone: PropComponent = () => {
  const ref = useFadeIn();
  return (
    <group ref={ref}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh>
          <torusGeometry args={[0.55, 0.06, 16, 40]} />
          <meshStandardMaterial color={SUCCESS} emissive={SUCCESS} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[-0.18, -0.05, 0.05]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.28, 0.09, 0.06]} />
          <meshStandardMaterial color={SUCCESS} emissive={SUCCESS} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.05]} rotation={[0, 0, Math.PI / 3]}>
          <boxGeometry args={[0.5, 0.09, 0.06]} />
          <meshStandardMaterial color={SUCCESS} emissive={SUCCESS} emissiveIntensity={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, -0.1]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={SUCCESS} emissive={SUCCESS} emissiveIntensity={0.6} />
            </mesh>
          );
        })}
      </Float>
    </group>
  );
};

// 6. Restitué — checkered flag on a pole
const PropReturned: PropComponent = () => {
  const ref = useFadeIn();
  return (
    <group ref={ref}>
      <Float speed={1.3} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
          <meshStandardMaterial color="#9ba1ad" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.35, 0.45, 0]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshStandardMaterial color="#ffffff" side={2} metalness={0.1} roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => {
            const checker = (row + col) % 2 === 0;
            if (!checker) return null;
            return (
              <mesh
                key={`${row}-${col}`}
                position={[0.08 + col * 0.17, 0.62 - row * 0.12, 0.001]}
              >
                <planeGeometry args={[0.17, 0.12]} />
                <meshStandardMaterial color="#1a1b1f" side={2} />
              </mesh>
            );
          })
        )}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
          <meshStandardMaterial color={PRIMARY} emissive={PRIMARY} emissiveIntensity={0.3} />
        </mesh>
      </Float>
    </group>
  );
};

const PROP_COMPONENTS: PropComponent[] = [
  PropReceived,
  PropPartsToOrder,
  PropAwaitingParts,
  PropInProgress,
  PropDone,
  PropReturned,
];

interface SceneProps {
  index: number;
}

export function SceneProps({ index }: SceneProps) {
  const Prop = PROP_COMPONENTS[index % PROP_COMPONENTS.length];
  return <Prop key={index} />;
}
