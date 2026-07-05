import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { RefObject } from 'react';
import GridMark from '../components/GridMark';
import { useMotion } from '../motion/useMotion';
import styles from './HeroStage.module.css';

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
 * The hero's visual layer: the flat 2022 grid stands in as a ghost until
 * WebGL arrives, then the voxels take over. Scrolling away scatters them —
 * scroll back and they reassemble. The 3D is an accent, never a hostage.
 */
export default function HeroStage({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const { reduced } = useMotion();
  const disperseRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  useGSAP(
    () => {
      if (reduced || !heroRef.current || !stageRef.current) return;
      gsap.to(stageRef.current, {
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom 30%',
          scrub: true,
          onUpdate: (st) => {
            disperseRef.current = st.progress;
          },
        },
      });
    },
    { dependencies: [reduced], scope: stageRef },
  );

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-loaded={loaded || undefined}
      aria-hidden="true"
    >
      <GridMark cell={22} tone="ghost" className={styles.ghost} />
      {webgl && (
        <Suspense fallback={null}>
          <div className={styles.canvas}>
            <HeroCanvas disperseRef={disperseRef} onReady={() => setLoaded(true)} />
          </div>
        </Suspense>
      )}
    </div>
  );
}
