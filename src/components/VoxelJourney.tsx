import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import { useMotion } from '../motion/useMotion';
import { journey, journeyWeights, clamp01, type JourneyState } from '../three/journey';
import { getAnchorEl } from '../three/anchorRegistry';
import { hasWebGL } from '../three/webgl';
import type { BlastTrigger } from '../three/blastSim';
import styles from './VoxelJourney.module.css';

// three.js lives in its own chunk — the copy never waits for it
const HeroCanvas = lazy(() => import('../three/HeroCanvas'));

/**
 * Frosted-glass panes, one per shape panel. They live INSIDE the stage,
 * painted below the canvas: the glass blurs the page texture behind the
 * frame while the voxel shapes render crisply on top of it. Radii mirror
 * the DOM panels they shadow.
 */
const GLASS_PANES = [
  { id: 'origin-grid', radius: 24 },
  { id: 'craft-0', radius: 20 },
  { id: 'craft-1', radius: 20 },
  { id: 'craft-2', radius: 20 },
  { id: 'work-0', radius: 22 },
  { id: 'work-1', radius: 22 },
  { id: 'work-2', radius: 22 },
  { id: 'work-3', radius: 22 },
] as const;

/** journey dials per chapter when reduced motion snaps between poses */
const REDUCED_POSES: Record<string, Partial<JourneyState>> = {
  hero: { hero: 1 },
  origin: { origin: 1, originShape: 0.5 },
  craft: { craft: 1, craftShapes: [0.5, 0.5, 0.5] },
  work: { work: 1, workShapes: [0.5, 0.5, 0.5, 0.5] },
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
  const stageRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  // the glass panes shadow their panels' rects every frame — through scroll,
  // resize, hover lifts and the sections' drift parallax
  useEffect(() => {
    const layer = glassRef.current;
    if (!webgl || !layer) return;
    const panes = Array.from(layer.children) as HTMLElement[];
    const sync = () => {
      const vh = window.innerHeight;
      for (let i = 0; i < panes.length; i++) {
        const src = getAnchorEl(`zone:${GLASS_PANES[i].id}`);
        const pane = panes[i];
        if (!src || !src.isConnected) {
          pane.style.visibility = 'hidden';
          continue;
        }
        const r = src.getBoundingClientRect();
        if (r.width < 2 || r.bottom < -40 || r.top > vh + 40) {
          pane.style.visibility = 'hidden';
          continue;
        }
        pane.style.visibility = 'visible';
        pane.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
        pane.style.width = `${r.width}px`;
        pane.style.height = `${r.height}px`;
      }
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, [webgl]);

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
          stageRef.current?.style.setProperty(
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
      const stage = stageRef.current;
      if (reduced || !stage) return;
      const j = journey;
      const fade = gsap.quickTo(stage, 'opacity', { duration: 0.35, ease: 'power2' });
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
      const lateRelease = (p: number) =>
        Math.min(1, Math.max(0, Math.min(p / 0.24, (1 - p) / 0.13)));
      chapter('hero', 'top top', 'bottom 42%', (p) => { j.hero = 1 - p; });
      chapter('origin', 'top 78%', 'bottom 55%', (p) => { j.origin = lateRelease(p); });
      chapter('craft', 'top 80%', 'bottom 42%', (p) => { j.craft = lateRelease(p); });
      chapter('work', 'top 80%', 'bottom 30%', (p) => { j.work = lateRelease(p); });
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
        <div ref={glassRef} className={styles.glassLayer}>
          {GLASS_PANES.map((pane) => (
            <div
              key={pane.id}
              className={styles.glass}
              style={{ borderRadius: pane.radius, visibility: 'hidden' }}
            />
          ))}
        </div>
      )}
      {webgl && (
        <Suspense fallback={null}>
          <div className={styles.canvas}>
            <HeroCanvas
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
