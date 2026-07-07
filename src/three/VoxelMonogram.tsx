import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { buildVoxels, mulberry32, VOXEL_SIZE } from './oaGrid';
import { simFrame, composeFromState, pointerOnMonogram, type SimCtx } from './voxelSim';
import { computeGates, createGates, writeFormation, type AnchorSet } from './formation';
import { clamp01, journey, journeyWeights } from './journey';
import { buildCasting } from './formations';
import { emptyAnchor, resolveAnchor } from './anchors';
import { consumePokes, shapeAssembled, shapeDisassembled } from './sectionAnims';
import { createBlastState, igniteBlast, stepBlast, type BlastTrigger } from './blastSim';
import { useVoxelPaint, type PaintMix } from './useVoxelPaint';
import { usePointerNdc } from './usePointerNdc';
import type { Theme } from '../theme/context';

interface Props {
  theme: Theme;
  reduced: boolean;
  /** entrance gate — assembly starts when the page cascade starts */
  playing: boolean;
  /** clicks arrive here as NDC; we answer with a shockwave */
  blastRef: RefObject<BlastTrigger | null>;
}

const lerp = THREE.MathUtils.lerp;

/** anchor ids per section, aligned with the gates arrays */
const SHAPE_IDS = {
  origin: ['origin-grid'],
  craft: ['craft-0', 'craft-1', 'craft-2'],
  work: ['work-0', 'work-1', 'work-2', 'work-3'],
} as const;
const SECTION_KEYS = ['origin', 'craft', 'work'] as const;

