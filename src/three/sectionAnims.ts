import gsap from 'gsap';
import '../motion/easings'; // registers the house eases (snap / arc / rebound)
import {
  PART_BALL,
  PART_IND,
  PART_KNOB,
  PART_PACKET,
  PART_PULSE,
  PART_SQUARE,
  PAG_XS,
  PLAY_SQUARES,
  type ShapeDef,
  type ShapePoint,
} from './sectionShapes';

/**
 * The shape-internal animations — every original motif's motion, re-expressed
 * as pure functions of the clock. No tweens, no per-frame bookkeeping: the
 * same time always produces the same pose, so scrubbing, blasting mid-flight
 * and tab-switching all stay coherent.
 */

export interface AnimOut {
  dx: number;
  dy: number;
  dz: number;
  scale: number;
}

const snapEase = gsap.parseEase('snap');
const arcEase = gsap.parseEase('arc');
const cubeIn = (t: number) => t * t * t;
const cubeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const frac = (v: number) => v - Math.floor(v);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* --------------------------------------------------------------- */
/* Replay epochs — when did this shape's one-shot demo last start?  */
/* --------------------------------------------------------------- */

const epochs = new Map<string, number>();
const pokes = new Set<string>();

/** Hovering / tapping replay on a card lands here (DOM side). */
export function pokeShape(id: string) {
  pokes.add(id);
}

/** Called once per frame by the sim: pokes become epochs at sim time. */
export function consumePokes(time: number) {
  for (const id of pokes) epochs.set(id, time);
  pokes.clear();
}

/** The sim announces assembly milestones so demos auto-play on build. */
export function shapeAssembled(id: string, time: number) {
  if (!epochs.has(id)) epochs.set(id, time);
}

export function shapeDisassembled(id: string) {
  epochs.delete(id);
}

/* --------------------------------------------------------------- */

const GRAPH_SPAN = 168;
const graphDX = (p: number) => p * GRAPH_SPAN;
const graphDY = (v: number) => -v * 64; // design y is SVG-down

/** ball / knob progress for an easing card: run once per epoch, rest after */
function cardP(id: string, time: number, reduced: boolean): number {
  if (reduced) return 1;
  const epoch = epochs.get(id);
  if (epoch === undefined) return 0;
  return clamp01((time - epoch - 0.15) / 1.4);
}

/* pagination indicator timeline — cumulative seconds, loops */
const PAG_LOOP = 6.84;
const at = (i: number) => PAG_XS[i];

// poses are pure functions of the clock, and every voxel of a shape asks for
// the same frame — memoize per time so the hot loop allocates nothing
const PAG_POSE = { cx: 0, w: 12, alpha: 1, lift: 0 };
let pagTime = Number.NaN;

function paginationPose(time: number, reduced: boolean) {
  const key = reduced ? -1 : time;
  if (key === pagTime) return PAG_POSE;
  pagTime = key;
  const t = reduced ? 0 : frac(time / PAG_LOOP) * PAG_LOOP;
  let cx = at(0);
  let w = 12;
  let alpha = 1;
  let lift = 0;
  if (t < 0.6) {
    /* rest at dot 0 */
  } else if (t < 1.15) {
    cx = at(0) + (at(1) - at(0)) * snapEase((t - 0.6) / 0.55);
  } else if (t < 1.7) {
    cx = at(1);
  } else if (t < 1.98) {
    const p = cubeIn((t - 1.7) / 0.28); // liquid: pour toward the next dot
    cx = at(1) + 15 * p;
    w = 12 + 30 * p;
  } else if (t < 2.36) {
    const p = snapEase((t - 1.98) / 0.38); // …then snap tight
    cx = 85 + 15 * p;
    w = 42 - 30 * p;
  } else if (t < 2.91) {
    cx = at(2);
  } else if (t < 3.13) {
    cx = at(2);
    alpha = 1 - (t - 2.91) / 0.22; // fade out here…
  } else if (t < 3.39) {
    cx = at(3);
    alpha = (t - 3.13) / 0.26; // …reappear there
  } else if (t < 3.89) {
    cx = at(3);
  } else if (t < 4.39) {
    const p = (t - 3.89) / 0.5; // arc hop to the last dot
    cx = at(3) + (at(4) - at(3)) * arcEase(p);
    lift = Math.sin(Math.PI * clamp01(p)) * 9;
  } else if (t < 5.09) {
    cx = at(4);
  } else if (t < 5.84) {
    cx = at(4) + (at(0) - at(4)) * snapEase((t - 5.09) / 0.75); // long glide home
  }
  PAG_POSE.cx = cx;
  PAG_POSE.w = w;
  PAG_POSE.alpha = alpha;
  PAG_POSE.lift = lift;
  return PAG_POSE;
}

