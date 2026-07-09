/**
 * The bridge between the two voxel layers. The swarm renders on TWO stacked
 * canvases: the back layer (ambient floaters) paints below the frosted glass
 * panes, the front layer (letters + assembled shapes) above them. One sim —
 * the front canvas's frame loop — computes everything and hands the shared
 * buffers over here; the back canvas only composes matrices from them.
 *
 * A cube's "backness" crossfades as it assembles: atmosphere lives under the
 * glass, and joining a shape carries it through to the crisp layer above.
 */

const EMPTY = new Float32Array(0);

export interface UnderlayState {
  count: number;
  /** shared with the sim — positions/rotations for every cube */
  pos: Float32Array;
  rot: Float32Array;
  /** back-layer scale per cube (already includes the backness split) */
  back: Float32Array;
  /** shared color mixes (accent / heritage) */
  mixA: Float32Array;
  mixH: Float32Array;
  /** the front group's transform, mirrored so both layers project alike */
  gx: number;
  gy: number;
  gz: number;
  gs: number;
  rx: number;
  ry: number;
  /** bumped once per simulated frame; the back canvas recomposes on change */
  version: number;
  /** bumped only when the sim actually changed a mix value — both layers
   *  repaint instance colors on change, and only on change */
  mixVersion: number;
  /** false only while a blast owns the frame (everything rides the front) */
  active: boolean;
}

export const underlay: UnderlayState = {
  count: 0,
  pos: EMPTY,
  rot: EMPTY,
  back: EMPTY,
  mixA: EMPTY,
  mixH: EMPTY,
  gx: 0,
  gy: 0,
  gz: 0,
  gs: 1,
  rx: 0,
  ry: 0,
  version: 0,
  mixVersion: 0,
  active: false,
};

/** The sim unhooks on unmount (HMR included) so the back canvas never
 *  composes from a dead owner's buffers. */
export function resetUnderlay() {
  underlay.count = 0;
  underlay.pos = EMPTY;
  underlay.rot = EMPTY;
  underlay.back = EMPTY;
  underlay.mixA = EMPTY;
  underlay.mixH = EMPTY;
  underlay.active = false;
}
