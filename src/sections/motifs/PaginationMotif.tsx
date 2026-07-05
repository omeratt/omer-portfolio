import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../../motion/useMotion';
import styles from './motifs.module.css';

const XS = [40, 70, 100, 130, 160] as const;
const Y = 52;
const IND = { w: 12, h: 12 };

/** The library, demoed in place: slide, liquid stretch, fade. */
export default function PaginationMotif() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || reduced) return;
      const ind = svg.querySelector('[data-ind]');
      if (!ind) return;

      const at = (i: number) => XS[i] - IND.w / 2;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      // slide
      tl.to(ind, { attr: { x: at(1) }, duration: 0.55, ease: 'snap', delay: 0.6 })
        // liquid: stretch across the gap, then snap tight
        .to(ind, { attr: { width: XS[2] - XS[1] + IND.w }, duration: 0.28, ease: 'power2.in' }, '+=0.55')
        .to(ind, { attr: { x: at(2), width: IND.w }, duration: 0.38, ease: 'snap' })
        // fade: disappear here, reappear there
        .to(ind, { opacity: 0, duration: 0.22, ease: 'power1.in' }, '+=0.55')
        .set(ind, { attr: { x: at(3) } })
        .to(ind, { opacity: 1, duration: 0.26 })
        // arc hop to the last dot
        .to(ind, { attr: { x: at(4) }, duration: 0.5, ease: 'arc' }, '+=0.5')
        // long glide home
        .to(ind, { attr: { x: at(0) }, duration: 0.75, ease: 'snap' }, '+=0.7');
      tl.pause();

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
      {XS.map((x) => (
        <circle key={x} className={styles.fillLine} cx={x} cy={Y} r="4.5" />
      ))}
      <rect
        data-ind=""
        className={styles.fillAccent}
        x={XS[0] - IND.w / 2}
        y={Y - IND.h / 2}
        width={IND.w}
        height={IND.h}
        rx={IND.h / 2}
      />
    </svg>
  );
}
