import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { buildVoxels, mulberry32, VOXEL_SIZE } from './oaGrid';
import { simFrame, composeFromState, pointerOnMonogram } from './voxelSim';
import { createBlastState, igniteBlast, stepBlast, type BlastTrigger } from './blastSim';
import { useVoxelPaint } from './useVoxelPaint';
import { usePointerNdc } from './usePointerNdc';
import type { Theme } from '../theme/context';

interface Props {
  theme: Theme;
  reduced: boolean;
  /** entrance gate — assembly starts when the page cascade starts */
  playing: boolean;
  /** 0 assembled … 1 scattered, scrubbed by the hero's scroll progress */
  disperseRef: RefObject<number>;
  /** the hero hands clicks in here as NDC; we answer with a shockwave */
  blastRef: RefObject<BlastTrigger | null>;
}

const lerp = THREE.MathUtils.lerp;

export default function VoxelMonogram({ theme, reduced, playing, disperseRef, blastRef }: Props) {
  const voxels = useMemo(() => buildVoxels(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef(-1);
  const assembledRef = useRef(false);
  const ndcRef = usePointerNdc();
  const pointerVec = useRef(new THREE.Vector3());
  const blastVec = useRef(new THREE.Vector3());
  const fieldPos = useMemo(() => new Float32Array(voxels.length * 3), [voxels]);
  const fieldRot = useMemo(() => new Float32Array(voxels.length * 3), [voxels]);
  const blast = useRef(createBlastState(voxels.length));
  const rng = useRef(mulberry32(1405));
  const camera = useThree((s) => s.camera);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 }),
    [],
  );
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useVoxelPaint(meshRef, voxels, theme);

  useEffect(() => {
    blastRef.current = (ndc) => {
      const group = groupRef.current;
      if (!group || reduced || !assembledRef.current) return;
      if (disperseRef.current > 0.5) return; // mostly scrolled away — nothing to shatter
      const p = pointerOnMonogram(ndc.x, ndc.y, camera, group, blastVec.current);
      if (p) igniteBlast(blast.current, voxels, fieldPos, fieldRot, p, rng.current);
    };
    return () => {
      blastRef.current = null;
    };
  }, [blastRef, camera, reduced, voxels, fieldPos, fieldRot, disperseRef]);

  useFrame(({ clock, size }, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    // responsive placement: anchored right of the copy on wide screens
    // (the canvas mask ghosts whatever passes under the text), above it on narrow
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.85;
    const scale = portrait ? Math.min(0.62, aspect * 1.05) : Math.min(0.94, aspect * 0.58);
    const baseY = portrait ? 2.3 : 0.3;
    group.scale.setScalar(scale);
    group.position.x = portrait ? 0 : Math.min(3.1, aspect * 1.9);

    const t = clock.elapsedTime;
    if (playing && startRef.current < 0) startRef.current = t;
    const elapsed = reduced ? 99 : startRef.current < 0 ? 0 : t - startRef.current;
    if (elapsed > 1.9) assembledRef.current = true;

    // idle: a slow breath and a lean toward the cursor
    const ndc = ndcRef.current;
    if (!reduced) {
      group.position.y = baseY + Math.sin(t * 0.6) * 0.06;
      group.rotation.y = lerp(group.rotation.y, (ndc?.x ?? 0) * 0.15, 0.055);
      group.rotation.x = lerp(group.rotation.x, -(ndc?.y ?? 0) * 0.1, 0.055);
    } else {
      group.position.y = baseY;
    }

    // shatter physics owns the frame while it's live
    const b = blast.current;
    if (b.active) {
      stepBlast(b, voxels, delta, disperseRef.current);
      composeFromState(mesh, b.pos, b.rot, VOXEL_SIZE);
      return;
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
      fieldPos,
      fieldRot,
    );
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geometry, material, voxels.length]} frustumCulled={false} />
    </group>
  );
}
