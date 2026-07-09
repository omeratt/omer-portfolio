import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import { useMotion } from '../motion/useMotion';
import { journey, journeyWeights, clamp01, type JourneyState } from '../three/journey';
import { hasWebGL } from '../three/webgl';
import type { BlastTrigger } from '../three/blastSim';
import styles from './VoxelJourney.module.css';

// three.js lives in its own chunk — the copy never waits for it
const HeroCanvas = lazy(() => import('../three/HeroCanvas'));
const UnderlayCanvas = lazy(() =>
  import('../three/HeroCanvas').then((m) => ({ default: m.UnderlayCanvas })),
);

/** journey dials per chapter when reduced motion snaps between poses.
 *  Shape progress sits mid-hold-plateau of the build gate (see gateOf in
 *  formation.ts) so every shape reads fully assembled. */
const HELD = 0.74;
const REDUCED_POSES: Record<string, Partial<JourneyState>> = {
  hero: { hero: 1 },
  origin: { origin: 1, originShape: HELD },
  craft: { craft: 1, craftShapes: [HELD, HELD, HELD] },
  work: { work: 1, workShapes: [HELD, HELD, HELD, HELD] },
  contact: { contact: 1 },
};

/**
 * The monogram's stage — fixed behind the whole page. Each chapter claims
 * a shape: letters → the 2022 grid inside the homage panel → three easing
 * graphs → four project motifs → letters again. Between chapters the cubes
 * drift as a loose constellation; unassigned cubes float as atmosphere.
 */
export default function VoxelJourney() {
  const { reduced } = useMotion();
  const blastRef = useRef<BlastTrigger | null>(null);
  const activeRef = useRef(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  // panels advertise themselves as voxel windows (transparent surfaces)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-voxel-stage', webgl);
    return () => document.documentElement.removeAttribute('data-voxel-stage');
  }, [webgl]);

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

  // reduced motion: no scrubbing — the journey snaps to the chapter in view,
  // every shape fully assembled, every demo at rest (rule: final state, now)
  useEffect(() => {
    if (!reduced || !webgl) return;
    // the scroll-driven fade never runs here — show the voxel layers plainly
    rootRef.current?.style.setProperty('--fade', '1');
    const sections = ['hero', 'origin', 'craft', 'work', 'contact']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pose = REDUCED_POSES[entry.target.id];
          if (!pose) continue;
          Object.assign(journey, {
            hero: 0,
            contact: 0,
            origin: 0,
            craft: 0,
            work: 0,
            originShape: 0,
            craftShapes: [0, 0, 0] as [number, number, number],
            workShapes: [0, 0, 0, 0] as [number, number, number, number],
          });
          Object.assign(journey, pose);
          // hero/contact keep the ghosting mask; the shape chapters don't
          rootRef.current?.style.setProperty(
            '--mx',
            entry.target.id === 'hero' || entry.target.id === 'contact' ? '0' : '1',
          );
        }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduced, webgl]);

  useGSAP(
    () => {
      const stage = rootRef.current;
      if (reduced || !stage) return;
      const j = journey;
      // the journey fade dims ONLY the voxel canvases (via --fade). The glass
      // surfaces live on the panels themselves — steady, never breathing
      // with the swarm.
      const fadeState = { v: 0 };
      const fade = gsap.quickTo(fadeState, 'v', {
        duration: 0.35,
        ease: 'power2',
        onUpdate: () => stage.style.setProperty('--fade', fadeState.v.toFixed(4)),
      });
      const apply = () => {
        const w = journeyWeights(j);
        const portrait = window.innerHeight > window.innerWidth * 1.15;
        const contactShare = j.contact / Math.max(1e-3, j.hero + j.contact);
        const lettersO = 1 + ((portrait ? 0.55 : 0.9) - 1) * contactShare;
        // sections: the voxels ARE the content — full presence
        fade(
          w.letters * lettersO + (w.origin + w.craft + w.work) * 1 + w.scatter * 0.34,
        );
        // the hero mask (letters ghosting under the copy) slides away as the
        // shapes take over the whole page, and back for the contact reprise
        stage.style.setProperty('--mx', (1 - clamp01(j.hero + j.contact)).toFixed(4));
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

      // sections only write their CLAIM here (how much of the swarm they
      // own); every shape's build gate is scrubbed by its own panel trigger.
      // Claims release late and fast — panel triggers own visible teardown.
      // The release tail is a FRACTION of the chapter span, so the huge work
      // section gets a much smaller one: with the default 0.13 its claim
      // started decaying while the last project (04) was still mid-screen.
      const lateRelease = (p: number, tail = 0.13) =>
        Math.min(1, Math.max(0, Math.min(p / 0.24, (1 - p) / tail)));
      chapter('hero', 'top top', 'bottom 42%', (p) => { j.hero = 1 - p; });
      chapter('origin', 'top 78%', 'bottom 55%', (p) => { j.origin = lateRelease(p); });
      chapter('craft', 'top 80%', 'bottom 42%', (p) => { j.craft = lateRelease(p); });
      chapter('work', 'top 80%', 'bottom 12%', (p) => { j.work = lateRelease(p, 0.05); });
      chapter('contact', 'top 85%', 'top 28%', (p) => { j.contact = p; });

      if (import.meta.env.DEV) {
        // live journey dials for debugging: window.__oaJourney
        (window as unknown as { __oaJourney?: JourneyState }).__oaJourney = j;
      }
    },
    { dependencies: [reduced], scope: rootRef },
  );

  // paint order bottom → top: back stage (floaters) → page content, whose
  // panels carry the frosted glass as their own background (it scrolls
  // natively with them — no fixed-layer sync, no iOS jitter) → front stage
  // (letters + assembled shapes, crisp above the glass).
  //
  // The FRONT canvas comes first in the tree on purpose: R3F renders roots
  // in mount order, so the sim (front) computes each frame's buffers before
  // the back canvas composes them — same-frame coherence, no 1-frame lag
  // between the layers. Stacking is unaffected (explicit z-indexes).
  return (
    <div ref={rootRef} className={styles.root} data-loaded={loaded || undefined} aria-hidden="true">
      {webgl && (
        <div className={styles.stageFront}>
          <Suspense fallback={null}>
            <div className={styles.canvas}>
              <HeroCanvas blastRef={blastRef} activeRef={activeRef} />
            </div>
          </Suspense>
        </div>
      )}
      <div className={styles.stage}>
        <GridMark cell={22} tone="ghost" className={styles.ghost} />
        {webgl && (
          <Suspense fallback={null}>
            <div className={styles.canvasBack}>
              <UnderlayCanvas activeRef={activeRef} onReady={() => setLoaded(true)} />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}
