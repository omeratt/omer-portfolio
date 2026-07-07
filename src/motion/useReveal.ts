import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from './useMotion';
import { FLOW_MQ } from './scene';

/**
 * The flowing story grammar — the small/short-screen fallback for the
 * pinned scenes in scene.ts. Every reveal is scrubbed to the scroll, so
 * the page reads as chapters you move through, not slides that fire.
 * Scroll back and the story rewinds. Sections opt elements in:
 *
 *   data-lines-root      chapter heading: label fades, lines mask in one by
 *                        one, the dot dribbles in last — and the title opens
 *                        oversized, settling to size as you commit
 *   data-reveal          a solo beat: fades up over its own viewport traverse
 *   data-seq             container whose [data-reveal] children cascade in
 *                        a single scrubbed sequence (cards, work items)
 *   data-rule            hairline draws left → right with the scroll
 *   data-grid-build      child spans assemble in random stagger (the 2022 grid)
 *   data-story-hold      (on the section) the chapter never exits — for the end
 *
 * Every section also gets an exit: as the next chapter approaches, the body
 * ([data-story-body]) lifts away first and the heading lingers a beat.
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

      const mm = gsap.matchMedia();
      mm.add(FLOW_MQ, () => {
        // ---- chapter heading: label → lines → dot, riding the scroll ----
        root.querySelectorAll<HTMLElement>('[data-lines-root]').forEach((head) => {
          const label = head.querySelector<HTMLElement>('[data-reveal]');
          const lines = head.querySelectorAll<HTMLElement>('[data-line]');
          const dot = head.querySelector<HTMLElement>('[data-dot]');
          const title = head.querySelector<HTMLElement>('h1, h2, h3');

          const tl = gsap.timeline({
            defaults: { ease: 'snap' },
            scrollTrigger: { trigger: head, start: 'top 94%', end: 'top 52%', scrub: 0.65 },
          });
          if (label) {
            tl.fromTo(label, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 0);
          }
          // y:0 on both ends — GSAP parses the CSS translateY(118%) initial
          // state into a px offset that would otherwise survive the tween
          tl.fromTo(
            lines,
            { yPercent: 118, y: 0 },
            { yPercent: 0, y: 0, duration: 1, stagger: 0.2 },
            0.12,
          );
          if (dot) {
            tl.fromTo(
              dot,
              { y: -34, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.55, ease: 'rebound' },
              '>-0.2',
            );
          }

          // the title arrives a size too big and settles as you scroll into it
          if (title) {
            gsap.fromTo(
              title,
              { scale: 1.16, transformOrigin: 'left bottom' },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: { trigger: head, start: 'top 98%', end: 'top 38%', scrub: 0.85 },
              },
            );
          }
        });

        // ---- solo beats: each block earns its place as it travels up ----
        const solos = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
          (el) => !el.closest('[data-lines-root]') && !el.closest('[data-seq]'),
        );
        solos.forEach((el) => {
          gsap.fromTo(
            el,
            { y: 36, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              ease: 'snap',
              scrollTrigger: { trigger: el, start: 'top 97%', end: 'top 72%', scrub: 0.65 },
            },
          );
        });

        // ---- sequences: siblings cascade through one scrubbed window ----
        root.querySelectorAll<HTMLElement>('[data-seq]').forEach((seq) => {
          const items = seq.querySelectorAll<HTMLElement>('[data-reveal]');
          if (!items.length) return;
          gsap
            .timeline({
              scrollTrigger: { trigger: seq, start: 'top 92%', end: 'top 48%', scrub: 0.65 },
            })
            .fromTo(
              items,
              { y: 44, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.9, ease: 'snap', stagger: 0.22 },
            );
        });

        root.querySelectorAll<HTMLElement>('[data-rule]').forEach((el) => {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              transformOrigin: 'left center',
              scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 72%', scrub: 0.6 },
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
              stagger: { each: 0.014, from: 'random' },
              scrollTrigger: { trigger: grid, start: 'top 94%', end: 'top 55%', scrub: 0.6 },
            },
          );
        });

        // ---- chapter exit: body lifts away, the heading lingers a beat ----
        if (!root.hasAttribute('data-story-hold')) {
          const head = root.querySelector<HTMLElement>('[data-lines-root]');
          const body = root.querySelector<HTMLElement>('[data-story-body]');
          if (head || body) {
            const tl = gsap.timeline({
              defaults: { ease: 'power2.in' },
              scrollTrigger: {
                trigger: root,
                start: 'bottom 72%',
                end: 'bottom 24%',
                scrub: 0.75,
              },
            });
            if (body) tl.to(body, { y: -52, autoAlpha: 0, duration: 1 }, 0);
            if (head) tl.to(head, { y: -40, autoAlpha: 0, duration: 0.8 }, 0.35);
          }
        }
      });
    },
    { dependencies: [ready, reduced], scope },
  );

  return scope;
}
