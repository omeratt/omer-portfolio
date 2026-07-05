import * as THREE from 'three';
import type { VoxelSeed } from './oaGrid';

/** Slightly-overshooting settle — each cube lands like it has weight. */
function backOut(t: number) {
  const c = 1.70158 * 0.82;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface SimCtx {
  /** seconds since assembly started (0 = fully scattered) */
  elapsed: number;
  /** 0 assembled … 1 re-scattered by scroll */
  disperse: number;
  /** cursor on the monogram plane, in group space (null = no pointer) */
  pointer: THREE.Vector3 | null;
  reduced: boolean;
}

const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();

export function simFrame(
  mesh: THREE.InstancedMesh,
  voxels: VoxelSeed[],
  ctx: SimCtx,
  size: number,
) {
  const { elapsed, disperse, pointer, reduced } = ctx;

  for (let i = 0; i < voxels.length; i++) {
    const v = voxels[i];
    const a = reduced ? 1 : clamp01((elapsed - v.delay) / 0.9);
    const settle = a >= 1 ? 1 : a <= 0 ? 0 : backOut(a);
    const d = 1 - settle + disperse * v.bias;

    let px = v.x + v.sx * d;
    let py = v.y + v.sy * d;
    let pz = v.z + v.sz * d;

    // cursor push — only once the letters have settled
    if (pointer && d < 0.05 && d > -0.2) {
      const dx = px - pointer.x;
      const dy = py - pointer.y;
      const f = Math.exp(-(dx * dx + dy * dy) / 1.4) * 0.36;
      if (f > 0.004) {
        px += dx * f;
        py += dy * f;
        pz += f * 0.5;
      }
    }

    const s = size * (0.25 + 0.75 * clamp01(settle));
    E.set(v.rx * d, v.ry * d, v.rz * d);
    Q.setFromEuler(E);
    P.set(px, py, pz);
    S.set(s, s, s);
    M.compose(P, Q, S);
    mesh.setMatrixAt(i, M);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

const RAY = new THREE.Raycaster();
const NDC = new THREE.Vector2();
const PLANE = new THREE.Plane();
const WORLD = new THREE.Vector3();

/** Project a pointer (NDC) onto the monogram's plane, in group-local space. */
export function pointerOnMonogram(
  nx: number,
  ny: number,
  camera: THREE.Camera,
  group: THREE.Object3D,
  out: THREE.Vector3,
): THREE.Vector3 | null {
  NDC.set(nx, ny);
  RAY.setFromCamera(NDC, camera);
  PLANE.setFromNormalAndCoplanarPoint(PLANE.normal.set(0, 0, 1), group.getWorldPosition(WORLD));
  const hit = RAY.ray.intersectPlane(PLANE, out);
  return hit ? group.worldToLocal(hit) : null;
}
