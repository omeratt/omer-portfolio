import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../../motion/useMotion';
import styles from './motifs.module.css';

const SIZE = 28;
const SQUARES = [
  { x: 64, y: 16, accent: false },
  { x: 106, y: 16, accent: true },
  { x: 64, y: 58, accent: false },
  { x: 106, y: 58, accent: false },
] as const;

/** Playground Mode: tasks that hop — anticipation, flight, squash, settle. */
export default function PlayMotif() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || reduced) return;
      const squares = svg.querySelectorAll('[data-sq]');
      gsap.set(squares, { transformOrigin: '50% 100%' });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5, paused: true });
      squares.forEach((sq, i) => {
        const t = i * 0.15;
        tl.to(sq, { scaleY: 0.84, duration: 0.12, ease: 'power2.in' }, t)
          .to(sq, { y: -10, scaleY: 1.05, duration: 0.22, ease: 'power2.out' }, t + 0.12)
          .to(sq, { y: 0, duration: 0.2, ease: 'power2.in' }, t + 0.34)
          .to(sq, { scaleY: 0.8, scaleX: 1.14, duration: 0.09, ease: 'none' }, t + 0.54)
          .to(sq, { scaleY: 1, scaleX: 1, duration: 0.42, ease: 'arc' }, t + 0.63);
      });

      ScrollTrigger.create({
        trigger: svg,
        start: 'top 96%',
        end: 'bottom 4%',
        onToggle: (st) => (st.isActive ? tl.play() : tl.pause()),
      });
    },
    { dependencies: [reduced], scope: ref },
  );

  return (
    <svg ref={ref} className={styles.motif} viewBox="0 0 200 104" aria-hidden="true">
      {SQUARES.map((sq, i) => (
        <rect
          key={i}
          data-sq=""
          className={sq.accent ? styles.sqAccent : styles.sqMuted}
          x={sq.x}
          y={sq.y}
          width={SIZE}
          height={SIZE}
          rx="9"
        />
      ))}
    </svg>
  );
}
