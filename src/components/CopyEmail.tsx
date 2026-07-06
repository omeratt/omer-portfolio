import { useRef, useState } from 'react';
import styles from './CopyEmail.module.css';

const EMAIL = 'omeratt1405@gmail.com';

export default function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  const markCopied = () => {
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2400);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      markCopied();
    } catch {
      // older/locked-down browsers: fall back to a transient selection
      const field = document.createElement('textarea');
      field.value = EMAIL;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      if (ok) markCopied();
    }
  };

  return (
    <div className={styles.row}>
      <a className={`display ${styles.email}`} href={`mailto:${EMAIL}`}>
        {EMAIL}
      </a>
      <button
        type="button"
        className={styles.copy}
        onClick={copy}
        aria-label="Copy email address"
      >
        {copied ? (
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <path
              d="M2.5 8.5 6 12l7.5-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 3H4a2 2 0 0 0-2 2v7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <span className={styles.toast} data-on={copied || undefined} role="status">
        Copied — talk soon<span className={styles.toastDot} />
      </span>
    </div>
  );
}
