import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMotion } from '../motion/useMotion';
import styles from './CourtLines.module.css';

/**
 * The latent court: hairline geometry drifting slower than the page —
 * a depth plane you feel more than see.
 */
export default function CourtLines() {
  const { reduced } = useMotion();
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    let last = -1;
    const tick = () => {
      const y = window.scrollY;
      if (y !== last) {
        last = y;
        gsap.set(el, { y: y * -0.055 });
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced]);

  return (
    <svg
      className={styles.court}
      viewBox="0 0 1440 1800"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <g ref={ref} className={styles.lines}>
        <circle cx="1156" cy="340" r="272" />
        <circle cx="1156" cy="340" r="88" />
        <line x1="0" y1="920" x2="1440" y2="920" />
        <path d="M -80 1690 Q 720 1150 1520 1690" />
      </g>
    </svg>
  );
}
