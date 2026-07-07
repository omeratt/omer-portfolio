import gsap from 'gsap';
import SectionHeading from '../components/SectionHeading';
import EasingCard, { type Curve } from './EasingCard';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import { useScene, pinScene, headingOverture, beat, sceneExit } from '../motion/scene';
import { BEZIER } from '../motion/easings';
import styles from './Craft.module.css';

const CURVES: Curve[] = [
  {
    name: 'Snap',
    ease: 'snap',
    code: `cubic-bezier(${BEZIER.snap})`,
    blurb: 'For things that must feel instant — arrive fast, settle soft.',
  },
  {
    name: 'Arc',
    ease: 'arc',
    code: `cubic-bezier(${BEZIER.arc})`,
    blurb: 'A good transition has a flight path: up, over, in.',
  },
  {
    name: 'Rebound',
    ease: 'rebound',
    code: 'custom — two decaying bounces',
    blurb: 'For play. Land, bounce once, sit down.',
  },
];

export default function Craft() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

  // the pinned scene: each curve card is dealt onto the stage with the very
  // ease it preaches, and replays its demo the moment it lands
  useScene(ref, (section) => {
    const body = section.querySelector<HTMLElement>('[data-story-body]');
    const intro = section.querySelector<HTMLElement>(`.${styles.intro}`);
    const outro = section.querySelector<HTMLElement>(`.${styles.outro}`);
    const cards = gsap.utils.toArray<HTMLElement>('[data-seq] [data-reveal]', section);

    const tl = pinScene(section, 3);
    const head = headingOverture(tl, section, 'arc');
    beat(tl, intro, 'seat+=0.15');
    cards.forEach((card, i) => {
      tl.fromTo(
        card,
        { y: 64, autoAlpha: 0, rotation: 2.2, transformOrigin: '50% 100%' },
        {
          y: 0,
          autoAlpha: 1,
          rotation: 0,
          duration: 0.9,
          ease: 'arc',
          immediateRender: false,
          onComplete: () => card.dispatchEvent(new Event('replay-demo')),
        },
        i === 0 ? '+=0.3' : '<+=0.35',
      );
    });
    beat(tl, outro, '+=0.25');
    tl.to({}, { duration: 0.5 });
    sceneExit(tl, [body, head], 'arc');
  });

  return (
    <section id="craft" ref={ref} className={styles.section} aria-labelledby="craft-title">
      <div className="wrap">
        <SectionHeading
          index="02"
          label="Craft"
          lines={['How things', 'should feel']}
          id="craft-title"
        />
        <div data-story-body="">
          <p className={`lead ${styles.intro}`} data-reveal="">
            Motion should explain, not decorate — <strong>a dropped frame is a bug, not
            a mood.</strong>
          </p>
          <div className={styles.cards} data-seq="">
            {CURVES.map((curve) => (
              <EasingCard key={curve.name} curve={curve} />
            ))}
          </div>
          <p className={`label ${styles.outro}`} data-reveal="">
            Not decoration — these are the exact curves this page runs on.
          </p>
        </div>
      </div>
    </section>
  );
}
