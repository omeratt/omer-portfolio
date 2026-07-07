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

/** Normalize the dials into blend weights; the remainder is constellation. */
export function journeyWeights(j: JourneyState): JourneyWeights {
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
  return {
    letters,
    origin,
    craft,
    work,
    scatter: 1 - Math.min(1, sum),
    heroPart: j.hero,
    contactPart: j.contact,
  };
}
