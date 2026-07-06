import type { VoxelSeed } from './oaGrid';

/**
 * The monogram's journey across the page, as three scroll-driven dials:
 *
 *   loosen   0 letters … 1 a loose constellation drifting beside the story
 *   flatten  0 volume  … 1 the flat 2022 grid (peaks beside the homage)
 *   contact  0 …          1 pulled back together for the sign-off
 *
 * Whole → loosened → flat (the memory) → whole again. The scroll is the story.
 */
export interface JourneyState {
  loosen: number;
  flatten: number;
  contact: number;
}

export interface FormationCtx extends JourneyState {
  /** seconds since the entrance assembly began */
  elapsed: number;
  /** absolute clock — drives the constellation's slow breath */
  time: number;
  reduced: boolean;
}

/** How dissolved the letterform effectively is right now (0 = readable). */
export const effLoosen = (j: JourneyState) =>
  j.loosen * (1 - j.flatten * 0.88) * (1 - j.contact);

/** Slightly-overshooting settle — each cube lands like it has weight. */
export function backOut(t: number) {
  const c = 1.70158 * 0.82;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function settleOf(v: VoxelSeed, ctx: FormationCtx) {
  const a = ctx.reduced ? 1 : clamp01((ctx.elapsed - v.delay) / 0.9);
  return a >= 1 ? 1 : a <= 0 ? 0 : backOut(a);
}

/**
 * Where every cube wants to be this frame — position and rotation.
 * This is the single source of truth: the live sim renders it directly,
 * and a mid-flight blast magnetizes back to exactly these targets.
 */
export function writeFormation(
  voxels: VoxelSeed[],
  ctx: FormationCtx,
  outPos: Float32Array,
  outRot: Float32Array,
) {
  const L = effLoosen(ctx);
  const flat = ctx.flatten * (1 - ctx.contact);
  const wob = L * 0.22;
  const zSquash = 1 - 0.94 * flat;
  const scatterZ = 1 - 0.85 * flat;
  const rotDamp = 1 - 0.9 * flat;

  for (let i = 0; i < voxels.length; i++) {
    const i3 = i * 3;
    const v = voxels[i];
    const settle = settleOf(v, ctx);
    // entrance scatter at full throw; the journey cloud stays close to home
    const drift = 1 - settle + L * 0.5 * v.bias;

    // per-cube breath — phases seeded from the cube's own delay/bias
    const wx = wob === 0 ? 0 : Math.sin(ctx.time * (0.5 + v.bias * 0.4) + v.delay * 31) * wob;
    const wy = wob === 0 ? 0 : Math.cos(ctx.time * (0.42 + v.bias * 0.33) + v.delay * 47) * wob;

    outPos[i3] = v.x + v.sx * drift + wx;
    outPos[i3 + 1] = v.y + v.sy * drift + wy;
    outPos[i3 + 2] = v.z * zSquash + v.sz * drift * scatterZ;

    const r = drift * rotDamp;
    outRot[i3] = v.rx * r;
    outRot[i3 + 1] = v.ry * r;
    outRot[i3 + 2] = v.rz * r;
  }
}
