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
  /** mirror of underlay.mixVersion — the sim bumps it only when a mix value
   *  actually changed, so idle frames repaint nothing */
  version: number;
}

const TMP = new THREE.Color();

/**
 * Per-instance colors. Two inputs meet here: the theme palette (which glides
 * on toggle) and the per-voxel role mix written by the formation — accent
 * packets, heritage grid cells, orange flecks in the letters.
 *
 * Repaints happen only when something can differ from what's on the GPU:
 * the theme glide, a mix-version bump, or the mix buffers changing identity
 * (the back canvas starts on empty placeholders until the sim wires the real
 * ones — painting must never go idle before valid data existed).
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
  });
  const seen = useRef<{ version: number; a: Float32Array | null }>({
    version: -1,
    a: null,
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
    if (!mesh) return;
    const valid = mix.a.length === voxels.length && mix.h.length === voxels.length;
    const changed = mix.version !== seen.current.version || mix.a !== seen.current.a;
    if (!p.dirty && !(changed && valid)) return;

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

    const firstPaint = mesh.instanceColor === null;
    for (let i = 0; i < voxels.length; i++) {
      TMP.copy(p.cube);
      if (valid) {
        const a = mix.a[i];
        const h = mix.h[i];
        if (a > 0.001) TMP.lerp(p.orange, Math.min(1, a));
        if (h > 0.001) TMP.lerp(p.heritage, Math.min(1, h));
      }
      mesh.setColorAt(i, TMP);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      // the first setColorAt created the attribute — if the material already
      // compiled without it, the program must rebuild or colors stay ignored
      if (firstPaint) (mesh.material as THREE.Material).needsUpdate = true;
    }

    // only a paint with real data counts as consumed — placeholder paints
    // keep the version pending so the first valid frame repaints
    if (valid) {
      seen.current.version = mix.version;
      seen.current.a = mix.a;
    }
  });
}
