/**
 * One WebGL probe, shared by every component that must choose between the
 * voxel stage and its flat fallback. Deliberately dependency-free — importing
 * this must never pull three.js into the main bundle.
 */

let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const c = document.createElement('canvas');
    cached = Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}