/* play squares — anticipation, flight, squash & stretch, settle */
const PLAY_LOOP = 3.0;

const SQ_POSES = PLAY_SQUARES.map(() => ({ y: 0, sx: 1, sy: 1 }));
let sqTime = Number.NaN;

function squarePose(k: number, time: number, reduced: boolean) {
  const key = reduced ? -1 : time;
  if (key !== sqTime) {
    sqTime = key;
    for (let i = 0; i < SQ_POSES.length; i++) computeSquarePose(i, time, reduced, SQ_POSES[i]);
  }
  return SQ_POSES[k];
}

function computeSquarePose(
  k: number,
  time: number,
  reduced: boolean,
  out: { y: number; sx: number; sy: number },
) {
  let y = 0;
  let sx = 1;
  let sy = 1;
  out.y = y;
  out.sx = sx;
  out.sy = sy;
  if (reduced) return;
  const t = frac(time / PLAY_LOOP) * PLAY_LOOP - k * 0.15;
  if (t < 0 || t >= 1.05) return;
  if (t < 0.12) {
    sy = 1 - 0.16 * cubeIn(t / 0.12);
  } else if (t < 0.34) {
    const p = cubeOut((t - 0.12) / 0.22);
    y = -10 * p;
    sy = 0.84 + 0.21 * p;
  } else if (t < 0.54) {
    const p = cubeIn((t - 0.34) / 0.2);
    y = -10 * (1 - p);
    sy = 1.05 - 0.05 * p;
  } else if (t < 0.63) {
    const p = (t - 0.54) / 0.09;
    sy = 1 - 0.2 * p;
    sx = 1 + 0.14 * p;
  } else {
    const p = arcEase((t - 0.63) / 0.42);
    sy = 0.8 + 0.2 * p;
    sx = 1.14 - 0.14 * p;
  }
  out.y = y;
  out.sx = sx;
  out.sy = sy;
}

/* --------------------------------------------------------------- */

/**
 * Design-space adjustment for one assembled point. `out` is reused by the
 * caller — this runs for every assigned voxel every frame.
 */
export function evalAnim(
  shape: ShapeDef,
  p: ShapePoint,
  time: number,
  reduced: boolean,
  out: AnimOut,
): void {
  out.dx = 0;
  out.dy = 0;
  out.dz = 0;
  out.scale = 1;

  switch (p.part) {
    case PART_BALL: {
      const prog = cardP(shape.id, time, reduced);
      const v = shape.ease ? shape.ease(prog) : prog;
      out.dx = graphDX(prog);
      out.dy = graphDY(v);
      break;
    }
    case PART_KNOB: {
      const prog = cardP(shape.id, time, reduced);
      const v = shape.ease ? shape.ease(prog) : prog;
      out.dx = v * p.b;
      break;
    }
    case PART_PACKET: {
      if (reduced) {
        out.dx = 36 + p.t * 30; // parked, evenly spread across the lanes
        break;
      }
      out.dx = frac(time / p.a - p.b) * 192;
      break;
    }
    case PART_SQUARE: {
      const sq = PLAY_SQUARES[p.a];
      const pose = squarePose(p.a, time, reduced);
      const bottom = sq.cy + 14; // squash pivots at the square's feet
      out.dx = (p.x - sq.cx) * (pose.sx - 1);
      out.dy = (p.y - bottom) * (pose.sy - 1) + pose.y;
      break;
    }
    case PART_IND: {
      const pose = paginationPose(time, reduced);
      const target = pose.cx + (p.t - 0.5) * (pose.w - 6);
      out.dx = target - p.x;
      out.dy = -pose.lift;
      out.scale = Math.max(0, pose.alpha) * (0.85 + 0.15 * pose.alpha);
      break;
    }
    case PART_PULSE: {
      if (reduced) break;
      const q = frac(time / 2.1);
      // heartbeat: swell fast, ease back, rest — the branch is still open
      out.scale = q < 0.62 ? 1 + 0.5 * Math.sin(Math.PI * (q / 0.62)) ** 2 : 1;
      break;
    }
  }
}
