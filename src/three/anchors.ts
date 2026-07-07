import * as THREE from 'three';
import { getAnchorEl } from './anchorRegistry';

/**
 * The bridge between DOM panels and voxel formations. Every frame the sim
 * projects a registered panel's rect onto the monogram's plane and fits the
 * shape's design box inside it, in group-local space — so shapes stay glued
 * to their panels through scroll, resize, drift and the group's own motion.
 */

export interface AnchorXf {
  ok: boolean;
  /** design box center, in group-local space */
  cx: number;
  cy: number;
  cz: number;
  /** group-local units per design unit */
  s: number;
}

export const emptyAnchor = (): AnchorXf => ({ ok: false, cx: 0, cy: 0, cz: 0, s: 0 });

const RAY = new THREE.Raycaster();
const NDC = new THREE.Vector2();
const PLANE = new THREE.Plane();
const WORLD = new THREE.Vector3();
const HIT = new THREE.Vector3();
const SCALE = new THREE.Vector3();

/**
 * Resolve one anchor: rect center → ray → the group's z-plane → local space.
 * Scale comes from world-units-per-pixel at the plane's camera distance, so
 * the fit stays exact however far the journey has receded the group.
 */
export function resolveAnchor(
  id: string,
  boxW: number,
  boxH: number,
  camera: THREE.PerspectiveCamera,
  group: THREE.Object3D,
  vpW: number,
  vpH: number,
  out: AnchorXf,
): AnchorXf {
  const el = getAnchorEl(id);
  if (!el || !el.isConnected) {
    out.ok = false;
    return out;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    out.ok = false;
    return out;
  }

  NDC.set(
    ((rect.left + rect.width / 2) / vpW) * 2 - 1,
    -((rect.top + rect.height / 2) / vpH) * 2 + 1,
  );
  RAY.setFromCamera(NDC, camera);
  PLANE.setFromNormalAndCoplanarPoint(PLANE.normal.set(0, 0, 1), group.getWorldPosition(WORLD));
  if (!RAY.ray.intersectPlane(PLANE, HIT)) {
    out.ok = false;
    return out;
  }

  const dist = camera.position.distanceTo(HIT);
  const worldPerPx = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / vpH;
  const groupScale = group.getWorldScale(SCALE).x || 1;

  // contain-fit the design box into the rect, with a little breathing room
  const fit = Math.min(rect.width / boxW, rect.height / boxH) * 0.92;

  group.worldToLocal(HIT);
  out.ok = true;
  out.cx = HIT.x;
  out.cy = HIT.y;
  out.cz = HIT.z;
  out.s = (fit * worldPerPx) / groupScale;
  return out;
}
