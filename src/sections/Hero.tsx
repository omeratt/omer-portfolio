import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import HeroStage from './HeroStage';
import MagneticLink from '../components/MagneticLink';
import { useMotion } from '../motion/useMotion';
import styles from './Hero.module.css';

export default function Hero() {
  const { ready, reduced, scrollTo } = useMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!ready || !root) return;
      const lines = root.querySelectorAll('[data-line]');
      const items = root.querySelectorAll('[data-entrance]');
      const dot = root.querySelector('[data-dot]');

      if (reduced) {
        gsap.set([...lines, ...items], { autoAlpha: 1, yPercent: 0, y: 0 });
        if (dot) gsap.set(dot, { autoAlpha: 1, scale: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'snap' } });
      // y:0 on both ends — GSAP parses the CSS translateY(118%) initial state
      // into a px offset that would otherwise survive the tween
      tl.fromTo(
        lines,
        { yPercent: 118, y: 0 },
        { yPercent: 0, y: 0, duration: 1.2, stagger: 0.12 },
        0.15,
      )
        .fromTo(
          items,
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, stagger: 0.09 },
          0.5,
        );
      if (dot) {
        tl.fromTo(
          dot,
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.8, ease: 'arc' },
          1.05,
        );
      }

      // the dribble hint bows out once you commit to scrolling
      const hint = root.querySelector('[data-hint]');
      if (hint) {
        gsap.to(hint, {
          autoAlpha: 0,
          duration: 0.4,
          scrollTrigger: {
            trigger: root,
            start: '60 top',
            toggleActions: 'play none none reverse',
          },
        });
      }
    },
    { dependencies: [ready, reduced], scope: sectionRef },
  );

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollTo(target);
  };

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="Introduction">
      <HeroStage heroRef={sectionRef} />
      <div className={`wrap ${styles.inner}`}>
        <p className={`label ${styles.eyebrow}`} data-entrance="">
          Omer Attias — React Native · Motion · Native
        </p>
        <h1 className={`display ${styles.title}`}>
          <span className="mask">
            <span data-line="">Interfaces with</span>
          </span>
          <span className="mask">
            <span data-line="">
              muscle memory
              <span className="dot" data-dot="" aria-hidden="true" />
            </span>
          </span>
        </h1>
        <p className={`lead ${styles.lead}`} data-entrance="">
          I build React Native interfaces where motion is engineered, not decorated —
          springs tuned by hand, haptics timed to the millisecond, sixty frames per
          second treated as a contract.
        </p>
        <div className={styles.ctas} data-entrance="">
          <MagneticLink variant="pill" href="#work" onClick={go('#work')}>
            See the work
          </MagneticLink>
          <MagneticLink variant="line" href="#contact" onClick={go('#contact')}>
            Say hello
          </MagneticLink>
        </div>
      </div>
      <div className={styles.hint} data-entrance="" data-hint="" aria-hidden="true">
        <span className={styles.dribble} />
        <span className={styles.floor} />
        <span className={styles.hintLabel}>scroll</span>
      </div>
    </section>
  );
}
