import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { SCENE } from './palette';
import type { VoxelSeed } from './oaGrid';
import type { Theme } from '../theme/context';

export interface PaintMix {
  /** per-voxel blend toward the accent orange (0..1) */
  a: Float32Array;
  /** per-voxel blend toward the 2022 heritage yellow (0..1) */
  h: Float32Array;
  /** the sim raises this whenever section shapes are coloring cubes */
  active: boolean;
}

const TMP = new THREE.Color();

/**
 * Per-instance colors. Two inputs meet here: the theme palette (which glides
 * on toggle) and the per-voxel role mix written by the formation each frame —
 * accent packets, heritage grid cells, orange flecks in the letters.
 */
export function useVoxelPaint(
  meshRef: RefObject<THREE.InstancedMesh | null>,
  voxels: VoxelSeed[],
  theme: Theme,
  mixRef: RefObject<PaintMix>,
) {
  const paint = useRef({
    cube: new THREE.Color(SCENE[theme].cube),
    orange: new THREE.Color(SCENE[theme].orange),
    heritage: new THREE.Color(SCENE[theme].heritage),
    dirty: true,
    wasActive: true,
  });
  const targetCube = useMemo(() => new THREE.Color(SCENE[theme].cube), [theme]);
  const targetOrange = useMemo(() => new THREE.Color(SCENE[theme].orange), [theme]);
  const targetHeritage = useMemo(() => new THREE.Color(SCENE[theme].heritage), [theme]);

  useEffect(() => {
    paint.current.dirty = true;
  }, [theme]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const p = paint.current;
    const mix = mixRef.current;
    // repaint while the theme glides, while shapes color cubes, and one
    // extra frame after they let go (to restore the resting palette)
    if (!mesh || (!p.dirty && !mix.active && !p.wasActive)) return;
    p.wasActive = mix.active;

    if (p.dirty) {
      const k = Math.min(1, delta * 5);
      p.cube.lerp(targetCube, k);
      p.orange.lerp(targetOrange, k);
      p.heritage.lerp(targetHeritage, k);
      const done =
        Math.abs(p.cube.r - targetCube.r) + Math.abs(p.cube.g - targetCube.g) < 0.004;
      if (done) {
        p.cube.copy(targetCube);
        p.orange.copy(targetOrange);
        p.heritage.copy(targetHeritage);
        p.dirty = false;
      }
    }

    for (let i = 0; i < voxels.length; i++) {
      TMP.copy(p.cube);
      const a = mix.a[i];
      const h = mix.h[i];
      if (a > 0.001) TMP.lerp(p.orange, Math.min(1, a));
      if (h > 0.001) TMP.lerp(p.heritage, Math.min(1, h));
      mesh.setColorAt(i, TMP);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
}
