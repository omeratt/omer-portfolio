import type { ComponentType } from 'react';
import ActionLink from '../components/ActionLink';
import NetMotif from './motifs/NetMotif';
import PlayMotif from './motifs/PlayMotif';
import PaginationMotif from './motifs/PaginationMotif';
import MergeMotif from './motifs/MergeMotif';
import type { MotifKind, Project } from '../data/projects';
import styles from './WorkItem.module.css';

const MOTIFS: Record<MotifKind, ComponentType> = {
  net: NetMotif,
  play: PlayMotif,
  pagination: PaginationMotif,
  merge: MergeMotif,
};

export default function WorkItem({ project, flip }: { project: Project; flip: boolean }) {
  const Motif = MOTIFS[project.motif];

  return (
    <li className={styles.item} data-flip={flip || undefined}>
      <div className="hairline" data-rule="" />
      <article className={styles.grid} data-seq="">
        <div className={styles.text}>
          <span className={`label ${styles.index}`} data-reveal="">
            {project.index}
          </span>
          <h3 className={`display ${styles.title}`} data-reveal="">
            {project.title}
          </h3>
          <p className={styles.blurb} data-reveal="">
            {project.blurb}
          </p>
          <div className={styles.links} data-reveal="">
            {project.links.map((link) => (
              <span key={link.href} className={styles.linkWrap}>
                <ActionLink href={link.href} external>
                  {link.label}
                </ActionLink>
                {link.tag && (
                  <span className={styles.tag} data-tag={link.tag}>
                    {link.tag}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
        <figure className={styles.visual} data-reveal="">
          <div className={styles.panel}>
            <Motif />
          </div>
          <figcaption className={`label ${styles.proves}`}>
            <span className={styles.arrow} aria-hidden="true">
              ↳
            </span>
            Proves: {project.proves}
          </figcaption>
        </figure>
      </article>
    </li>
  );
}
