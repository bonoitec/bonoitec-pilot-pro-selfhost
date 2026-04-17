import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group } from "three";

interface Phone3DProps {
  sceneIndex: number;
  reducedMotion: boolean;
}

const SCREEN_HUES = [245, 245, 260, 36, 152, 280];

export function Phone3D({ sceneIndex, reducedMotion }: Phone3DProps) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    if (reducedMotion) {
      group.current.rotation.set(0, 0, 0);
      group.current.position.set(0, 0, 0);
      return;
    }
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 1.3) * 0.55;
    group.current.rotation.x = Math.sin(t * 0.8) * 0.12;
    group.current.position.y = Math.sin(t * 1.5) * 0.12;
  });

  const hue = SCREEN_HUES[sceneIndex % SCREEN_HUES.length];
  const emissiveColor = `hsl(${hue}, 82%, 60%)`;

  return (
    <group ref={group}>
      <RoundedBox args={[1.45, 2.9, 0.18]} radius={0.16} smoothness={6}>
        <meshStandardMaterial
          color="#14171d"
          metalness={0.75}
          roughness={0.28}
        />
      </RoundedBox>

      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[1.28, 2.65]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.22, 0.102]}>
        <planeGeometry args={[0.45, 0.085]} />
        <meshStandardMaterial color="#0a0b0e" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.22, 0.105]}>
        <circleGeometry args={[0.024, 24]} />
        <meshStandardMaterial color="#2a2f3a" roughness={0.5} />
      </mesh>

      <mesh position={[-0.62, 1.26, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.08, 16]} />
        <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.3} />
      </mesh>

      <mesh position={[-0.52, 1.26, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.08, 16]} />
        <meshStandardMaterial color="#2a2f3a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
