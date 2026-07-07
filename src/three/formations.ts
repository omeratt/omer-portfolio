import { mulberry32, type VoxelSeed } from './oaGrid';
import { buildSectionShapes, type SectionShapes, type ShapeDef } from './sectionShapes';

/**
 * The casting sheet: which cube plays which part in which chapter.
 *
 * Every section (Origin / Craft / Work) hands each voxel either a role in
 * one of its shapes — a fixed point index — or leaves it floating as
 * atmosphere. Assignments are seeded and precomputed once, so the same cube
 * always travels to the same spot: scrubbing back and forth is stable.
 */

export interface SectionAssignment {
  /** per voxel: shape index within the section, or -1 = ambient floater */
  shape: Int16Array;
  /** per voxel: point index inside that shape */
  point: Int16Array;
}

export interface VoxelCasting {
  shapes: SectionShapes;
  origin: SectionAssignment;
  craft: SectionAssignment;
  work: SectionAssignment;
}

function cast(defs: ShapeDef[], n: number, seed: number): SectionAssignment {
  const shape = new Int16Array(n).fill(-1);
  const point = new Int16Array(n).fill(-1);

  // seeded Fisher–Yates — a fresh shuffle per section keeps the swarm's
  // regrouping organic instead of letter-ordered
  const rand = mulberry32(seed);
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  let cursor = 0;
  defs.forEach((def, si) => {
    for (let pi = 0; pi < def.points.length && cursor < n; pi++, cursor++) {
      shape[perm[cursor]] = si;
      point[perm[cursor]] = pi;
    }
  });

  if (import.meta.env.DEV) {
    const need = defs.reduce((sum, d) => sum + d.points.length, 0);
    if (need > n) {
      console.warn(`[voxels] section needs ${need} cubes but only ${n} exist — shapes will thin out`);
    }
  }

  return { shape, point };
}

export function buildCasting(voxels: VoxelSeed[]): VoxelCasting {
  const shapes = buildSectionShapes();
  const n = voxels.length;
  return {
    shapes,
    origin: cast(shapes.origin, n, 101),
    craft: cast(shapes.craft, n, 202),
    work: cast(shapes.work, n, 303),
  };
}
