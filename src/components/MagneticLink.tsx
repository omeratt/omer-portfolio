import type { MouseEventHandler, ReactNode } from 'react';
import { useMagnetic } from '../motion/useMagnetic';
import styles from './MagneticLink.module.css';

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** pill = bordered button, line = underlined text link */
  variant?: 'pill' | 'line';
  external?: boolean;
  className?: string;
}

export default function MagneticLink({
  children,
  href,
  onClick,
  variant = 'line',
  external = false,
  className,
}: Props) {
  const magnet = useMagnetic<HTMLElement>(0.24);
  const setNode = (node: HTMLElement | null) => {
    magnet.current = node;
  };
  const cls = [styles.base, styles[variant], className].filter(Boolean).join(' ');

  const inner = (
    <>
      <span className={styles.text}>{children}</span>
      {external && (
        <span className={styles.arrow} aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        ref={setNode}
        href={href}
        className={cls}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button ref={setNode} type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
