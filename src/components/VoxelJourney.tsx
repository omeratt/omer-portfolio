import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import { useMotion } from '../motion/useMotion';
import { journey } from '../motion/journey';
import { FLOW_MQ } from '../motion/scene';
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

/**
 * The monogram's stage — fixed behind the whole page. Each chapter claims
 * a shape: letters → the flat 2022 grid → a shot-arc → a spinning ball →
 * letters again. On scene screens the pinned chapter timelines write the
 * dials (src/motion/scene.ts); on small screens the flow ScrollTriggers
 * below do. Either way, a shape completes exactly as its chapter's title
 * settles and breaks apart as the chapter clears the stage — between
 * chapters the cubes exhale into a wide constellation.
 */
export default function VoxelJourney() {
  const { reduced } = useMotion();
  const journeyRef = useRef<JourneyState>(journey);
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

      // scene timelines and flow triggers both write the dials; one ticker
      // maps them to stage opacity so every writer stays in sync
      const fade = gsap.quickTo(stage, 'opacity', { duration: 0.35, ease: 'power2' });
      let last = -1;
      const apply = () => {
        const w = journeyWeights(journey);
        const portrait = window.innerHeight > window.innerWidth * 1.15;
        const contactShare = journey.contact / Math.max(1e-3, journey.hero + journey.contact);
        const lettersO = 1 + ((portrait ? 0.55 : 0.9) - 1) * contactShare;
        const o =
          w.letters * lettersO + w.flat * 0.52 + w.arc * 0.36 +
          w.sphere * 0.32 + w.scatter * 0.22;
        if (Math.abs(o - last) > 0.003) {
          last = o;
          fade(o);
        }
      };
      gsap.ticker.add(apply);

      // flowing fallback (small / short screens): the dials ride
      // ScrollTriggers. Real elements, never selector strings — the useGSAP
      // scope would resolve strings inside the stage div, silently breaking
      // every trigger.
      const mm = gsap.matchMedia();
      mm.add(FLOW_MQ, () => {
        const scrub = (
          trigger: Element,
          start: string,
          end: string,
          write: (p: number) => void,
        ) => {
          ScrollTrigger.create({
            trigger, start, end, scrub: true,
            // onRefresh too: resizes and late layout shifts must never leave
            // a stale dial behind
            onUpdate: (st) => write(st.progress),
            onRefresh: (st) => write(st.progress),
          });
        };

        // rise rides the chapter heading (shape lands with the title),
        // release rides the section's exit (shape shatters with the words)
        const dial = (
          key: 'flat' | 'arc' | 'sphere' | 'contact',
          sectionId: string,
          hold = false,
        ) => {
          const section = document.getElementById(sectionId);
          if (!section) return;
          const head = section.querySelector('[data-lines-root]') ?? section;
          let rise = 0;
          let release = 0;
          const write = () => { journey[key] = rise * (1 - release); };
          scrub(head, 'top 88%', 'top 42%', (p) => { rise = p; write(); });
          if (!hold) {
            scrub(section, 'bottom 88%', 'bottom 55%', (p) => { release = p; write(); });
          }
        };

        const hero = document.getElementById('hero');
        // letters let go early — the constellation needs a window to breathe
        if (hero) scrub(hero, 'top top', 'bottom 62%', (p) => { journey.hero = 1 - p; });
        dial('flat', 'origin');
        dial('arc', 'craft');
        dial('sphere', 'work');
        dial('contact', 'contact', true);
      });

      if (import.meta.env.DEV) {
        // live journey dials for debugging: window.__oaJourney
        (window as unknown as { __oaJourney?: JourneyState }).__oaJourney = journey;
      }

      return () => gsap.ticker.remove(apply);
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
