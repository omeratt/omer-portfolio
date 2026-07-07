import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { sampleEase } from '../motion/easings';
import { useMotion } from '../motion/useMotion';
import { journey } from '../three/journey';
import { anchorRef, registerAnchor } from '../three/anchorRegistry';
import { pokeShape } from '../three/sectionAnims';
import { hasWebGL } from '../three/webgl';
import styles from './EasingCard.module.css';

export interface Curve {
  name: string;
  ease: string;
  code: string;
  blurb: string;
}

interface Props {
  curve: Curve;
  /** card position in the row — binds it to its voxel shape (craft-N) */
  index: number;
  delay: number;
}

/**
 * A house curve, demonstrated. With WebGL the voxel swarm builds the graph
 * inside the card and a cube cluster rides it; without, the original flat
 * SVG demo takes over.
 */
export default function EasingCard(props: Props) {
  return hasWebGL() ? <VoxelCard {...props} /> : <FlatCard {...props} />;
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.8v2.7h-2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VoxelCard({ curve, index, delay }: Props) {
  const id = `craft-${index}`;
  const replay = () => pokeShape(id);
  const { reduced } = useMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  // each card scrubs its own build gate; a slight per-index offset keeps the
  // three graphs building one after another even when the cards share a row
  useGSAP(
    () => {
      const el = rootRef.current;
      if (reduced || !el) return;
      ScrollTrigger.create({
        trigger: el,
        start: `top ${94 - index * 8}%`,
        end: 'bottom 12%',
        scrub: true,
        onUpdate: (st) => { journey.craftShapes[index] = st.progress; },
        onRefresh: (st) => { journey.craftShapes[index] = st.progress; },
      });
    },
    { dependencies: [reduced, index], scope: rootRef },
  );

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        registerAnchor(`zone:${id}`, el);
      }}
      className={styles.card}
      data-reveal=""
      data-delay={String(delay)}
      onPointerEnter={replay}
    >
      <div className={styles.top}>
        <h3 className={styles.name}>{curve.name}</h3>
        <button
          type="button"
          className={styles.replay}
          onClick={replay}
          aria-label={`Replay the ${curve.name} easing demo`}
        >
          <ReplayIcon />
        </button>
      </div>
      {/* the voxel window — graph, ball and slider assemble in here */}
      <div ref={anchorRef(id)} className={styles.stagebox} aria-hidden="true" />
      <p className={styles.code} data-reveal="" data-reveal-start="top 62%">
        {curve.code}
      </p>
      <p className={styles.blurb} data-reveal="" data-reveal-start="top 62%">
        {curve.blurb}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Flat fallback — the original SVG demo, for contexts without WebGL   */
/* ------------------------------------------------------------------ */

const W = 200;
const H = 116;
const PX = 16;
const PY = 26;

const toX = (t: number) => PX + t * (W - PX * 2);
const toY = (v: number) => H - PY - v * (H - PY * 2);

function FlatCard({ curve, delay }: Props) {
  const { reduced } = useMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<SVGCircleElement>(null);
  const sliderRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);

  const path = useMemo(
    () =>
      sampleEase(curve.ease, 56)
        .map(({ t, v }, i) => `${i === 0 ? 'M' : 'L'}${toX(t).toFixed(1)},${toY(v).toFixed(1)}`)
        .join(' '),
    [curve.ease],
  );

  const { contextSafe } = useGSAP(
    () => {
      const ball = ballRef.current;
      const slider = sliderRef.current;
      if (!ball || !slider) return;
      if (reduced) {
        gsap.set(ball, { attr: { cx: toX(1), cy: toY(1) } });
        gsap.set(slider, { x: () => (trackRef.current?.clientWidth ?? 120) - 12 });
        return;
      }
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top 82%',
        once: true,
        onEnter: () => play(),
      });
    },
    { dependencies: [reduced], scope: rootRef },
  );

  const play = contextSafe(() => {
    const ball = ballRef.current;
    const slider = sliderRef.current;
    const track = trackRef.current;
    if (!ball || !slider || !track || reduced) return;
    const fn = gsap.parseEase(curve.ease);
    const travel = track.clientWidth - 12;
    const state = { p: 0 };
    tween.current?.kill();
    tween.current = gsap.to(state, {
      p: 1,
      duration: 1.4,
      ease: 'none',
      delay: 0.1,
      onUpdate: () => {
        const v = fn(state.p);
        gsap.set(ball, { attr: { cx: toX(state.p), cy: toY(v) } });
        gsap.set(slider, { x: travel * v });
      },
    });
  });

  return (
    <div
      ref={rootRef}
      className={styles.card}
      data-reveal=""
      data-delay={String(delay)}
      onPointerEnter={play}
    >
      <div className={styles.top}>
        <h3 className={styles.name}>{curve.name}</h3>
        <button
          type="button"
          className={styles.replay}
          onClick={play}
          aria-label={`Replay the ${curve.name} easing demo`}
        >
          <ReplayIcon />
        </button>
      </div>
      <svg className={styles.graph} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line className={styles.axis} x1={PX} y1={toY(0)} x2={W - PX} y2={toY(0)} />
        <line className={styles.axis} x1={PX} y1={toY(1)} x2={W - PX} y2={toY(1)} />
        <path className={styles.curve} d={path} />
        <circle ref={ballRef} className={styles.ball} cx={toX(0)} cy={toY(0)} r="4" />
      </svg>
      <span ref={trackRef} className={styles.track} aria-hidden="true">
        <span ref={sliderRef} className={styles.slider} />
      </span>
      <p className={styles.code}>{curve.code}</p>
      <p className={styles.blurb}>{curve.blurb}</p>
    </div>
  );
}
