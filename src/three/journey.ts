/**
 * The scroll journey, as shared mutable state — written by ScrollTriggers
 * (VoxelJourney owns the section dials, each Work panel owns its own build
 * gate), read every frame by the voxel sim. A plain singleton keeps the
 * wiring flat: no React re-renders, no prop drilling across the lazy chunk.
 *
 *   hero / contact   the OA letters claim (unchanged from v1)
 *   origin/craft/work  plateau claims — how strongly the section owns the swarm
 *   originShape / craftShapes / workShapes — per-panel build progress, each
 *   scrubbed by its own panel's trigger so a shape never tears down while
 *   its panel is still the thing the user is looking at (desktop AND mobile)
 */
export interface JourneyState {
  hero: number;
  contact: number;
  origin: number;
  craft: number;
  work: number;
  originShape: number;
  craftShapes: [number, number, number];
  workShapes: [number, number, number, number];
}

export function createJourney(): JourneyState {
  return {
    hero: 1,
    contact: 0,
    origin: 0,
    craft: 0,
    work: 0,
    originShape: 0,
    craftShapes: [0, 0, 0],
    workShapes: [0, 0, 0, 0],
  };
}

/** The one live journey — every writer and the sim share this object. */
export const journey = createJourney();

/* ------------------------------------------------------------------ */
/* Build gates — panel progress → assembly. Lives here (three-free) so */
/* both the sim and main-bundle DOM code (text reveals synced to a     */
/* shape's completion) share one source of truth.                      */
/* ------------------------------------------------------------------ */

export interface SectionGates {
  origin: number[];
  craft: number[];
  work: number[];
}

export const createGates = (): SectionGates => ({
  origin: [0],
  craft: [0, 0, 0],
  work: [0, 0, 0, 0],
});

/**
 * Panel progress → build gate: a short dead zone while the panel is barely
 * on screen, a long build window so the assembly is something you watch,
 * a WIDE hold plateau (a finished shape sits assembled for a real stretch
 * of scroll), and a release only once the panel itself is leaving.
 * origin + craft ride long/staggered triggers, so their builds finish
 * sooner (p≈0.44) than the work panels (p≈0.54).
 */
interface GateCurve {
  start: number;
  span: number;
  release: number;
}

/** touch devices scroll in flicks + inertia — the build there finishes a
 *  touch later, so shapes are still alive when the glide settles */
const COARSE =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const GATE: Record<'origin' | 'craft' | 'work', GateCurve> = {
  origin: { start: 0.1, span: 0.34, release: 0.15 },
  craft: { start: 0.1, span: COARSE ? 0.42 : 0.34, release: 0.15 },
  work: { start: 0.12, span: COARSE ? 0.5 : 0.42, release: 0.15 },
};

const gateOf = (p: number, g: GateCurve) =>
  Math.min(clamp01((p - g.start) / g.span), clamp01((1 - p) / g.release));

export function computeGates(j: JourneyState, out: SectionGates) {
  out.origin[0] = gateOf(j.originShape, GATE.origin);
  for (let k = 0; k < 3; k++) out.craft[k] = gateOf(j.craftShapes[k], GATE.craft);
  for (let k = 0; k < 4; k++) out.work[k] = gateOf(j.workShapes[k], GATE.work);
}

/**
 * Live build gate for one shape id ('origin-grid' / 'craft-N' / 'work-N').
 * DOM-side hook for syncing HTML entrances to a shape's assembly.
 */
export function shapeGate(id: string): number {
  const j = journey;
  if (id === 'origin-grid') return gateOf(j.originShape, GATE.origin);
  if (id.startsWith('craft-')) return gateOf(j.craftShapes[Number(id.slice(6))] ?? 0, GATE.craft);
  if (id.startsWith('work-')) return gateOf(j.workShapes[Number(id.slice(5))] ?? 0, GATE.work);
  return 0;
}

export interface JourneyWeights {
  letters: number;
  origin: number;
  craft: number;
  work: number;
  scatter: number;
  heroPart: number;
  contactPart: number;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const SCRATCH: JourneyWeights = {
  letters: 0,
  origin: 0,
  craft: 0,
  work: 0,
  scatter: 0,
  heroPart: 0,
  contactPart: 0,
};

/**
 * Normalize the dials into blend weights; the remainder is constellation.
 * Called every sim frame — without `out` it reuses a module scratch object,
 * so callers must not hold the result across frames.
 */
export function journeyWeights(j: JourneyState, out: JourneyWeights = SCRATCH): JourneyWeights {
  let letters = clamp01(j.hero + j.contact);
  let origin = clamp01(j.origin);
  let craft = clamp01(j.craft);
  let work = clamp01(j.work);
  const sum = letters + origin + craft + work;
  if (sum > 1) {
    letters /= sum;
    origin /= sum;
    craft /= sum;
    work /= sum;
  }
  out.letters = letters;
  out.origin = origin;
  out.craft = craft;
  out.work = work;
  out.scatter = 1 - Math.min(1, sum);
  out.heroPart = j.hero;
  out.contactPart = j.contact;
  return out;
}
