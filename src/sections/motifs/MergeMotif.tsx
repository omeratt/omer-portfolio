import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../../motion/useMotion';
import styles from './motifs.module.css';

/**
 * The honesty glyph: one branch curves home to a filled merge node;
 * the other is still in flight — drawn open, pulsing, unclaimed.
 */
export default function MergeMotif() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || reduced) return;
      const paths = svg.querySelectorAll<SVGPathElement>('[data-draw]');
      const nodes = svg.querySelectorAll('[data-node]');
      const pulse = svg.querySelector('[data-pulse]');

      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(nodes, { scale: 0, transformOrigin: 'center' });
      if (pulse) gsap.set(pulse, { opacity: 0 });

      ScrollTrigger.create({
        trigger: svg,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: 'snap' } });
          tl.to(paths[0], { strokeDashoffset: 0, duration: 0.7 })
            .to(paths[1], { strokeDashoffset: 0, duration: 0.6 }, '-=0.35')
            .to(paths[2], { strokeDashoffset: 0, duration: 0.6 }, '-=0.4')
            .to(nodes, { scale: 1, duration: 0.5, ease: 'arc', stagger: 0.07 }, '-=0.3');
          if (pulse) {
            tl.set(pulse, { opacity: 1 }).to(pulse, {
              scale: 2,
              opacity: 0,
              duration: 1.4,
              repeat: -1,
              repeatDelay: 0.6,
              ease: 'sine.out',
              transformOrigin: 'center',
            });
          }
        },
      });
    },
    { dependencies: [reduced], scope: ref },
  );

  return (
    <svg ref={ref} className={styles.motif} viewBox="0 0 200 104" aria-hidden="true">
      <path data-draw="" className={styles.strokeInk} d="M60,8 V96" />
      <path data-draw="" className={styles.strokeInk} d="M60,24 C112,24 112,62 60,62" />
      <path data-draw="" className={styles.strokeAccent} d="M60,38 C132,38 142,54 142,80" />
      <circle data-node="" className={styles.fillInk} cx="60" cy="14" r="2.4" />
      <circle data-node="" className={styles.fillInk} cx="60" cy="88" r="2.4" />
      <circle data-node="" className={styles.fillAccent} cx="60" cy="62" r="4.4" />
      <circle data-node="" className={styles.strokeAccent} cx="142" cy="80" r="4.4" />
      <circle data-pulse="" className={styles.strokeAccent} cx="142" cy="80" r="4.4" />
    </svg>
  );
}
