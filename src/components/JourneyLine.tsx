import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMotion } from '../motion/useMotion';
import styles from './JourneyLine.module.css';

/**
 * The page as one court-length run: a hairline rail at the edge,
 * and the ball travels it as you scroll. One page, one journey.
 */
export default function JourneyLine() {
  const { reduced } = useMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const rail = railRef.current;
      const ball = ballRef.current;
      if (reduced || !rail || !ball) return;
      // the ball stretches with scroll velocity — dribble physics; Lenis
      // decelerates smoothly, so the last updates ease it back to round
      const stretch = gsap.quickTo(ball, 'scaleY', { duration: 0.25, ease: 'power2' });
      const squash = gsap.quickTo(ball, 'scaleX', { duration: 0.25, ease: 'power2' });
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (st) => {
          gsap.set(ball, { y: st.progress * (rail.clientHeight - 7) });
          const k = Math.min(Math.abs(st.getVelocity()) / 9000, 0.85);
          stretch(1 + k);
          squash(1 / (1 + k * 0.55));
        },
      });
    },
    { dependencies: [reduced], scope: railRef },
  );

  if (reduced) return null;

  return (
    <div ref={railRef} className={styles.rail} aria-hidden="true">
      <span ref={ballRef} className={styles.ball} />
    </div>
  );
}
