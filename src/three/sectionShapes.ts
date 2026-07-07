import gsap from 'gsap';
import { CELLS, GRID_COLS, GRID_ROWS, mulberry32 } from './oaGrid';
import { sampleEase } from '../motion/easings';

/**
 * Every section shape, as data. Each shape lives in its own "design box"
 * (the old SVG viewBox, more or less) and is fitted at runtime into the
 * DOM panel it replaces. Points carry everything the sim needs: where to
 * sit, what color role to take, when to assemble, and which internal
 * animation (packet, ball, hop…) moves them once assembled.
 */

export const PART_STATIC = 0;
export const PART_BALL = 1; // easing demo — rides the curve with the card's ease
export const PART_KNOB = 2; // easing demo — slider knob under the graph
export const PART_PACKET = 3; // net lanes — travels left → right forever
export const PART_SQUARE = 4; // play — hop / squash / stretch as a group
export const PART_IND = 5; // pagination — slide / stretch / fade / hop
export const PART_PULSE = 6; // merge — the open node's heartbeat

export const ROLE_INK = 0;
export const ROLE_ACCENT = 1;
export const ROLE_HERITAGE = 2;

export interface ShapePoint {
  x: number;
  y: number; // design space, y-down like SVG (the writer flips)
  z: number;
  size: number; // cube edge, in design units
  role: number;
  stagger: number; // 0..1 — assembly order inside the shape
  part: number;
  t: number; // param along a path / index — meaning depends on part
  a: number; // part-specific (packet: duration; square: group index…)
  b: number; // part-specific (packet: phase; knob: travel…)
}

export interface ShapeDef {
  /** anchor id — the DOM panel this shape is fitted into */
  id: string;
  box: { w: number; h: number };
  points: ShapePoint[];
  /** easing cards only — the curve the ball demonstrates */
  ease?: (t: number) => number;
}

export interface SectionShapes {
  origin: ShapeDef[];
  craft: ShapeDef[];
  work: ShapeDef[];
}

const pt = (p: Partial<ShapePoint> & { x: number; y: number; size: number }): ShapePoint => ({
  z: 0,
  role: ROLE_INK,
  stagger: 0,
  part: PART_STATIC,
  t: 0,
  a: 0,
  b: 0,
  ...p,
});

/* ------------------------------------------------------------------ */
/* Origin — the 2022 OA grid, verbatim cells, four cubes per cell      */
/* ------------------------------------------------------------------ */

function buildOriginShapes(): ShapeDef[] {
  const rand = mulberry32(22);
  const points: ShapePoint[] = [];
  for (const { col, row } of CELLS) {
    for (let ix = 0; ix < 2; ix++) {
      for (let iy = 0; iy < 2; iy++) {
        points.push(
          pt({
            x: col + 0.5 + (ix - 0.5) * 0.5,
            y: row + 0.5 + (iy - 0.5) * 0.5,
            size: 0.42,
            role: ROLE_HERITAGE,
            // the CSS --d wave, resurrected: cells build column by column
            stagger: (col / (GRID_COLS - 1)) * 0.82 + rand() * 0.18,
          }),
        );
      }
    }
  }
  return [{ id: 'origin-grid', box: { w: GRID_COLS, h: GRID_ROWS }, points }];
}

/* ------------------------------------------------------------------ */
/* Craft — three easing graphs: axes, curve, ball, slider              */
/* ------------------------------------------------------------------ */

/** must match the CURVES order rendered by Craft.tsx */
export const CRAFT_EASES = ['snap', 'arc', 'rebound'] as const;

const GW = 200;
const GH = 150;
const GPX = 16;
const graphX = (t: number) => GPX + t * (GW - GPX * 2);
const graphY = (v: number) => 90 - v * 64; // v=0 → y90 (bottom axis), v=1 → y26
const TRACK_Y = 134;

function buildCraftShapes(): ShapeDef[] {
  return CRAFT_EASES.map((name, card) => {
    const rand = mulberry32(300 + card);
    const points: ShapePoint[] = [];

    // dashed axes at v=0 and v=1
    for (const v of [0, 1]) {
      for (let i = 0; i < 7; i++) {
        points.push(
          pt({
            x: graphX(i / 6),
            y: graphY(v),
            z: -2,
            size: 4.2,
            stagger: (i / 6) * 0.2 + (v ? 0.04 : 0),
          }),
        );
      }
    }

    // the curve itself — the exact house ease, sampled
    const samples = sampleEase(name, 20);
    for (const { t, v } of samples) {
      points.push(
        pt({
          x: graphX(t),
          y: graphY(v),
          size: 7,
          stagger: 0.16 + t * 0.52,
          t,
        }),
      );
    }

    // the ball — a tight 2×2 cluster that rides the curve
    for (let i = 0; i < 4; i++) {
      points.push(
        pt({
          x: graphX(0) + (i % 2 === 0 ? -1.7 : 1.7),
          y: graphY(0) + (i < 2 ? -1.7 : 1.7),
          z: 6,
          size: 6.8,
          role: ROLE_ACCENT,
          part: PART_BALL,
          stagger: 0.8 + i * 0.03,
        }),
      );
    }

    // slider track + knob, in sync with the ball
    for (let i = 0; i < 7; i++) {
      points.push(
        pt({
          x: graphX(i / 6),
          y: TRACK_Y,
          z: -2,
          size: 3.6,
          stagger: 0.5 + (i / 6) * 0.22 + rand() * 0.04,
        }),
      );
    }
    for (let i = 0; i < 2; i++) {
      points.push(
        pt({
          x: graphX(0) + (i === 0 ? -1.8 : 1.8),
          y: TRACK_Y,
          z: 5,
          size: 6.8,
          role: ROLE_ACCENT,
          part: PART_KNOB,
          b: GW - GPX * 2, // travel
          stagger: 0.88 + i * 0.04,
        }),
      );
    }

    return { id: `craft-${card}`, box: { w: GW, h: GH }, points, ease: gsap.parseEase(name) };
  });
}

