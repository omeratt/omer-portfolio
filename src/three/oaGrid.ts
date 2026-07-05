/**
 * The 2022 monogram, as data.
 *
 * One bitmap feeds everything: the flat CSS homage in the Story section,
 * the favicon, the header mark — and the WebGL voxel build in the hero.
 * Same cells, more depth. (Deliberately dependency-free: importing this
 * must never pull three.js into the main bundle.)
 */

const O = ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'];
const A = ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'];
const GAP = 2;

export const GRID_ROWS = O.length; // 7
export const GRID_COLS = O[0].length * 2 + GAP; // 12
export const ROWS: string[] = O.map((row, i) => row + '.'.repeat(GAP) + A[i]);

export interface Cell {
  col: number;
  row: number;
}

export const CELLS: Cell[] = ROWS.flatMap((row, rowIndex) =>
  [...row].flatMap((ch, colIndex) => (ch === '#' ? [{ col: colIndex, row: rowIndex }] : [])),
);

/** Deterministic PRNG — the orange voxels land in the same cells every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CELL = 0.56; // world units per 2022 grid cell
const SUBDIV = 2; // each flat cell becomes a 2×2 face of mini-cubes…
const DEPTH = 2; // …two cubes deep. Flat pixels, reborn as volume.

export const VOXEL_SIZE = (CELL / SUBDIV) * 0.88;

export interface VoxelSeed {
  x: number;
  y: number;
  z: number; // assembled (home) position
  sx: number;
  sy: number;
  sz: number; // scatter offset at full disperse
  rx: number;
  ry: number;
  rz: number; // scatter rotation
  delay: number; // assembly stagger
  bias: number; // how eagerly it scatters on scroll
  orange: boolean;
}

export function buildVoxels(): VoxelSeed[] {
  const rand = mulberry32(2022);
  const mini = CELL / SUBDIV;
  const out: VoxelSeed[] = [];

  for (const { col, row } of CELLS) {
    const cx = (col - (GRID_COLS - 1) / 2) * CELL;
    const cy = ((GRID_ROWS - 1) / 2 - row) * CELL;

    for (let ix = 0; ix < SUBDIV; ix++) {
      for (let iy = 0; iy < SUBDIV; iy++) {
        for (let iz = 0; iz < DEPTH; iz++) {
          const theta = rand() * Math.PI * 2;
          const phi = Math.acos(rand() * 2 - 1);
          const dist = 4.5 + rand() * 7;
          out.push({
            x: cx + (ix - (SUBDIV - 1) / 2) * mini,
            y: cy + (iy - (SUBDIV - 1) / 2) * mini,
            z: (iz - (DEPTH - 1) / 2) * mini,
            sx: Math.sin(phi) * Math.cos(theta) * dist,
            sy: Math.sin(phi) * Math.sin(theta) * dist,
            sz: Math.cos(phi) * dist * 1.4,
            rx: (rand() - 0.5) * 5,
            ry: (rand() - 0.5) * 5,
            rz: (rand() - 0.5) * 5,
            delay: col * 0.03 + rand() * 0.24,
            bias: 0.55 + rand() * 0.85,
            orange: rand() < 0.085,
          });
        }
      }
    }
  }
  return out;
}
