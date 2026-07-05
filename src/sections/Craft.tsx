import SectionHeading from '../components/SectionHeading';
import EasingCard, { type Curve } from './EasingCard';
import { useReveal } from '../motion/useReveal';
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

  return (
    <section id="craft" ref={ref} className={styles.section} aria-labelledby="craft-title">
      <div className="wrap">
        <SectionHeading
          index="02"
          label="Craft"
          lines={['How things', 'should feel']}
          id="craft-title"
        />
        <p className={`lead ${styles.intro}`} data-reveal="">
          Motion should explain, not decorate — <strong>a dropped frame is a bug, not a
          mood.</strong> That philosophy lives in Reanimated worklets on the UI thread,
          in gesture physics, and in haptics timed to the exact millisecond of impact.
        </p>
        <div className={styles.cards}>
          {CURVES.map((curve, i) => (
            <EasingCard key={curve.name} curve={curve} delay={i * 0.12} />
          ))}
        </div>
        <p className={`label ${styles.outro}`} data-reveal="">
          Not decoration — these are the exact curves this page runs on.
        </p>
      </div>
    </section>
  );
}
