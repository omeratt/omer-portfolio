import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import type { RefObject } from 'react';
import VoxelMonogram from './VoxelMonogram';
import { SCENE } from './palette';
import { useTheme } from '../theme/useTheme';
import { useMotion } from '../motion/useMotion';
import type { Theme } from '../theme/context';
import type { BlastTrigger } from './blastSim';

/** Renders only while the journey says so — zero GPU when parked. */
function InvalidateWhileActive({ activeRef }: { activeRef: RefObject<boolean> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const tick = () => {
      if (activeRef.current && !document.hidden) invalidate();
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [activeRef, invalidate]);
  return null;
}

function Lights({ theme }: { theme: Theme }) {
  const p = SCENE[theme];
  return (
    <>
      <ambientLight color={p.ambient} intensity={p.ambientIntensity} />
      <directionalLight color={p.key} intensity={p.keyIntensity} position={[4, 8, 7]} />
      <pointLight
        color={p.rim}
        intensity={p.rimIntensity}
        distance={30}
        position={[-6, -3, 6]}
      />
    </>
  );
}

interface Props {
  blastRef: RefObject<BlastTrigger | null>;
  activeRef: RefObject<boolean>;
  onReady: () => void;
}

export default function HeroCanvas({ blastRef, activeRef, onReady }: Props) {
  const { theme } = useTheme();
  const { reduced, ready } = useMotion();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 35, position: [0, 0, 14] }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true, // keeps the theme-toggle view transition honest
          powerPreference: 'high-performance',
        }}
        onCreated={() => onReady()}
      >
        <InvalidateWhileActive activeRef={activeRef} />
        <Lights theme={theme} />
        <VoxelMonogram theme={theme} reduced={reduced} playing={ready} blastRef={blastRef} />
      </Canvas>
    </div>
  );
}
