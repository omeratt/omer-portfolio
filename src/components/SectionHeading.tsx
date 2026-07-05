import styles from './SectionHeading.module.css';

interface Props {
  index: string;
  label: string;
  lines: string[];
  /** id for the h2, so sections can aria-labelledby it */
  id?: string;
}

/**
 * Every section opens the same way: mono label, masked heading lines,
 * and the signature — an orange period that dribbles in last.
 */
export default function SectionHeading({ index, label, lines, id }: Props) {
  const last = lines.length - 1;
  return (
    <div className={styles.head} data-lines-root="">
      <p className="label" data-reveal="">
        <em>{index}</em>&ensp;·&ensp;{label}
      </p>
      <h2 className={`display ${styles.title}`} id={id}>
        {lines.map((line, i) => (
          <span className="mask" key={line}>
            <span data-line="">
              {line}
              {i === last && <span className="dot" data-dot="" aria-hidden="true" />}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
