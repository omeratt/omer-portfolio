import * as THREE from 'three';
import type { VoxelSeed } from './oaGrid';
import type { Formations } from './formations';
import { writeFormation, settleOf, clamp01, type FormationCtx } from './formation';

export interface SimCtx extends FormationCtx {
  /** cursor on the monogram plane, in group space (null = no pointer) */
  pointer: THREE.Vector3 | null;
}

const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();

export function simFrame(
  mesh: THREE.InstancedMesh,
  voxels: VoxelSeed[],
  forms: Formations,
  ctx: SimCtx,
  size: number,
  outPos: Float32Array,
  outRot: Float32Array,
) {
  writeFormation(voxels, forms, ctx, outPos, outRot);

  // cursor push — any coherent shape reacts, the loose cloud doesn't
  const pushable =
    ctx.pointer && !ctx.reduced && ctx.elapsed > 1.5 && ctx.weights.scatter < 0.45;

  for (let i = 0; i < voxels.length; i++) {
    const i3 = i * 3;

    if (pushable && ctx.pointer) {
      const dx = outPos[i3] - ctx.pointer.x;
      const dy = outPos[i3 + 1] - ctx.pointer.y;
      const f = Math.exp(-(dx * dx + dy * dy) / 1.4) * 0.36;
      if (f > 0.004) {
        // written back so a blast ignites from exactly what's on screen
        outPos[i3] += dx * f;
        outPos[i3 + 1] += dy * f;
        outPos[i3 + 2] += f * 0.5;
      }
    }

    const settle = settleOf(voxels[i], ctx);
    const s = size * (0.25 + 0.75 * clamp01(settle));
    E.set(outRot[i3], outRot[i3 + 1], outRot[i3 + 2]);
    Q.setFromEuler(E);
    P.set(outPos[i3], outPos[i3 + 1], outPos[i3 + 2]);
    S.set(s, s, s);
    M.compose(P, Q, S);
    mesh.setMatrixAt(i, M);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/** Compose instance matrices straight from a physics state (blast mode). */
export function composeFromState(
  mesh: THREE.InstancedMesh,
  pos: Float32Array,
  rot: Float32Array,
  size: number,
) {
  S.set(size, size, size);
  const count = pos.length / 3;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    E.set(rot[i3], rot[i3 + 1], rot[i3 + 2]);
    Q.setFromEuler(E);
    P.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
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
