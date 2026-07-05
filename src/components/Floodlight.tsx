import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useTheme } from '../theme/useTheme';
import { useMotion } from '../motion/useMotion';
import styles from './Floodlight.module.css';

const SIZE = 1400;

/**
 * Night court only: a cool floodlight that trails the cursor.
 * By day the sun is ambient — no follower.
 */
export default function Floodlight() {
  const { theme } = useTheme();
  const { reduced } = useMotion();
  const ref = useRef<HTMLDivElement>(null);
  const fine = useMemo(() => window.matchMedia('(pointer: fine)').matches, []);
  const on = theme === 'dark' && !reduced && fine;

  useEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    gsap.set(el, {
      x: window.innerWidth / 2 - SIZE / 2,
      y: window.innerHeight * 0.35 - SIZE / 2,
    });
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' });
    const move = (e: PointerEvent) => {
      xTo(e.clientX - SIZE / 2);
      yTo(e.clientY - SIZE / 2);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [on]);

  if (!on) return null;
  return <div ref={ref} className={styles.light} aria-hidden="true" />;
}
