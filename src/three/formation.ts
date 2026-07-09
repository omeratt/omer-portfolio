import { VOXEL_SIZE, type VoxelSeed } from './oaGrid';
import { clamp01, type JourneyWeights, type SectionGates } from './journey';
import type { VoxelCasting } from './formations';
import type { AnchorXf, Zone } from './anchors';
import { evalAnim, type AnimOut } from './sectionAnims';

/**
 * Where every cube wants to be this frame — the single source of truth:
 * the live sim renders it, and a mid-flight blast magnetizes back to it.
 *
 * Each chapter's claim blends the swarm between four states: the OA letters
 * (hero/contact), the section's shapes (per-voxel assignments, assembled in
 * a staggered wave), the ambient float that surrounds assembled shapes, and
 * the loose constellation between chapters. All of it is scroll-driven and
 * deterministic; only the internal demos (packets, ball, hop…) ride the clock.
 */

// Gate math lives in journey.ts (three-free) so DOM-side reveal wiring can
// read it too; re-exported here for the sim-side consumers.
export { computeGates, createGates } from './journey';
export type { SectionGates };

export interface AnchorSet {
  origin: AnchorXf[];
  craft: AnchorXf[];
  work: AnchorXf[];
}

export interface ZoneSet {
  origin: Zone[];
  craft: Zone[];
  work: Zone[];
}

export interface FormationCtx {
  weights: JourneyWeights;
  gates: SectionGates;
  anchors: AnchorSet;
  /** panel no-fly boxes — ambient floaters part around these */
  zones: ZoneSet;
  /** screen center in group-local space — the float cloud drifts toward it */
  floatCx: number;
  floatCy: number;
  /** seconds since the entrance assembly began */
  elapsed: number;
  /** absolute clock — constellation breath, internal demos, float spin */
  time: number;
  reduced: boolean;
}

