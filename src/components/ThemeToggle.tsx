import { useRef } from 'react';
import { useTheme } from '../theme/useTheme';
import styles from './ThemeToggle.module.css';

/**
 * Sunlit court ↔ night court. The knob is the ball: it hops the fence
 * on an arc, the sun sets, floodlight stars come up — and the whole page
 * follows as a circle expanding from right here.
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  const dark = theme === 'dark';

  const onClick = () => {
    const r = ref.current?.getBoundingClientRect();
    toggle(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Night mode"
      className={styles.toggle}
      onClick={onClick}
      data-entrance=""
    >
      <span className={`${styles.sky} ${styles.day}`} aria-hidden="true" />
      <span className={`${styles.sky} ${styles.night}`} aria-hidden="true">
        <span className={styles.stars} />
      </span>
      <span className={styles.knobTrack} aria-hidden="true">
        <span key={theme} className={styles.knob} />
      </span>
    </button>
  );
}
