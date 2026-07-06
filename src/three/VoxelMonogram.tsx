import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { buildVoxels, mulberry32, VOXEL_SIZE } from './oaGrid';
import { simFrame, composeFromState, pointerOnMonogram, type SimCtx } from './voxelSim';
import { writeFormation, journeyWeights, clamp01, type JourneyState } from './formation';
import { buildFormations } from './formations';
import { createBlastState, igniteBlast, stepBlast, type BlastTrigger } from './blastSim';
import { useVoxelPaint } from './useVoxelPaint';
import { usePointerNdc } from './usePointerNdc';
import type { Theme } from '../theme/context';

interface Props {
  theme: Theme;
  reduced: boolean;
  /** entrance gate — assembly starts when the page cascade starts */
  playing: boolean;
  /** the scroll-driven chapter dials */
  journeyRef: RefObject<JourneyState>;
  /** clicks arrive here as NDC; we answer with a shockwave */
  blastRef: RefObject<BlastTrigger | null>;
}

const lerp = THREE.MathUtils.lerp;

export default function VoxelMonogram({ theme, reduced, playing, journeyRef, blastRef }: Props) {
  const voxels = useMemo(() => buildVoxels(), []);
  const forms = useMemo(() => buildFormations(voxels), [voxels]);
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
  const ctx = useRef<SimCtx>({
    weights: journeyWeights({ hero: 1, flat: 0, arc: 0, sphere: 0, contact: 0 }),
    elapsed: 0,
    time: 0,
    reduced,
    pointer: null,
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

  useVoxelPaint(meshRef, voxels, theme);

  useEffect(() => {
    blastRef.current = (ndc) => {
      const group = groupRef.current;
      if (!group || reduced || !assembledRef.current) return;
      // only a coherent shape shatters — never the between-chapters cloud
      if (journeyWeights(journeyRef.current).scatter > 0.5) return;
      const p = pointerOnMonogram(ndc.x, ndc.y, camera, group, blastVec.current);
      if (p) igniteBlast(blast.current, voxels, fieldPos, fieldRot, p, rng.current);
    };
    return () => {
      blastRef.current = null;
    };
  }, [blastRef, camera, reduced, voxels, fieldPos, fieldRot, journeyRef]);

  useFrame(({ clock, size }, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const j = journeyRef.current;
    const w = journeyWeights(j);

    // anchor: right of the copy on wide screens (clamped so ultrawide never
    // parks it mid-text), up top on narrow; recede into depth while reading
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.85;
    const scale = portrait ? Math.min(0.62, aspect * 1.05) : Math.min(0.94, aspect * 0.58);
    // the ball floats to the top corner, clear of the project copy
    const baseY = (portrait ? 2.3 : 0.3) + (portrait ? 0 : w.sphere * 1.5);
    group.scale.setScalar(scale);
    group.position.x = portrait
      ? 0
      : Math.min(4.41 * aspect - 3.4 * scale - 0.5, aspect * 1.9);
    const recede =
      (portrait ? -2 : -3.4) * (1 - clamp01(j.hero + j.contact)) - w.sphere * 1.3;
    group.position.z = lerp(group.position.z, recede, 0.06);

    const t = clock.elapsedTime;
    if (playing && startRef.current < 0) startRef.current = t;
    const elapsed = reduced ? 99 : startRef.current < 0 ? 0 : t - startRef.current;
    if (elapsed > 1.9) assembledRef.current = true;

    const c = ctx.current;
    c.weights = w;
    c.elapsed = elapsed;
    c.time = t;
    c.reduced = reduced;

    // idle breath + cursor lean — both fade while the cubes travel as a cloud
    const ndc = ndcRef.current;
    const presence = 1 - w.scatter * 0.7;
    if (!reduced) {
      group.position.y = baseY + Math.sin(t * 0.6) * 0.06;
      group.rotation.y = lerp(group.rotation.y, (ndc?.x ?? 0) * 0.15 * presence, 0.055);
      group.rotation.x = lerp(group.rotation.x, -(ndc?.y ?? 0) * 0.1 * presence, 0.055);
    } else {
      group.position.y = baseY;
    }

    // shatter physics owns the frame while live — magnetizing to the LIVE
    // formation, whatever shape the journey currently wants
    const b = blast.current;
    if (b.active) {
      c.pointer = null;
      writeFormation(voxels, forms, c, fieldPos, fieldRot);
      stepBlast(b, voxels.length, delta, fieldPos, fieldRot);
      composeFromState(mesh, b.pos, b.rot, VOXEL_SIZE);
      return;
    }

    c.pointer =
      ndc && !reduced
        ? pointerOnMonogram(ndc.x, ndc.y, camera, group, pointerVec.current)
        : null;

    simFrame(mesh, voxels, forms, c, VOXEL_SIZE, fieldPos, fieldRot);
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geometry, material, voxels.length]} frustumCulled={false} />
    </group>
  );
}
