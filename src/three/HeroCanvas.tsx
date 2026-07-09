import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import type { RefObject } from 'react';
import VoxelMonogram from './VoxelMonogram';
import { SCENE } from './palette';
import { buildVoxels, VOXEL_SIZE } from './oaGrid';
import { underlay } from './underlay';
import { useVoxelPaint, type PaintMix } from './useVoxelPaint';
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

/* ------------------------------------------------------------------ */
/* Back layer — letters, constellation and atmosphere, painted behind  */
/* the page (text rides over it, panels' glass blurs it)               */
/* ------------------------------------------------------------------ */

const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();

function UnderlayVoxels({ theme }: { theme: Theme }) {
  const voxels = useMemo(() => buildVoxels(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lastVersion = useRef(-1);
  const mixRef = useRef<PaintMix>({ a: underlay.mixA, h: underlay.mixH, version: underlay.mixVersion });

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 }),
    [],
  );
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  // mirror the sim-owned mix buffers BEFORE the paint pass runs (useFrame
  // callbacks fire in registration order) — the paint must see the real
  // buffers the moment they exist, never a stale placeholder
  useFrame(() => {
    const m = mixRef.current;
    m.a = underlay.mixA;
    m.h = underlay.mixH;
    m.version = underlay.mixVersion;
  });

  useVoxelPaint(meshRef, voxels, theme, mixRef);

  useFrame(() => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;
    const ul = underlay;
    if (!ul.active || ul.count === 0 || ul.pos.length === 0) {
      mesh.count = 0;
      return;
    }
    mesh.count = ul.count;
    if (ul.version === lastVersion.current) return;
    lastVersion.current = ul.version;

    group.position.set(ul.gx, ul.gy, ul.gz);
    group.scale.setScalar(ul.gs);
    group.rotation.set(ul.rx, ul.ry, 0);

    for (let i = 0; i < ul.count; i++) {
      const i3 = i * 3;
      const s = VOXEL_SIZE * ul.back[i];
      E.set(ul.rot[i3], ul.rot[i3 + 1], ul.rot[i3 + 2]);
      Q.setFromEuler(E);
      P.set(ul.pos[i3], ul.pos[i3 + 1], ul.pos[i3 + 2]);
      S.set(s, s, s);
      M.compose(P, Q, S);
      mesh.setMatrixAt(i, M);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, voxels.length]}
        frustumCulled={false}
      />
    </group>
  );
}

interface UnderlayProps {
  activeRef: RefObject<boolean>;
  onReady: () => void;
}

/** The behind-the-page canvas — the monogram's original home, full quality. */
export function UnderlayCanvas({ activeRef, onReady }: UnderlayProps) {
  const { theme } = useTheme();

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
        <UnderlayVoxels theme={theme} />
      </Canvas>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Front layer — assembled shapes only, crisp above the glass panels.  */
/* Also the sim's home: its frame loop drives both layers' buffers.    */
/* ------------------------------------------------------------------ */

interface Props {
  blastRef: RefObject<BlastTrigger | null>;
  activeRef: RefObject<boolean>;
}

export default function HeroCanvas({ blastRef, activeRef }: Props) {
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
      >
        <InvalidateWhileActive activeRef={activeRef} />
        <Lights theme={theme} />
        <VoxelMonogram theme={theme} reduced={reduced} playing={ready} blastRef={blastRef} />
      </Canvas>
    </div>
  );
}
