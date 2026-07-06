import SectionHeading from '../components/SectionHeading';
import ActionLink from '../components/ActionLink';
import GridMark from '../components/GridMark';
import { useReveal } from '../motion/useReveal';
import styles from './Story.module.css';

export default function Story() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="origin" ref={ref} className={styles.section} aria-labelledby="origin-title">
      <div className="wrap">
        <SectionHeading
          index="01"
          label="Origin"
          lines={['Twenty years of', 'the same obsession']}
          id="origin-title"
        />
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p data-reveal="">
              It started in 2004: a ten-year-old building his own game because playing
              someone else&rsquo;s wasn&rsquo;t enough. The obsession never left. It just
              kept getting better tools.
            </p>
            <p data-reveal="">
              The other constant was basketball. A jump shot and a spring curve are the
              same discipline — repeat the motion until nothing wobbles, then keep going
              until it looks effortless. Everything I ship is built with that patience.
            </p>
            <p data-reveal="">
              A long trip through South America and Thailand later, I studied software
              engineering properly, then went deep into the one place where design,
              physics and native code all meet: mobile interfaces.
            </p>
            <p data-reveal="">
              One night in 2022, I hand-placed my initials into a CSS grid, cell by cell,
              and animated them to life. It was small, slightly crooked, and I loved it
              more than anything I&rsquo;d shipped before. That page is why I do motion.
            </p>
            <p className={styles.closing} data-reveal="">
              The monogram at the top of this page is that exact grid, rebuilt in WebGL.
              <strong> Same cells — more depth.</strong>
            </p>
            <p className={`label ${styles.footnote}`} data-reveal="">
              B.Sc. Software Engineering · graduated with honors
            </p>
          </div>
          <figure className={styles.homage} data-reveal="" data-delay="0.15">
            <GridMark cell={11} tone="heritage" build className={styles.homageGrid} />
            <figcaption className={styles.caption}>
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
