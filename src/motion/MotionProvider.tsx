import { useEffect, useMemo, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { easeExpoOut } from './easings';
import { MotionContext } from './context';

export function MotionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Gate the entrance cascade on fonts so nothing reveals mid-swap —
  // but never hold the page hostage to a slow cache.
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts.ready.then(go).catch(go);
    const t = window.setTimeout(go, 900);
    return () => window.clearTimeout(t);
  }, []);

  // Lenis drives window scroll; GSAP's ticker drives Lenis.
  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({ lerp: 0.115, smoothWheel: true });
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    instance.on('scroll', ScrollTrigger.update);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  const value = useMemo<React.ContextType<typeof MotionContext>>(
    () => ({
      ready,
      reduced,
      lenis,
      scrollTo: (selector: string) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return;
        if (lenis) {
          lenis.scrollTo(el, { offset: -84, duration: 1.25, easing: easeExpoOut });
        } else {
          el.scrollIntoView({ block: 'start' });
        }
      },
    }),
    [ready, reduced, lenis],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
