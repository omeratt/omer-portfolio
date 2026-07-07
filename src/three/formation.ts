import type { VoxelSeed } from './oaGrid';
import type { Formations } from './formations';

/**
 * The monogram's journey, one dial per chapter (all scroll-driven):
 * letters in the hero → flat 2022 grid at Origin → a shot-arc at Craft →
 * a spinning ball at Work → letters again at Contact. Whenever no chapter
 * claims the cubes, they hold a loose constellation between shapes.
 */
export interface JourneyState {
  hero: number;
  flat: number;
  arc: number;
  sphere: number;
  contact: number;
}

export interface JourneyWeights {
  letters: number;
  flat: number;
  arc: number;
  sphere: number;
  scatter: number;
  heroPart: number;
  contactPart: number;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Normalize the dials into blend weights; the remainder is constellation. */
export function journeyWeights(j: JourneyState): JourneyWeights {
  let letters = clamp01(j.hero + j.contact);
  let flat = clamp01(j.flat);
  let arc = clamp01(j.arc);
  let sphere = clamp01(j.sphere);
  const sum = letters + flat + arc + sphere;
  if (sum > 1) {
    letters /= sum;
    flat /= sum;
    arc /= sum;
    sphere /= sum;
  }
  return {
    letters,
    flat,
    arc,
    sphere,
    scatter: 1 - Math.min(1, sum),
    heroPart: j.hero,
    contactPart: j.contact,
  };
}

export interface FormationCtx {
  weights: JourneyWeights;
  /** seconds since the entrance assembly began */
  elapsed: number;
  /** absolute clock — drives the constellation breath, arc wave, ball spin */
  time: number;
  reduced: boolean;
}

/** Slightly-overshooting settle — each cube lands like it has weight. */
export function backOut(t: number) {
  const c = 1.70158 * 0.82;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export function settleOf(v: VoxelSeed, ctx: FormationCtx) {
  const a = ctx.reduced ? 1 : clamp01((ctx.elapsed - v.delay) / 0.9);
  return a >= 1 ? 1 : a <= 0 ? 0 : backOut(a);
}

/**
 * Where every cube wants to be this frame. The single source of truth:
 * the live sim renders it, and a mid-flight blast magnetizes back to it.
 */
export function writeFormation(
  voxels: VoxelSeed[],
  forms: Formations,
  ctx: FormationCtx,
  outPos: Float32Array,
  outRot: Float32Array,
) {
  const w = ctx.weights;
  // the exhale between chapters: the deeper the scatter, the wider the
  // cloud ranges and the more it breathes
  const spread = 0.28 + w.scatter * 0.3;
  const wob = w.scatter * 0.34;
  const spin = ctx.time * 0.22;
  const cosS = Math.cos(spin);
  const sinS = Math.sin(spin);

  for (let i = 0; i < voxels.length; i++) {
    const i3 = i * 3;
    const v = voxels[i];
    const settle = settleOf(v, ctx);
    const entrance = 1 - settle;

    // constellation: a breathing cloud around home
    const wx = wob === 0 ? 0 : Math.sin(ctx.time * (0.5 + v.bias * 0.4) + v.delay * 31) * wob;
    const wy = wob === 0 ? 0 : Math.cos(ctx.time * (0.42 + v.bias * 0.33) + v.delay * 47) * wob;
    const scx = v.x + v.sx * spread + wx;
    const scy = v.y + v.sy * spread + wy;
    const scz = v.z + v.sz * spread;

    // the ball spins in place; a wave travels along the arc
    const sphX = forms.sphere[i3] * cosS + forms.sphere[i3 + 2] * sinS;
    const sphZ = -forms.sphere[i3] * sinS + forms.sphere[i3 + 2] * cosS;
    const wave = w.arc === 0 ? 0 : Math.sin(ctx.time * 1.7 + forms.arcT[i] * 6.5) * 0.1;

    outPos[i3] =
      w.letters * v.x + w.flat * forms.flat[i3] + w.arc * forms.arc[i3] +
      w.sphere * sphX + w.scatter * scx + entrance * v.sx;
    outPos[i3 + 1] =
      w.letters * v.y + w.flat * forms.flat[i3 + 1] +
      w.arc * (forms.arc[i3 + 1] + wave) +
      w.sphere * forms.sphere[i3 + 1] + w.scatter * scy + entrance * v.sy;
    outPos[i3 + 2] =
      w.letters * v.z + w.flat * forms.flat[i3 + 2] + w.arc * forms.arc[i3 + 2] +
      w.sphere * sphZ + w.scatter * scz + entrance * v.sz;

    const r = clamp01(w.scatter + entrance) * 0.9 + w.sphere * 0.12;
    outRot[i3] = v.rx * r;
    outRot[i3 + 1] = v.ry * r;
    outRot[i3 + 2] = v.rz * r;
  }
}