/* ------------------------------------------------------------------ */
/* Work — the four project motifs, one per panel                       */
/* ------------------------------------------------------------------ */

const NET_LANES = [30, 54, 78];
const NET_PACKETS = [
  { lane: 0, dur: 2.6, delay: 0, accent: false },
  { lane: 0, dur: 2.6, delay: 1.3, accent: false },
  { lane: 1, dur: 3.4, delay: 0.5, accent: true },
  { lane: 2, dur: 2.1, delay: 0.2, accent: false },
  { lane: 2, dur: 2.1, delay: 1.3, accent: false },
];

function buildNet(): ShapeDef {
  const points: ShapePoint[] = [];
  NET_LANES.forEach((y, lane) => {
    for (let i = 0; i < 11; i++) {
      points.push(
        pt({
          x: 8 + i * 18,
          y,
          z: -2,
          size: 5.2,
          stagger: (i / 10) * 0.5 + lane * 0.06,
        }),
      );
    }
    for (let i = 0; i < 2; i++) {
      points.push(
        pt({ x: 191.5, y: y + (i === 0 ? -2.8 : 2.8), size: 5.6, stagger: 0.62 + lane * 0.05 }),
      );
    }
  });
  NET_PACKETS.forEach((p, i) => {
    points.push(
      pt({
        x: 4,
        y: NET_LANES[p.lane],
        z: 5,
        size: 8,
        role: p.accent ? ROLE_ACCENT : ROLE_INK,
        part: PART_PACKET,
        t: i, // rest slot under reduced motion
        a: p.dur,
        b: p.delay / p.dur, // phase
        stagger: 0.82 + i * 0.03,
      }),
    );
  });
  return { id: 'work-0', box: { w: 200, h: 104 }, points };
}

export const PLAY_SQUARES = [
  { cx: 78, cy: 30, accent: false },
  { cx: 120, cy: 30, accent: true },
  { cx: 78, cy: 72, accent: false },
  { cx: 120, cy: 72, accent: false },
];
export const PLAY_SIZE = 28;

function buildPlay(): ShapeDef {
  const rand = mulberry32(44);
  const points: ShapePoint[] = [];
  PLAY_SQUARES.forEach((sq, k) => {
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        points.push(
          pt({
            x: sq.cx + ix * 9.3,
            y: sq.cy + iy * 9.3,
            size: 9,
            role: sq.accent ? ROLE_ACCENT : ROLE_INK,
            part: PART_SQUARE,
            a: k,
            stagger: k * 0.18 + rand() * 0.14,
          }),
        );
      }
    }
  });
  return { id: 'work-1', box: { w: 200, h: 104 }, points };
}

export const PAG_XS = [40, 70, 100, 130, 160];
const PAG_Y = 52;

function buildPagination(): ShapeDef {
  const points: ShapePoint[] = [];
  PAG_XS.forEach((x, i) => {
    points.push(pt({ x, y: PAG_Y, size: 8.5, stagger: (i / 4) * 0.5 }));
  });
  for (let i = 0; i < 3; i++) {
    points.push(
      pt({
        x: PAG_XS[0] + (i - 1) * 4.4,
        y: PAG_Y,
        z: 5,
        size: 7.2,
        role: ROLE_ACCENT,
        part: PART_IND,
        t: i / 2, // 0 | 0.5 | 1 across the indicator's width
        stagger: 0.72 + i * 0.05,
      }),
    );
  }
  return { id: 'work-2', box: { w: 200, h: 104 }, points };
}

function cubicAt(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function buildMerge(): ShapeDef {
  const points: ShapePoint[] = [];
  // trunk — draws first, top to bottom
  for (let i = 0; i < 8; i++) {
    const s = i / 7;
    points.push(pt({ x: 60, y: 8 + s * 88, size: 5.8, stagger: s * 0.28 }));
  }
  // closed branch: out and home again
  for (let i = 0; i < 8; i++) {
    const s = (i + 1) / 9;
    points.push(
      pt({
        x: cubicAt(s, 60, 112, 112, 60),
        y: cubicAt(s, 24, 24, 62, 62),
        size: 5.8,
        stagger: 0.26 + s * 0.28,
      }),
    );
  }
  // open branch — accent, still in flight
  for (let i = 0; i < 8; i++) {
    const s = (i + 1) / 9;
    points.push(
      pt({
        x: cubicAt(s, 60, 132, 142, 142),
        y: cubicAt(s, 38, 38, 54, 80),
        size: 5.8,
        role: ROLE_ACCENT,
        stagger: 0.5 + s * 0.3,
      }),
    );
  }
  // nodes land last
  points.push(pt({ x: 60, y: 14, size: 6.2, stagger: 0.82 }));
  points.push(pt({ x: 60, y: 88, size: 6.2, stagger: 0.84 }));
  points.push(pt({ x: 60, y: 62, z: 4, size: 10, role: ROLE_ACCENT, stagger: 0.88 }));
  points.push(
    pt({ x: 142, y: 80, z: 4, size: 10, role: ROLE_ACCENT, part: PART_PULSE, stagger: 0.94 }),
  );
  return { id: 'work-3', box: { w: 200, h: 104 }, points };
}

/* ------------------------------------------------------------------ */

let cache: SectionShapes | null = null;

export function buildSectionShapes(): SectionShapes {
  if (cache) return cache;
  cache = {
    origin: buildOriginShapes(),
    craft: buildCraftShapes(),
    work: [buildNet(), buildPlay(), buildPagination(), buildMerge()],
  };
  return cache;
}
