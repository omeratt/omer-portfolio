import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../../motion/useMotion';
import styles from './motifs.module.css';

const LANES = [30, 54, 78] as const;
const PACKETS = [
  { lane: 0, delay: 0, dur: 2.6, accent: false },
  { lane: 0, delay: 1.3, dur: 2.6, accent: false },
  { lane: 1, delay: 0.5, dur: 3.4, accent: true },
  { lane: 2, delay: 0.2, dur: 2.1, accent: false },
  { lane: 2, delay: 1.3, dur: 2.1, accent: false },
] as const;

/** Request lanes — traffic streaming through an interceptor. */
export default function NetMotif() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg) return;
      const dots = svg.querySelectorAll('[data-packet]');
      if (reduced) {
        dots.forEach((dot, i) => gsap.set(dot, { attr: { cx: 40 + i * 30 } }));
        return;
      }
      const tweens = [...dots].map((dot, i) =>
        gsap.fromTo(
          dot,
          { attr: { cx: 4 } },
          {
            attr: { cx: 196 },
            duration: PACKETS[i].dur,
            delay: PACKETS[i].delay,
            ease: 'none',
            repeat: -1,
            paused: true,
          },
        ),
      );
      ScrollTrigger.create({
        trigger: svg,
        start: 'top 96%',
        end: 'bottom 4%',
        onToggle: (st) => tweens.forEach((t) => (st.isActive ? t.play() : t.pause())),
      });
    },
    { dependencies: [reduced], scope: ref },
  );

  return (
    <svg ref={ref} className={styles.motif} viewBox="0 0 200 104" aria-hidden="true">
      {LANES.map((y) => (
        <g key={y}>
          <line className={styles.lane} x1="8" y1={y} x2="188" y2={y} />
          <rect className={styles.port} x="190" y={y - 5} width="3" height="10" rx="1.5" />
        </g>
      ))}
      {PACKETS.map((p, i) => (
        <circle
          key={i}
          data-packet=""
          className={p.accent ? styles.fillAccent : styles.fillInk}
          cx="4"
          cy={LANES[p.lane]}
          r="3"
        />
      ))}
    </svg>
  );
}
