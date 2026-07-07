import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SectionHeading from '../components/SectionHeading';
import ActionLink from '../components/ActionLink';
import GridMark from '../components/GridMark';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import { useMotion } from '../motion/useMotion';
import { journey } from '../three/journey';
import { anchorRef, registerAnchor } from '../three/anchorRegistry';
import { hasWebGL } from '../three/webgl';
import styles from './Story.module.css';

export default function Story() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);
  const voxel = hasWebGL();
  const { reduced } = useMotion();
  const homageRef = useRef<HTMLElement>(null);

  // the homage panel scrubs its own build gate — the 2022 grid assembles as
  // the panel scrolls in and only dissolves once it scrolls away
  useGSAP(
    () => {
      const el = homageRef.current;
      if (!voxel || reduced || !el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 94%',
        // the homage is sticky on desktop — hold the grid for as long as the
        // panel actually stays on screen, i.e. until the section lets go
        endTrigger: document.getElementById('origin'),
        end: 'bottom 32%',
        scrub: true,
        onUpdate: (st) => { journey.originShape = st.progress; },
        onRefresh: (st) => { journey.originShape = st.progress; },
      });
    },
    { dependencies: [voxel, reduced], scope: homageRef },
  );

  return (
    <section id="origin" ref={ref} className={styles.section} aria-labelledby="origin-title">
      <div className="wrap">
        <SectionHeading
          index="01"
          label="Origin"
          lines={['It started', 'with a game']}
          id="origin-title"
        />
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p data-reveal="">
              2004. I was ten, and someone else&rsquo;s game wasn&rsquo;t enough — so I
              built my own. The itch never left.
            </p>
            <p data-reveal="">
              The other constant was a basketball. A jump shot and a spring curve are
              the same discipline: repeat until nothing wobbles, then make it look easy.
            </p>
            <p data-reveal="">
              Years later — after South America, after the degree — I found where it
              all meets: mobile screens, where code has to feel like touch.
            </p>
            <p data-reveal="">
              Then, one night in 2022, I hand-placed my initials into a CSS grid and
              animated them to life. Small, slightly crooked — and I loved it more than
              anything I&rsquo;d shipped. That page is why I do motion.
            </p>
            <p className={styles.closing} data-reveal="">
              The letters drifting around this page are that exact grid, rebuilt in
              WebGL.
              <strong> Same cells — more depth.</strong>
            </p>
            <p className={`label ${styles.footnote}`} data-reveal="">
              B.Sc. Software Engineering · graduated with honors
            </p>
          </div>
          <figure
            ref={(el) => {
              homageRef.current = el;
              registerAnchor('zone:origin-grid', el);
            }}
            className={styles.homage}
            data-reveal=""
            data-delay="0.15"
          >
            {voxel ? (
              /* the voxel swarm assembles the 2022 grid inside this window */
              <div ref={anchorRef('origin-grid')} className={styles.voxelGrid} aria-hidden="true" />
            ) : (
              <GridMark cell={11} tone="heritage" build className={styles.homageGrid} />
            )}
            <figcaption
              className={styles.caption}
              data-reveal=""
              data-reveal-start="top 72%"
            >
              <span className="label">2022 — the first build</span>
              <ActionLink href="https://omeratt.github.io/intro/" external>
                The original, untouched
              </ActionLink>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
