import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from './useMotion';

/**
 * A whisper of parallax: a section's content glides slightly slower than
 * the page around it, so scrolling reads as layers, not a document.
 */
export function useDrift(ref: RefObject<HTMLElement | null>, amount = 34) {
  const { reduced } = useMotion();

  useGSAP(
    () => {
      const section = ref.current;
      const target = section?.firstElementChild;
      if (reduced || !section || !target) return;
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
    },
    { dependencies: [reduced], scope: ref },
  );
}
