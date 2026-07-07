import SectionHeading from '../components/SectionHeading';
import WorkItem from './WorkItem';
import { PROJECTS } from '../data/projects';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import styles from './Work.module.css';

export default function Work() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

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
        <p className={`lead ${styles.sub}`} data-reveal="">
          Four things I needed to exist. Each one proves a different muscle.
        </p>
        <ul className={styles.list}>
          {PROJECTS.map((project, i) => (
            <WorkItem key={project.id} project={project} index={i} flip={i % 2 === 1} />
          ))}
        </ul>
      </div>
    </section>
  );
}
