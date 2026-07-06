import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { SCENE } from './palette';
import type { VoxelSeed } from './oaGrid';
import type { Theme } from '../theme/context';

/** Per-instance colors that glide to the new palette on theme change. */
export function useVoxelPaint(
  meshRef: RefObject<THREE.InstancedMesh | null>,
  voxels: VoxelSeed[],
  theme: Theme,
) {
  const paint = useRef({
    cube: new THREE.Color(SCENE[theme].cube),
    orange: new THREE.Color(SCENE[theme].orange),
    dirty: true,
  });
  const targetCube = useMemo(() => new THREE.Color(SCENE[theme].cube), [theme]);
  const targetOrange = useMemo(() => new THREE.Color(SCENE[theme].orange), [theme]);

  useEffect(() => {
    paint.current.dirty = true;
  }, [theme]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const p = paint.current;
    if (!mesh || !p.dirty) return;
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
  });
}
