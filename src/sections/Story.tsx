import gsap from 'gsap';
import SectionHeading from '../components/SectionHeading';
import ActionLink from '../components/ActionLink';
import GridMark from '../components/GridMark';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import { useScene, pinScene, headingOverture, beat, dim, sceneExit } from '../motion/scene';
import styles from './Story.module.css';

export default function Story() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

  // the pinned scene: the chapter title opens alone, then the story arrives
  // line by line — the homage grid builds itself the moment 2022 is spoken
  useScene(ref, (section) => {
    const body = section.querySelector<HTMLElement>('[data-story-body]');
    const copy = gsap.utils.toArray<HTMLElement>('[data-story-body] p', section);
    const figure = section.querySelector<HTMLElement>('figure');
    const spans = section.querySelectorAll<HTMLElement>('[data-grid-build] span');

    const tl = pinScene(section, 3.4);
    const head = headingOverture(tl, section, 'flat');
    copy.forEach((p, i) => {
      beat(tl, p, i === 0 ? 'seat+=0.15' : '+=0.3');
      if (i > 0) dim(tl, copy[i - 1], '<+=0.1');
      if (i === 3 && figure) {
        // "one night in 2022" — the first build assembles beside the words
        beat(tl, figure, '<+=0.2');
        tl.fromTo(
          spans,
          { autoAlpha: 0, scale: 0.55 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.5,
            ease: 'arc',
            stagger: { each: 0.012, from: 'random' },
            immediateRender: false,
          },
          '<+=0.15',
        );
      }
    });
    tl.to({}, { duration: 0.5 });
    sceneExit(tl, [body, head], 'flat');
  });

  return (
    <section id="origin" ref={ref} className={styles.section} aria-labelledby="origin-title">
      <div className="wrap">
        <SectionHeading
          index="01"
          label="Origin"
          lines={['It started', 'with a game']}
          id="origin-title"
        />
        <div className={styles.grid} data-story-body="">
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
          <figure className={styles.homage} data-reveal="">
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
