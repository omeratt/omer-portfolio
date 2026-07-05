import SectionHeading from '../components/SectionHeading';
import MagneticLink from '../components/MagneticLink';
import CopyEmail from '../components/CopyEmail';
import { useReveal } from '../motion/useReveal';
import styles from './Contact.module.css';

export default function Contact() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      id="contact"
      ref={ref}
      className={styles.section}
      aria-labelledby="contact-title"
    >
      <div className="wrap">
        <SectionHeading
          index="04"
          label="Contact"
          lines={['Make it', 'feel right']}
          id="contact-title"
        />
        <p className={`lead ${styles.pitch}`} data-reveal="">
          I&rsquo;m happiest deep inside an animation curve, a gesture handler, or a
          native module everyone said couldn&rsquo;t be done. If you&rsquo;re building
          something that deserves that level of care — write to me.
          <strong> No forms, no funnels. Just email.</strong>
        </p>
        <div className={styles.emailBlock} data-reveal="" data-delay="0.1">
          <CopyEmail />
        </div>
        <div className={styles.socials} data-reveal="" data-delay="0.18">
          <MagneticLink href="https://github.com/omeratt" external>
            GitHub
          </MagneticLink>
          <MagneticLink href="https://www.linkedin.com/in/omer-attias/" external>
            LinkedIn
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}
