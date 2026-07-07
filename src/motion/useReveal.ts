import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from './useMotion';

const TRIG = { start: 'top 87%', once: true } as const;

/**
 * The site-wide reveal grammar. Sections opt elements in with data attributes:
 *   data-reveal          fade-up block (optional data-delay="0.15")
 *   data-reveal-start    ScrollTrigger start override (e.g. "top 55%") — used
 *                        to hold text back until its voxel shape has built
 *   data-lines-root      children [data-line] mask-reveal, [data-dot] dribbles in
 *   data-rule            hairline draws left → right
 *   data-grid-build      child spans assemble in random stagger (the 2022 grid)
 * One grammar, one rhythm — every section reads the same on entry.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const scope = useRef<T>(null);
  const { ready, reduced } = useMotion();

  useGSAP(
    () => {
      const root = scope.current;
      if (!ready || !root) return;

      if (reduced) {
        gsap.set(
          root.querySelectorAll(
            '[data-reveal], [data-line], [data-rule], [data-dot], [data-grid-build] span',
          ),
          { autoAlpha: 1, x: 0, y: 0, yPercent: 0, scale: 1, scaleX: 1 },
        );
        return;
      }

      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 26, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'snap',
            delay: Number(el.dataset.delay ?? 0),
            scrollTrigger: { trigger: el, ...TRIG, start: el.dataset.revealStart ?? TRIG.start },
          },
        );
      });

      root.querySelectorAll<HTMLElement>('[data-lines-root]').forEach((head) => {
        // y:0 on both ends — GSAP parses the CSS translateY(118%) initial
        // state into a px offset that would otherwise survive the tween
        gsap.fromTo(
          head.querySelectorAll('[data-line]'),
          { yPercent: 118, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: 1.1,
            ease: 'snap',
            stagger: 0.09,
            scrollTrigger: { trigger: head, ...TRIG },
          },
        );
        const dot = head.querySelector('[data-dot]');
        if (dot) {
          gsap.fromTo(
            dot,
            { y: -36, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: 'rebound',
              delay: 0.55,
              scrollTrigger: { trigger: head, ...TRIG },
            },
          );
        }
      });

      root.querySelectorAll<HTMLElement>('[data-rule]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: 'snap',
            transformOrigin: 'left center',
            scrollTrigger: { trigger: el, ...TRIG },
          },
        );
      });

      root.querySelectorAll<HTMLElement>('[data-grid-build]').forEach((grid) => {
        gsap.fromTo(
          grid.querySelectorAll('span'),
          { autoAlpha: 0, scale: 0.55 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.5,
            ease: 'arc',
            stagger: { each: 0.016, from: 'random' },
            scrollTrigger: { trigger: grid, ...TRIG },
          },
        );
      });
    },
    { dependencies: [ready, reduced], scope },
  );

  return scope;
}
