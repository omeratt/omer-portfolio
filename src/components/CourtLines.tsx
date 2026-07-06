import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../motion/useMotion';
import { useActiveSection } from '../motion/useActiveSection';
import styles from './CourtLines.module.css';

const SECTIONS = ['hero', 'origin', 'craft', 'work', 'contact'] as const;

/**
 * The latent court, in two depth layers drifting at different speeds.
 * The tick ring orbits with the scroll, the three-point arc draws itself
 * across the full page — and whichever chapter you're reading warms its
 * own line with a breath of orange.
 */
export default function CourtLines() {
  const { reduced } = useMotion();
  const active = useActiveSection(SECTIONS);
  const nearRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const arcRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const near = nearRef.current;
    const far = farRef.current;
    const ring = ringRef.current;
    if (reduced || !near || !far) return;
    let last = -1;
    const tick = () => {
      const y = window.scrollY;
      if (y === last) return;
      last = y;
      gsap.set(near, { y: y * -0.09 });
      gsap.set(far, { y: y * -0.042 });
      if (ring) gsap.set(ring, { rotation: y * 0.016, svgOrigin: '1156 340' });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced]);

  useGSAP(
    () => {
      const arc = arcRef.current;
      if (reduced || !arc) return;
      const length = arc.getTotalLength();
      gsap.set(arc, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(arc, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    },
    { dependencies: [reduced] },
  );

  return (
    <svg
      className={styles.court}
      viewBox="0 0 1440 1800"
      preserveAspectRatio="xMidYMin slice"
      data-sec={active ?? 'hero'}
      aria-hidden="true"
    >
      <g ref={farRef} className={styles.far}>
        <circle className={styles.elContact} cx="180" cy="1420" r="330" />
        <path className={styles.elContact} d="M -80 260 Q 720 640 1520 260" />
      </g>
      <g ref={nearRef} className={styles.lines}>
        <circle className={styles.elHero} cx="1156" cy="340" r="272" />
        <circle ref={ringRef} className={`${styles.ring} ${styles.elHero}`} cx="1156" cy="340" r="88" />
        <line className={styles.elWork} x1="0" y1="920" x2="1440" y2="920" />
        <line className={styles.elWork} x1="720" y1="898" x2="720" y2="942" />
        <path ref={arcRef} className={styles.elCraft} d="M -80 1690 Q 720 1150 1520 1690" />
        <path className={styles.elOrigin} d="M 0 96 Q 110 96 110 0" />
      </g>
    </svg>
  );
}
