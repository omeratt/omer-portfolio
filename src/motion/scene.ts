import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMotion } from './useMotion';
import { journey, type Dial } from './journey';

/**
 * The storytelling mode switch. On roomy screens every chapter is a pinned
 * scene: the viewport holds still and the scroll performs the story — the
 * heading opens alone at center stage, each block earns its own entrance,
 * and the chapter clears the stage before the pin lets go. On small or
 * short screens (and under reduced motion) the page falls back to the
 * flowing scrub grammar in useReveal.
 *
 * The same breakpoint lives in the section CSS modules as
 * `@media (min-width: 900px) and (min-height: 680px) and
 *  (prefers-reduced-motion: no-preference)` — keep them in lockstep.
 */
export const SCENE_MQ =
  '(min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';
export const FLOW_MQ = '(max-width: 899.98px), (max-height: 679.98px)';

/** Pin a chapter; its whole story rides one scrubbed timeline. */
export function pinScene(section: HTMLElement, viewports: number): gsap.core.Timeline {
  // no invalidateOnRefresh: on pinned scrub timelines it forces a
  // render-every-child pass during refresh, which stamps mid-story states
  // onto elements the playhead never reached (function-based values are
  // re-measured on breakpoint changes via gsap.matchMedia instead)
  return gsap.timeline({
    defaults: { ease: 'snap' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${Math.round(viewports * 100)}%`,
      pin: true,
      scrub: 0.7,
      anticipatePin: 1,
    },
  });
}

/**
 * The chapter opens: the heading alone at center stage, a size too big.
 * Label, masked lines, then the dot — and once the poster beat has landed,
 * the heading takes its seat at the top while the first words arrive
 * (timeline label `seat`). Optionally rides a monogram dial up with it so
 * the cubes assemble exactly as the title settles.
 */
export function headingOverture(
  tl: gsap.core.Timeline,
  section: HTMLElement,
  dial?: Dial,
): HTMLElement | null {
  const head = section.querySelector<HTMLElement>('[data-lines-root]');
  if (!head) return null;
  const label = head.querySelector<HTMLElement>('[data-reveal]');
  const lines = head.querySelectorAll<HTMLElement>('[data-line]');
  const dot = head.querySelector<HTMLElement>('[data-dot]');

  // distance from the heading's resting slot to the scene's vertical center —
  // measured via offsets (transform-independent) so refreshes stay honest
  const rise = () => {
    let top = 0;
    let el: HTMLElement | null = head;
    while (el && el !== section) {
      top += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    return Math.max(0, section.clientHeight / 2 - top - head.offsetHeight / 2);
  };

  tl.set(head, { y: rise, scale: 1.28, transformOrigin: 'left center' }, 0);
  if (label) {
    tl.fromTo(label, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45 }, 0.05);
  }
  // y:0 on both ends — GSAP parses the CSS translateY(118%) initial state
  // into a px offset that would otherwise survive the tween
  tl.fromTo(
    lines,
    { yPercent: 118, y: 0 },
    { yPercent: 0, y: 0, duration: 0.9, stagger: 0.22, immediateRender: false },
    0.15,
  );
  if (dot) {
    tl.fromTo(
      dot,
      { y: -30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: 'rebound', immediateRender: false },
      '>-0.15',
    );
  }
  if (dial) {
    tl.fromTo(
      journey,
      { [dial]: 0 },
      { [dial]: 1, duration: 1.3, ease: 'power1.inOut', immediateRender: false },
      0.1,
    );
  }
  // hold the poster beat, then the heading takes its seat.
  // fromTo, like every scene tween: scroll restoration can render a pinned
  // timeline once at a transient progress before ScrollTrigger sorts the
  // pins above it — explicit endpoints make any stray render self-heal.
  tl.fromTo(
    head,
    { y: rise, scale: 1.28 },
    { y: 0, scale: 1, duration: 1, ease: 'power2.inOut', immediateRender: false },
    '+=0.4',
  );
  tl.addLabel('seat', '<');
  return head;
}

/** One story beat: a block earns its entrance. */
export function beat(
  tl: gsap.core.Timeline,
  el: gsap.TweenTarget,
  pos: gsap.Position = '+=0.15',
  vars: gsap.TweenVars = {},
) {
  tl.fromTo(
    el,
    { y: 40, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.8, ease: 'snap', immediateRender: false, ...vars },
    pos,
  );
}

/** The narrator moves on — the previous line softens out of focus. */
export function dim(tl: gsap.core.Timeline, el: gsap.TweenTarget, pos: gsap.Position = '<') {
  tl.fromTo(
    el,
    { autoAlpha: 1 },
    { autoAlpha: 0.5, duration: 0.5, ease: 'power1.inOut', immediateRender: false },
    pos,
  );
}

/**
 * Chapter close: everything lifts away while the cubes let go, then the
 * stage holds empty for a breath before the pin releases — so the handoff
 * between chapters is pure constellation, never scrolling content.
 */
export function sceneExit(
  tl: gsap.core.Timeline,
  parts: (HTMLElement | null)[],
  dial?: Dial,
) {
  const targets = parts.filter(Boolean) as HTMLElement[];
  if (targets.length) {
    tl.fromTo(
      targets,
      { y: 0, autoAlpha: 1 },
      {
        y: -46,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power2.in',
        stagger: 0.14,
        immediateRender: false,
      },
      '+=0.55',
    );
  }
  if (dial) {
    tl.fromTo(
      journey,
      { [dial]: 1 },
      { [dial]: 0, duration: 0.9, ease: 'power1.in', immediateRender: false },
      '<+=0.15',
    );
  }
  tl.to({}, { duration: 0.35 });
}

/** Mount a pinned-scene script for a section — scene screens only. */
export function useScene(
  ref: RefObject<HTMLElement | null>,
  build: (section: HTMLElement) => void,
) {
  const { ready, reduced } = useMotion();
  useGSAP(
    () => {
      const section = ref.current;
      if (!ready || reduced || !section) return;
      const mm = gsap.matchMedia();
      mm.add(SCENE_MQ, () => build(section));
    },
    { dependencies: [ready, reduced], scope: ref },
  );
}
