import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import GridMark from './GridMark';
import ThemeToggle from './ThemeToggle';
import { useMotion } from '../motion/useMotion';
import { useActiveSection } from '../motion/useActiveSection';
import styles from './Header.module.css';

const NAV = [
  { id: 'origin', label: 'Origin' },
  { id: 'craft', label: 'Craft' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
] as const;

const NAV_IDS = NAV.map((item) => item.id);

export default function Header() {
  const { ready, reduced, scrollTo } = useMotion();
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(NAV_IDS);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useGSAP(
    () => {
      if (!ready || !ref.current) return;
      const items = ref.current.querySelectorAll('[data-entrance]');
      if (reduced) {
        gsap.set(items, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        items,
        { y: -16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, ease: 'snap', stagger: 0.07, delay: 0.05 },
      );
    },
    { dependencies: [ready, reduced], scope: ref },
  );

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo(`#${id}`);
  };

  return (
    <header ref={ref} className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={`wrap ${styles.inner}`}>
        <a href="#top" className={styles.brand} onClick={go('top')} data-entrance="">
          <GridMark cell={3} gap={1} shimmer />
          <span className={styles.name}>Omer Attias</span>
        </a>
        <div className={styles.right}>
          <nav className={styles.nav} aria-label="Primary">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={styles.link}
                data-active={active === id || undefined}
                aria-current={active === id ? 'true' : undefined}
                onClick={go(id)}
                data-entrance=""
              >
                {label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
