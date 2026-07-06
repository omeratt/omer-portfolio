import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import { useMotion } from '../motion/useMotion';
import type { JourneyState } from '../three/formation';
import type { BlastTrigger } from '../three/blastSim';
import styles from './VoxelJourney.module.css';

// three.js lives in its own chunk — the copy never waits for it
const HeroCanvas = lazy(() => import('../three/HeroCanvas'));

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * The monogram's stage — fixed behind the whole page, so the letters can
 * travel the scroll: whole in the hero, loosened into a constellation for
 * the ride, flat beside the 2022 homage, whole again at the sign-off.
 */
export default function VoxelJourney() {
  const { reduced } = useMotion();
  const journeyRef = useRef<JourneyState>({ loosen: 0, flatten: 0, contact: 0 });
  const blastRef = useRef<BlastTrigger | null>(null);
  const activeRef = useRef(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  // click anywhere (links and buttons excluded) → shatter from that point;
  // the monogram itself decides whether it's currently shatterable
  useEffect(() => {
    if (reduced) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea')) return;
      blastRef.current?.({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [reduced]);

  // reduced motion: no journey — the monogram is a hero-only ornament
  useEffect(() => {
    const stage = stageRef.current;
    const hero = document.getElementById('hero');
    if (!reduced || !stage || !hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.isIntersecting;
      stage.toggleAttribute('data-offstage', !entry.isIntersecting);
    });
    observer.observe(hero);
    return () => {
      activeRef.current = true;
      observer.disconnect();
    };
  }, [reduced]);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (reduced || !stage) return;
      const j = journeyRef.current;
      const fade = gsap.quickTo(stage, 'opacity', { duration: 0.35, ease: 'power2' });
      const apply = () => {
        const portrait = window.innerHeight > window.innerWidth * 1.15;
        let o = 1 - j.loosen * 0.8;
        o = Math.max(o, 0.42 * j.flatten);
        o += ((portrait ? 0.55 : 0.9) - o) * j.contact;
        fade(o);
      };
      ScrollTrigger.create({
        trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: true,
        onUpdate: (st) => { j.loosen = st.progress; apply(); },
      });
      ScrollTrigger.create({
        trigger: '#origin', start: 'top 62%', end: 'bottom 55%', scrub: true,
        onUpdate: (st) => { j.flatten = Math.sin(st.progress * Math.PI); apply(); },
      });
      ScrollTrigger.create({
        trigger: '#contact', start: 'top 85%', end: 'top 30%', scrub: true,
        onUpdate: (st) => { j.contact = st.progress; apply(); },
      });
    },
    { dependencies: [reduced], scope: stageRef },
  );

  return (
    <div ref={stageRef} className={styles.stage} data-loaded={loaded || undefined} aria-hidden="true">
      <GridMark cell={22} tone="ghost" className={styles.ghost} />
      {webgl && (
        <Suspense fallback={null}>
          <div className={styles.canvas}>
            <HeroCanvas
              journeyRef={journeyRef}
              blastRef={blastRef}
              activeRef={activeRef}
              onReady={() => setLoaded(true)}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
}
