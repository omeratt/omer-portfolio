import SectionHeading from '../components/SectionHeading';
import ActionLink from '../components/ActionLink';
import GridMark from '../components/GridMark';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import styles from './Story.module.css';

export default function Story() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

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
