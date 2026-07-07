import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from './useMotion';
import { FLOW_MQ } from './scene';

/**
 * A whisper of parallax for the flowing (small-screen) mode: a section's
 * content glides slightly slower than the page around it, so scrolling
 * reads as layers, not a document. Pinned scenes hold the stage still,
 * so they opt out.
 */
export function useDrift(ref: RefObject<HTMLElement | null>, amount = 34) {
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const section = ref.current;
      const target = section?.firstElementChild;
      if (reduced || !section || !target) return;
      const mm = gsap.matchMedia();
      mm.add(FLOW_MQ, () => {
        gsap.fromTo(
          target,
          { y: amount },
          {
            y: -amount,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });
    },
    { dependencies: [reduced], scope: ref },
  );
}