/** Slightly-overshooting settle — each cube lands like it has weight. */
export function backOut(t: number) {
  const c = 1.70158 * 0.82;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export function settleOf(v: VoxelSeed, ctx: { elapsed: number; reduced: boolean }) {
  const a = ctx.reduced ? 1 : clamp01((ctx.elapsed - v.delay) / 0.9);
  return a >= 1 ? 1 : a <= 0 ? 0 : backOut(a);
}

/** per-voxel assembly spread — how much of the gate is stagger */
const SPR = 0.45;
/** ambient floaters render smaller and deeper than shape cubes */
const FLOAT_SCALE = 0.34;
const FLOAT_BACK = -3.2;

const ANIM: AnimOut = { dx: 0, dy: 0, dz: 0, scale: 1 };

/** repel(x, y) against a section's zones: floaters part around panels and
 *  dim while brushing their edges. Continuous in x/y — no popping at the
 *  boundary — and deterministic per cube via the seed. */
const REPEL = { x: 0, y: 0, dim: 1 };

function repelFromZones(x: number, y: number, zones: Zone[], seed: number) {
  let dim = 1;
  for (let z = 0; z < zones.length; z++) {
    const zone = zones[z];
    if (!zone.ok) continue;
    const dx = x - zone.cx;
    const dy = y - zone.cy;
    const u = Math.max(Math.abs(dx) / zone.hw, Math.abs(dy) / zone.hh);
    if (u >= 1) continue;
    // smoothstep of the penetration — the value AND its gradient hit zero at
    // the zone edge, so a cube wobbling across the boundary never jumps.
    // Gentle on purpose: floaters may drift under the glass (that's the
    // point of it) — they just shouldn't crowd dead-center behind a shape.
    const f = 1 - u;
    const fs = f * f * (3 - 2 * f);
    const k = 1 + fs * 0.35;
    // scale straight out from the panel center; a rare dead-center cube
    // borrows its escape direction from its own seed
    const bx = Math.abs(dx) + Math.abs(dy) < 1e-3 ? seed * 0.01 : dx;
    x = zone.cx + bx * k;
    y = zone.cy + dy * k;
    dim = Math.min(dim, 1 - 0.3 * fs);
  }
  REPEL.x = x;
  REPEL.y = y;
  REPEL.dim = dim;
  return REPEL;
}

/** Returns true when any mix value changed — the caller bumps the paint
 *  version so instance colors repaint only on actual change. */
export function writeFormation(
  voxels: VoxelSeed[],
  cast: VoxelCasting,
  ctx: FormationCtx,
  outPos: Float32Array,
  outRot: Float32Array,
  outScale: Float32Array,
  outBack: Float32Array,
  outMixA: Float32Array,
  outMixH: Float32Array,
): boolean {
  let mixChanged = false;
  const w = ctx.weights;
  const secW = [w.origin, w.craft, w.work];
  const secAsg = [cast.origin, cast.craft, cast.work];
  const secDefs = [cast.shapes.origin, cast.shapes.craft, cast.shapes.work];
  const secGates = [ctx.gates.origin, ctx.gates.craft, ctx.gates.work];
  const secAnchors = [ctx.anchors.origin, ctx.anchors.craft, ctx.anchors.work];
  const secZones = [ctx.zones.origin, ctx.zones.craft, ctx.zones.work];
  const t = ctx.time;

  for (let i = 0; i < voxels.length; i++) {
    const i3 = i * 3;
    const v = voxels[i];
    const settle = settleOf(v, ctx);
    const entrance = 1 - settle;
    const orange = v.orange ? 1 : 0;

    const wavX = ctx.reduced ? 0 : Math.sin(t * (0.5 + v.bias * 0.4) + v.delay * 31);
    const wavY = ctx.reduced ? 0 : Math.cos(t * (0.42 + v.bias * 0.33) + v.delay * 47);

    // constellation: a tight breathing cloud around home
    const scx = v.x + v.sx * 0.22 + wavX * 0.17;
    const scy = v.y + v.sy * 0.22 + wavY * 0.15;
    const scz = v.z + v.sz * 0.22;

    // ambient float around assembled shapes: lazier, smaller, further back —
    // and drifting toward the screen's center, not parked over the letters'
    // corner, so the atmosphere inhabits the whole page
    const fx = ctx.floatCx * 0.62 + v.x + v.sx * 0.6 + wavX * 0.34;
    const fy = ctx.floatCy * 0.55 + v.y + v.sy * 0.5 + wavY * 0.3;
    const fz = v.z + v.sz * 0.34 + FLOAT_BACK;
    const seed = (v.bias - 0.95) * 2; // ±0.8, deterministic per cube

    let px = w.letters * v.x + w.scatter * scx;
    let py = w.letters * v.y + w.scatter * scy;
    let pz = w.letters * v.z + w.scatter * scz;
    let scl = w.letters + w.scatter;
    // letters, constellation and atmosphere all live on the BACK layer —
    // behind the page text, under the glass. Only the assembled share of a
    // cube crosses to the front layer, above the panels.
    let back = w.letters + w.scatter;
    let mixA = (w.letters + w.scatter) * orange;
    let mixH = 0;
    let loose = w.scatter;

    for (let s = 0; s < 3; s++) {
      const ws = secW[s];
      if (ws < 5e-4) continue;

      // default: this cube is atmosphere for the section — drifting UNDER
      // the glass panes, gently parting so it never crowds a shape's center
      const rep = repelFromZones(fx, fy, secZones[s], seed);
      let ax = rep.x;
      let ay = rep.y;
      let az = fz;
      let ascl = FLOAT_SCALE * rep.dim;
      let aback = 1; // atmosphere renders on the back layer…
      let amixA = orange;
      let amixH = 0;
      let aloose = 0.55;

      const asg = secAsg[s];
      const si = asg.shape[i];
      if (si >= 0) {
        const anchor = secAnchors[s][si];
        const gate = secGates[s][si];
        if (anchor && anchor.ok && gate > 0) {
          const def = secDefs[s][si];
          const p = def.points[asg.point[i]];
          const A = clamp01((gate - p.stagger * SPR) / (1 - SPR));
          if (A > 0) {
            evalAnim(def, p, t, ctx.reduced, ANIM);
            const lx = anchor.cx + (p.x + ANIM.dx - def.box.w / 2) * anchor.s;
            const ly = anchor.cy + (def.box.h / 2 - (p.y + ANIM.dy)) * anchor.s;
            const lz = anchor.cz + (p.z + ANIM.dz) * anchor.s;
            const cubeScl = Math.max(1e-3, (p.size * anchor.s * ANIM.scale) / VOXEL_SIZE);
            const e = backOut(A);
            // a cube renders SPLIT across the two layers — sized, not faded —
            // so the layer handoff must happen while the cube is still tiny
            // or the perceived size dips mid-flight. Size + color arrive fast
            // (quadOut), and a claimed cube surfaces through the glass at the
            // very START of its flight: the whole assembly plays out crisp,
            // ABOVE the cards, and only unclaimed atmosphere stays behind.
            const sA = 1 - (1 - A) * (1 - A);
            const cross = clamp01(A / 0.15);
            ax += (lx - ax) * e;
            ay += (ly - ay) * e;
            az += (lz - az) * e;
            ascl += (cubeScl - ascl) * sA;
            aback = 1 - cross; // …already above the glass while it flies
            amixA += ((p.role === 1 ? 1 : 0) - amixA) * sA;
            amixH = p.role === 2 ? sA : 0;
            aloose = 0.55 * (1 - sA);
          }
        }
      }

      px += ws * ax;
      py += ws * ay;
      pz += ws * az;
      scl += ws * ascl;
      back += ws * ascl * aback;
      mixA += ws * amixA;
      mixH += ws * amixH;
      loose += ws * aloose;
    }

    outPos[i3] = px + entrance * v.sx;
    outPos[i3 + 1] = py + entrance * v.sy;
    outPos[i3 + 2] = pz + entrance * v.sz;

    // entrance grow-in is baked here so BOTH layers see the same size
    const sf = 0.25 + 0.75 * clamp01(settle);

    // loose cubes tumble; assembled cubes sit square. Floaters also pick up
    // a slow, per-cube spin so the atmosphere never reads as frozen.
    const r = clamp01(loose + entrance) * 0.9;
    const spin = ctx.reduced ? 0 : t * 0.12 * (v.bias - 0.95) * clamp01(loose);
    outRot[i3] = v.rx * r + spin;
    outRot[i3 + 1] = v.ry * r + spin * 1.35;
    outRot[i3 + 2] = v.rz * r;

    outScale[i] = scl * sf;
    outBack[i] = back * sf;
    if (outMixA[i] !== mixA || outMixH[i] !== mixH) {
      outMixA[i] = mixA;
      outMixH[i] = mixH;
      mixChanged = true;
    }
  }
  return mixChanged;
}
