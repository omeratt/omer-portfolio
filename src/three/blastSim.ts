import type { VoxelSeed } from './oaGrid';

/**
 * Click-to-shatter physics for the monogram. Pure math, no three.js —
 * an impulse radiates from the click point, cubes tumble through a
 * drag-damped free flight, then a magnet wakes in a wave and every cube
 * springs home (slightly underdamped, so the landing reads as a snap).
 */

export interface BlastPoint {
  x: number;
  y: number;
  z: number;
}

export type BlastTrigger = (ndc: { x: number; y: number }) => void;

export interface BlastState {
  pos: Float32Array;
  vel: Float32Array;
  rot: Float32Array;
  rotVel: Float32Array;
  delay: Float32Array; // per-cube magnet wake-up, radiating from the blast
  t: number;
  returning: boolean;
  active: boolean;
}

export function createBlastState(count: number): BlastState {
  return {
    pos: new Float32Array(count * 3),
    vel: new Float32Array(count * 3),
    rot: new Float32Array(count * 3),
    rotVel: new Float32Array(count * 3),
    delay: new Float32Array(count),
    t: 0,
    returning: false,
    active: false,
  };
}

const HOLD = 1.45; // seconds of free flight before the magnet wakes
const DRAG = 2.4; // air drag on velocity — fast burst, then a slow drift
const ROT_DRAG = 1.1; // cubes keep tumbling a little longer than they travel
const STIFF = 46; // return-spring stiffness
const DAMP = 7.4; // underdamped on purpose — one soft overshoot, then rest
const MAX_DT = 1 / 30; // background tabs must not explode the integration

/** Re-igniting mid-flight is allowed: the new impulse rides the current state. */
export function igniteBlast(
  s: BlastState,
  voxels: VoxelSeed[],
  fieldPos: Float32Array,
  fieldRot: Float32Array,
  p: BlastPoint,
  rng: () => number,
) {
  if (!s.active) {
    s.pos.set(fieldPos);
    s.rot.set(fieldRot);
    s.vel.fill(0);
    s.rotVel.fill(0);
  }
  for (let i = 0; i < voxels.length; i++) {
    const i3 = i * 3;
    const dx = s.pos[i3] - p.x;
    const dy = s.pos[i3 + 1] - p.y;
    const dz = s.pos[i3 + 2] - p.z;
    const d = Math.max(0.12, Math.hypot(dx, dy, dz));
    // sharp at the click, long tail — the whole letterform feels the hit
    const power = (voxels[i].orange ? 12.5 : 10) * Math.exp(-d * 0.5) + 1.5 / (0.5 + d);
    s.vel[i3] += (dx / d) * power + (rng() - 0.5) * power * 0.36;
    s.vel[i3 + 1] += (dy / d) * power + (rng() - 0.5) * power * 0.36;
    s.vel[i3 + 2] += (dz / d) * power * 0.55 + (0.3 + rng() * 0.8) * power * 0.5;
    const spin = (0.5 + rng() * 0.6) * power;
    s.rotVel[i3] += (rng() - 0.5) * spin;
    s.rotVel[i3 + 1] += (rng() - 0.5) * spin;
    s.rotVel[i3 + 2] += (rng() - 0.5) * spin;
    s.delay[i] = d * 0.07 + rng() * 0.22;
  }
  s.t = 0;
  s.returning = false;
  s.active = true;
}

/**
 * One integration step. The caller hands in live formation targets each
 * frame, so cubes magnetize to wherever the journey currently wants them —
 * scrolled, flattened, or reassembled — never to a stale home.
 * Returns false once every cube has settled (state flips inactive).
 */
export function stepBlast(
  s: BlastState,
  count: number,
  rawDt: number,
  targetPos: Float32Array,
  targetRot: Float32Array,
): boolean {
  const dt = Math.min(rawDt, MAX_DT);
  s.t += dt;
  if (!s.returning && s.t >= HOLD) s.returning = true;
  const drag = Math.exp(-DRAG * dt);
  const rotDrag = Math.exp(-ROT_DRAG * dt);
  const spring = STIFF * dt;
  const sdamp = Math.exp(-DAMP * dt);
  let done = s.returning;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (s.returning && s.t - HOLD >= s.delay[i]) {
      const tx = targetPos[i3];
      const ty = targetPos[i3 + 1];
      const tz = targetPos[i3 + 2];
      s.vel[i3] = (s.vel[i3] + (tx - s.pos[i3]) * spring) * sdamp;
      s.vel[i3 + 1] = (s.vel[i3 + 1] + (ty - s.pos[i3 + 1]) * spring) * sdamp;
      s.vel[i3 + 2] = (s.vel[i3 + 2] + (tz - s.pos[i3 + 2]) * spring) * sdamp;
      s.rotVel[i3] = (s.rotVel[i3] + (targetRot[i3] - s.rot[i3]) * spring * 0.8) * sdamp;
      s.rotVel[i3 + 1] =
        (s.rotVel[i3 + 1] + (targetRot[i3 + 1] - s.rot[i3 + 1]) * spring * 0.8) * sdamp;
      s.rotVel[i3 + 2] =
        (s.rotVel[i3 + 2] + (targetRot[i3 + 2] - s.rot[i3 + 2]) * spring * 0.8) * sdamp;
      const ex = tx - s.pos[i3];
      const ey = ty - s.pos[i3 + 1];
      const ez = tz - s.pos[i3 + 2];
      const err = ex * ex + ey * ey + ez * ez;
      const speed =
        s.vel[i3] * s.vel[i3] + s.vel[i3 + 1] * s.vel[i3 + 1] + s.vel[i3 + 2] * s.vel[i3 + 2];
      if (err > 1e-4 || speed > 4e-4) done = false;
    } else {
      s.vel[i3] *= drag;
      s.vel[i3 + 1] *= drag;
      s.vel[i3 + 2] *= drag;
      s.rotVel[i3] *= rotDrag;
      s.rotVel[i3 + 1] *= rotDrag;
      s.rotVel[i3 + 2] *= rotDrag;
      done = false;
    }
    s.pos[i3] += s.vel[i3] * dt;
    s.pos[i3 + 1] += s.vel[i3 + 1] * dt;
    s.pos[i3 + 2] += s.vel[i3 + 2] * dt;
    s.rot[i3] += s.rotVel[i3] * dt;
    s.rot[i3 + 1] += s.rotVel[i3 + 1] * dt;
    s.rot[i3 + 2] += s.rotVel[i3 + 2] * dt;
  }

  if (done) s.active = false;
  return s.active;
}
