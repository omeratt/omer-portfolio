import type { MouseEventHandler, ReactNode } from 'react';
import styles from './ActionLink.module.css';

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** pill = bordered button, line = underlined text link */
  variant?: 'pill' | 'line';
  external?: boolean;
  className?: string;
}

/**
 * The site's link/button. Hover feedback is instant and CSS-driven —
 * the underline sweeps in, the pill lifts a hair — no cursor tracking,
 * no settle lag. Quiet and precise on contact.
 */
export default function ActionLink({
  children,
  href,
  onClick,
  variant = 'line',
  external = false,
  className,
}: Props) {
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
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
