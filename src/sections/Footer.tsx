import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <span>© 2026 Omer Attias</span>
        <span className={styles.middle}>
          Designed &amp; built from scratch — React, R3F, GSAP, Lenis
        </span>
        <span className={styles.heritage} title="#f7ba3e — the first orange, 2022">
          <span className={styles.swatch} aria-hidden="true" />
          est. 2022
        </span>
      </div>
    </footer>
  );
}
