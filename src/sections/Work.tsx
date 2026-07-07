import gsap from 'gsap';
import SectionHeading from '../components/SectionHeading';
import WorkItem from './WorkItem';
import { PROJECTS } from '../data/projects';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import { useScene, pinScene, headingOverture, beat, sceneExit } from '../motion/scene';
import styles from './Work.module.css';

export default function Work() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

  // the pinned scene: the projects share one stage slot and take turns —
  // each one enters, holds the spotlight, and hands off to the next
  useScene(ref, (section) => {
    const body = section.querySelector<HTMLElement>('[data-story-body]');
    const sub = section.querySelector<HTMLElement>(`.${styles.sub}`);
    const items = gsap.utils.toArray<HTMLElement>('[data-story-body] > ul > li', section);

    const tl = pinScene(section, 5);
    const head = headingOverture(tl, section, 'sphere');
    beat(tl, sub, 'seat+=0.15');
    // one tween per target, strictly: the article carries the entrance and
    // the li carries the exit, so any stray refresh render can only stamp a
    // state that's already correct for that element's role
    items.forEach((item, i) => {
      const article = item.querySelector<HTMLElement>('article');
      const rule = item.querySelector<HTMLElement>('[data-rule]');
      const blocks = item.querySelectorAll<HTMLElement>('[data-reveal]');
      tl.fromTo(
        article,
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, immediateRender: false },
        i === 0 ? '+=0.25' : '+=0.15',
      );
      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: 'left center',
            duration: 0.7,
            ease: 'snap',
            immediateRender: false,
          },
          '<',
        );
      }
      tl.fromTo(
        blocks,
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: 'snap', stagger: 0.13, immediateRender: false },
        '<+=0.12',
      );
      tl.to({}, { duration: 0.85 }); // the project holds the spotlight
      if (i < items.length - 1) {
        tl.fromTo(
          item,
          { y: 0, autoAlpha: 1 },
          { y: -54, autoAlpha: 0, duration: 0.6, ease: 'power2.in', immediateRender: false },
        );
      }
    });
    tl.to({}, { duration: 0.4 });
    sceneExit(tl, [body, head], 'sphere');
  });

  return (
    <section
      id="work"
      ref={ref}
      tabIndex={-1}
      className={styles.section}
      aria-labelledby="work-title"
    >
      <div className="wrap">
        <SectionHeading
          index="03"
          label="Selected work"
          lines={['Let the work', 'speak']}
          id="work-title"
        />
        <div data-story-body="">
          <p className={`lead ${styles.sub}`} data-reveal="">
            Four things I needed to exist. Each one proves a different muscle.
          </p>
          <ul className={styles.list}>
            {PROJECTS.map((project, i) => (
              <WorkItem key={project.id} project={project} flip={i % 2 === 1} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