export default function VoxelMonogram({ theme, reduced, playing, blastRef }: Props) {
  const voxels = useMemo(() => buildVoxels(), []);
  const casting = useMemo(() => buildCasting(voxels), [voxels]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef(-1);
  const assembledRef = useRef(false);
  const ndcRef = usePointerNdc();
  const pointerVec = useRef(new THREE.Vector3());
  const blastVec = useRef(new THREE.Vector3());
  const fieldPos = useMemo(() => new Float32Array(voxels.length * 3), [voxels]);
  const fieldRot = useMemo(() => new Float32Array(voxels.length * 3), [voxels]);
  const fieldScale = useMemo(() => new Float32Array(voxels.length).fill(1), [voxels]);
  const blast = useRef(createBlastState(voxels.length));
  const rng = useRef(mulberry32(1405));
  const camera = useThree((s) => s.camera);
  const mixRef = useRef<PaintMix>({
    a: new Float32Array(voxels.length),
    h: new Float32Array(voxels.length),
    active: true,
  });
  const anchors = useRef<AnchorSet>({
    origin: [emptyAnchor()],
    craft: [emptyAnchor(), emptyAnchor(), emptyAnchor()],
    work: [emptyAnchor(), emptyAnchor(), emptyAnchor(), emptyAnchor()],
  });
  const gates = useRef(createGates());
  const prevGates = useRef(createGates());
  const ctx = useRef<SimCtx>({
    weights: journeyWeights(journey),
    gates: gates.current,
    anchors: anchors.current,
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

  useVoxelPaint(meshRef, voxels, theme, mixRef);

  useEffect(() => {
    blastRef.current = (ndc) => {
      const group = groupRef.current;
      if (!group || reduced || !assembledRef.current) return;
      // only a coherent shape shatters — never the between-chapters cloud
      if (journeyWeights(journey).scatter > 0.5) return;
      const p = pointerOnMonogram(ndc.x, ndc.y, camera, group, blastVec.current);
      if (p) igniteBlast(blast.current, voxels, fieldPos, fieldRot, p, rng.current);
    };
    return () => {
      blastRef.current = null;
    };
  }, [blastRef, camera, reduced, voxels, fieldPos, fieldRot]);

  useFrame(({ clock, size }, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const j = journey;
    const w = journeyWeights(j);
    const lettersShare = clamp01(j.hero + j.contact);

    // anchor: right of the copy on wide screens (clamped so ultrawide never
    // parks it mid-text), up top on narrow; recede into depth while reading.
    // Section shapes are anchored to their DOM panels and compensate for
    // whatever the group does, so this transform only styles letters+floaters.
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.85;
    const scale = portrait ? Math.min(0.62, aspect * 1.05) : Math.min(0.94, aspect * 0.58);
    const baseY = portrait ? 2.3 : 0.3;
    group.scale.setScalar(scale);
    group.position.x = portrait
      ? 0
      : Math.min(4.41 * aspect - 3.4 * scale - 0.5, aspect * 1.9);
    const recede = (portrait ? -2 : -3.4) * (1 - lettersShare);
    group.position.z = lerp(group.position.z, recede, 0.06);

    const t = clock.elapsedTime;
    if (playing && startRef.current < 0) startRef.current = t;
    const elapsed = reduced ? 99 : startRef.current < 0 ? 0 : t - startRef.current;
    if (elapsed > 1.9) assembledRef.current = true;

    // idle breath + cursor lean — letters only; panel-anchored shapes must
    // not tilt against the page, so the lean fades with the letters' share
    const ndc = ndcRef.current;
    if (!reduced) {
      group.position.y = baseY + Math.sin(t * 0.6) * 0.06;
      const lean = lettersShare * (1 - w.scatter * 0.7);
      group.rotation.y = lerp(group.rotation.y, (ndc?.x ?? 0) * 0.15 * lean, 0.055);
      group.rotation.x = lerp(group.rotation.x, -(ndc?.y ?? 0) * 0.1 * lean, 0.055);
    } else {
      group.position.y = baseY;
    }

    const c = ctx.current;
    c.weights = w;
    c.elapsed = elapsed;
    c.time = reduced ? 0 : t;
    c.reduced = reduced;

    // scroll → build gates; gate milestones start/stop the one-shot demos
    computeGates(j, gates.current);
    for (const key of SECTION_KEYS) {
      const g = gates.current[key];
      const pg = prevGates.current[key];
      for (let k = 0; k < g.length; k++) {
        if (g[k] >= 0.85 && pg[k] < 0.85) shapeAssembled(SHAPE_IDS[key][k], t);
        else if (g[k] <= 0.15 && pg[k] > 0.15) shapeDisassembled(SHAPE_IDS[key][k]);
        pg[k] = g[k];
      }
    }
    consumePokes(t);

    // glue each active section's shapes to their DOM panels
    const cam = camera as THREE.PerspectiveCamera;
    for (const key of SECTION_KEYS) {
      const active = w[key] > 5e-4;
      const set = anchors.current[key];
      const shapes = casting.shapes[key];
      for (let k = 0; k < set.length; k++) {
        if (active) {
          resolveAnchor(
            SHAPE_IDS[key][k],
            shapes[k].box.w,
            shapes[k].box.h,
            cam,
            group,
            size.width,
            size.height,
            set[k],
          );
        } else {
          set[k].ok = false;
        }
      }
    }
    mixRef.current.active = w.origin + w.craft + w.work > 5e-4;

    if (import.meta.env.DEV) {
      (window as unknown as { __oaDebug?: object }).__oaDebug = {
        anchors: anchors.current,
        gates: gates.current,
        weights: w,
      };
    }

    // shatter physics owns the frame while live — magnetizing to the LIVE
    // formation, whatever shape the journey currently wants
    const b = blast.current;
    if (b.active) {
      c.pointer = null;
      writeFormation(voxels, casting, c, fieldPos, fieldRot, fieldScale, mixRef.current.a, mixRef.current.h);
      stepBlast(b, voxels.length, delta, fieldPos, fieldRot);
      composeFromState(mesh, b.pos, b.rot, fieldScale, VOXEL_SIZE);
      return;
    }

    c.pointer =
      ndc && !reduced
        ? pointerOnMonogram(ndc.x, ndc.y, camera, group, pointerVec.current)
        : null;

    simFrame(mesh, voxels, casting, c, VOXEL_SIZE, fieldPos, fieldRot, fieldScale, mixRef.current.a, mixRef.current.h);
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geometry, material, voxels.length]} frustumCulled={false} />
    </group>
  );
}
