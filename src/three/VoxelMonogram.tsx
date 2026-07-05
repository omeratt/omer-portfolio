import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { buildVoxels, VOXEL_SIZE } from './oaGrid';
import { SCENE } from './palette';
import { simFrame, pointerOnMonogram } from './voxelSim';
import type { Theme } from '../theme/context';

interface Props {
  theme: Theme;
  reduced: boolean;
  /** entrance gate — assembly starts when the page cascade starts */
  playing: boolean;
  /** 0 assembled … 1 scattered, scrubbed by the hero's scroll progress */
  disperseRef: RefObject<number>;
}

const lerp = THREE.MathUtils.lerp;

export default function VoxelMonogram({ theme, reduced, playing, disperseRef }: Props) {
  const voxels = useMemo(() => buildVoxels(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef(-1);
  const ndcRef = useRef<{ x: number; y: number } | null>(null);
  const pointerVec = useRef(new THREE.Vector3());
  const paint = useRef({
    cube: new THREE.Color(SCENE[theme].cube),
    orange: new THREE.Color(SCENE[theme].orange),
    dirty: true,
  });

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 }),
    [],
  );
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const targetCube = useMemo(() => new THREE.Color(SCENE[theme].cube), [theme]);
  const targetOrange = useMemo(() => new THREE.Color(SCENE[theme].orange), [theme]);
  useEffect(() => {
    paint.current.dirty = true;
  }, [theme]);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      ndcRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(({ clock, camera, size }, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    // responsive placement: anchored right of the copy on wide screens
    // (the canvas mask ghosts whatever passes under the text), above it on narrow
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.85;
    // portrait: letters rise behind the copy from the top of the viewport —
    // the stage mask ghosts whatever passes behind the text
    const scale = portrait ? Math.min(0.62, aspect * 1.05) : Math.min(0.94, aspect * 0.58);
    const baseY = portrait ? 2.3 : 0.3;
    group.scale.setScalar(scale);
    group.position.x = portrait ? 0 : Math.min(3.1, aspect * 1.9);

    const t = clock.elapsedTime;
    if (playing && startRef.current < 0) startRef.current = t;
    const elapsed = reduced ? 99 : startRef.current < 0 ? 0 : t - startRef.current;

    // idle: a slow breath and a lean toward the cursor
    const ndc = ndcRef.current;
    if (!reduced) {
      group.position.y = baseY + Math.sin(t * 0.6) * 0.06;
      group.rotation.y = lerp(group.rotation.y, (ndc?.x ?? 0) * 0.15, 0.055);
      group.rotation.x = lerp(group.rotation.x, -(ndc?.y ?? 0) * 0.1, 0.055);
    } else {
      group.position.y = baseY;
    }

    const pointer =
      ndc && !reduced
        ? pointerOnMonogram(ndc.x, ndc.y, camera, group, pointerVec.current)
        : null;

    simFrame(
      mesh,
      voxels,
      { elapsed, disperse: disperseRef.current, pointer, reduced },
      VOXEL_SIZE,
    );

    // theme swap: instance colors glide to the new palette
    const p = paint.current;
    if (p.dirty) {
      const k = Math.min(1, delta * 5);
      p.cube.lerp(targetCube, k);
      p.orange.lerp(targetOrange, k);
      const done =
        Math.abs(p.cube.r - targetCube.r) + Math.abs(p.cube.g - targetCube.g) < 0.004;
      if (done) {
        p.cube.copy(targetCube);
        p.orange.copy(targetOrange);
        p.dirty = false;
      }
      for (let i = 0; i < voxels.length; i++) {
        mesh.setColorAt(i, voxels[i].orange ? p.orange : p.cube);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geometry, material, voxels.length]} frustumCulled={false} />
    </group>
  );
}
