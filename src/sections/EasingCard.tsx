import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { sampleEase } from '../motion/easings';
import { useMotion } from '../motion/useMotion';
import styles from './EasingCard.module.css';

export interface Curve {
  name: string;
  ease: string;
  code: string;
  blurb: string;
}

const W = 200;
const H = 116;
const PX = 16;
const PY = 26;

const toX = (t: number) => PX + t * (W - PX * 2);
const toY = (v: number) => H - PY - v * (H - PY * 2);

export default function EasingCard({ curve, delay }: { curve: Curve; delay: number }) {
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
