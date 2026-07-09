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
    // syncTouch routes touch scrolling through the rAF loop instead of the
    // compositor thread, so the natively-scrolling panels and the fixed voxel
    // canvases (whose anchors are read on the main thread) move in the SAME
    // frame — without it, iOS shows shapes trailing a beat behind their
    // cards. It changes touch feel (lerped inertia, slight rubber-band);
    // feel-test toggle: load the page with ?native-touch to turn it off.
    const syncTouch = !new URLSearchParams(window.location.search).has('native-touch');
    const instance = new Lenis({
      lerp: 0.115,
      smoothWheel: true,
      syncTouch,
      // syncTouch swallows every touch gesture before the browser sees it —
      // returning false here (touch, pulling down, already at the very top)
      // exits BEFORE Lenis preventDefaults, so iOS pull-to-refresh survives
      virtualScroll: (e) =>
        !(e.event.type.includes('touch') && e.deltaY < 0 && window.scrollY <= 1),
    });
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
        // land on the section's heading, not its breathing room — skip most
        // of the top padding so the arrival feels placed, not approximate
        const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
        const offset = pad > 100 ? pad - 104 : -84;
        if (lenis) {
          lenis.scrollTo(el, { offset, duration: 1.25, easing: easeExpoOut });
        } else {
          window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + offset);
        }
      },
    }),
    [ready, reduced, lenis],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
