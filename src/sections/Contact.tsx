import SectionHeading from '../components/SectionHeading';
import ActionLink from '../components/ActionLink';
import CopyEmail from '../components/CopyEmail';
import { useReveal } from '../motion/useReveal';
import { useDrift } from '../motion/useDrift';
import { useScene, pinScene, headingOverture, beat } from '../motion/scene';
import styles from './Contact.module.css';

export default function Contact() {
  const ref = useReveal<HTMLElement>();
  useDrift(ref);

  // the closing scene: the letters reassemble with the title and never
  // leave again — the story ends the way it began, whole
  useScene(ref, (section) => {
    const pitch = section.querySelector<HTMLElement>(`.${styles.pitch}`);
    const email = section.querySelector<HTMLElement>(`.${styles.emailBlock}`);
    const socials = section.querySelector<HTMLElement>(`.${styles.socials}`);

    const tl = pinScene(section, 1.9);
    headingOverture(tl, section, 'contact');
    beat(tl, pitch, 'seat+=0.15');
    beat(tl, email, '+=0.25');
    beat(tl, socials, '+=0.2');
    tl.to({}, { duration: 0.6 });
  });

  return (
    <section
      id="contact"
      ref={ref}
      className={styles.section}
      aria-labelledby="contact-title"
      data-story-hold=""
    >
      <div className="wrap">
        <SectionHeading
          index="04"
          label="Contact"
          lines={['Make it', 'feel right']}
          id="contact-title"
        />
        <p className={`lead ${styles.pitch}`} data-reveal="">
          I&rsquo;m happiest deep inside an animation curve, a gesture, or a native
          module everyone said couldn&rsquo;t be done. Building something that should
          feel right? Write to me.
          <strong> No forms — just email.</strong>
        </p>
        <div className={styles.emailBlock} data-reveal="" data-delay="0.1">
          <CopyEmail />
        </div>
        <div className={styles.socials} data-reveal="" data-delay="0.18">
          <ActionLink href="https://github.com/omeratt" external>
            GitHub
          </ActionLink>
          <ActionLink href="https://www.linkedin.com/in/omer-attias/" external>
            LinkedIn
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
