import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import { useMotion } from '../motion/useMotion';
import { journeyWeights, type JourneyState } from '../three/formation';
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

/** rises over the first quarter, holds, lets go over the last fifth */
const plateau = (p: number) => Math.max(0, Math.min(1, Math.min(p / 0.24, (1 - p) / 0.2)));

/**
 * The monogram's stage — fixed behind the whole page. Each chapter claims
 * a shape: letters → the flat 2022 grid → a shot-arc → a spinning ball →
 * letters again. Between chapters the cubes drift as a loose constellation.
 */
export default function VoxelJourney() {
  const { reduced } = useMotion();
  const journeyRef = useRef<JourneyState>({ hero: 1, flat: 0, arc: 0, sphere: 0, contact: 0 });
  const blastRef = useRef<BlastTrigger | null>(null);
  const activeRef = useRef(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  // click anywhere (interactive elements excluded) → shatter from that point
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
        const w = journeyWeights(j);
        const portrait = window.innerHeight > window.innerWidth * 1.15;
        const contactShare = j.contact / Math.max(1e-3, j.hero + j.contact);
        const lettersO = 1 + ((portrait ? 0.55 : 0.9) - 1) * contactShare;
        fade(
          w.letters * lettersO + w.flat * 0.52 + w.arc * 0.36 +
          w.sphere * 0.32 + w.scatter * 0.2,
        );
      };
      // real elements, never selector strings — the useGSAP scope would
      // resolve strings inside the stage div, silently breaking every trigger
      const chapter = (
        id: string,
        start: string,
        end: string,
        write: (p: number) => void,
      ) => {
        const trigger = document.getElementById(id);
        if (!trigger) return;
        ScrollTrigger.create({
          trigger, start, end, scrub: true,
          // onRefresh too: resizes and late layout shifts must never leave
          // a stale dial behind
          onUpdate: (st) => { write(st.progress); apply(); },
          onRefresh: (st) => { write(st.progress); apply(); },
        });
      };

      chapter('hero', 'top top', 'bottom 42%', (p) => { j.hero = 1 - p; });
      chapter('origin', 'top 78%', 'bottom 58%', (p) => { j.flat = plateau(p); });
      chapter('craft', 'top 80%', 'bottom 52%', (p) => { j.arc = plateau(p); });
      chapter('work', 'top 80%', 'bottom 48%', (p) => { j.sphere = plateau(p); });
      chapter('contact', 'top 85%', 'top 28%', (p) => { j.contact = p; });

      if (import.meta.env.DEV) {
        // live journey dials for debugging: window.__oaJourney
        (window as unknown as { __oaJourney?: JourneyState }).__oaJourney = j;
      }
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
