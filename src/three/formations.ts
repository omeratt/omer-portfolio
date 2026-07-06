import { mulberry32, type VoxelSeed } from './oaGrid';

/**
 * The shapes the monogram becomes, one per chapter — precomputed once.
 *
 *   flat    the 2022 grid (Origin — the scroll travels back in time)
 *   arc     a shot-arc of cubes (Craft — the cubes BECOME the curve)
 *   sphere  a slowly spinning ball (Work — the game, abstracted)
 *
 * Letters are the voxels' own home positions; between chapters the cubes
 * hold a loose constellation. arcT stores each cube's parameter along the
 * arc so a wave can travel through it at runtime.
 */
export interface Formations {
  flat: Float32Array;
  arc: Float32Array;
  sphere: Float32Array;
  arcT: Float32Array;
}

export function buildFormations(voxels: VoxelSeed[]): Formations {
  const n = voxels.length;
  const flat = new Float32Array(n * 3);
  const arc = new Float32Array(n * 3);
  const sphere = new Float32Array(n * 3);
  const arcT = new Float32Array(n);
  const rand = mulberry32(7);

  // shot arc: up, over, in — the letters unwind into it column by column
  const P0 = { x: -3.4, y: -1.9 };
  const P1 = { x: 0, y: 2.7 };
  const P2 = { x: 3.6, y: -2.2 };

  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    const v = voxels[i];

    // the flat 2022 grid — depth collapsed to a whisper
    flat[i3] = v.x;
    flat[i3 + 1] = v.y;
    flat[i3 + 2] = v.z * 0.08;

    // quadratic bezier with a little lane thickness
    const t = n > 1 ? i / (n - 1) : 0;
    const u = 1 - t;
    arcT[i] = t;
    arc[i3] = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x + (rand() - 0.5) * 0.42;
    arc[i3 + 1] = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y + (rand() - 0.5) * 0.34;
    arc[i3 + 2] = (rand() - 0.5) * 0.8;

    // fibonacci sphere — even coverage, no poles clumping
    const y = 1 - (2 * (i + 0.5)) / n;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.399963229728653; // golden angle
    const R = 2.05;
    sphere[i3] = Math.cos(theta) * ring * R;
    sphere[i3 + 1] = y * R;
    sphere[i3 + 2] = Math.sin(theta) * ring * R;
  }

  return { flat, arc, sphere, arcT };
}
