import { useCallback, useMemo, useRef, type ComponentType } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ActionLink from '../components/ActionLink';
import NetMotif from './motifs/NetMotif';
import PlayMotif from './motifs/PlayMotif';
import PaginationMotif from './motifs/PaginationMotif';
import MergeMotif from './motifs/MergeMotif';
import { useMotion } from '../motion/useMotion';
import { journey } from '../three/journey';
import { anchorRef, registerAnchor } from '../three/anchorRegistry';
import { hasWebGL } from '../three/webgl';
import type { MotifKind, Project } from '../data/projects';
import styles from './WorkItem.module.css';

const MOTIFS: Record<MotifKind, ComponentType> = {
  net: NetMotif,
  play: PlayMotif,
  pagination: PaginationMotif,
  merge: MergeMotif,
};

interface Props {
  project: Project;
  /** position in the list — binds the panel to its voxel shape (work-N) */
  index: number;
  flip: boolean;
}

export default function WorkItem({ project, index, flip }: Props) {
  const voxel = hasWebGL();
  const { reduced } = useMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const Motif = MOTIFS[project.motif];

  // stable callback refs — a fresh closure per render would detach/reattach
  // the anchor registration on every re-render
  const glassRef = useCallback(
    (el: HTMLDivElement | null) => {
      panelRef.current = el;
      registerAnchor(`zone:work-${index}`, el);
    },
    [index],
  );
  const motifRef = useMemo(() => anchorRef(`work-${index}`), [index]);

  // each panel scrubs its own build gate — shapes accumulate down the
  // section, each assembling as its panel scrolls into view
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!voxel || reduced || !panel) return;
      ScrollTrigger.create({
        trigger: panel,
        start: 'top 94%',
        end: 'bottom 16%',
        scrub: true,
        onUpdate: (st) => { journey.workShapes[index] = st.progress; },
        onRefresh: (st) => { journey.workShapes[index] = st.progress; },
      });
    },
    { dependencies: [voxel, reduced, index], scope: panelRef },
  );

  return (
    <li className={styles.item} data-flip={flip || undefined}>
      <div className="hairline" data-rule="" />
      <article className={styles.grid}>
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
        <figure className={styles.visual} data-reveal="" data-delay="0.12">
          <div ref={glassRef} className={`glass-panel ${styles.panel}`}>
            {voxel ? (
              /* the voxel window — this project's motif assembles in here */
              <div ref={motifRef} className={styles.motifStage} aria-hidden="true" />
            ) : (
              <Motif />
            )}
          </div>
          <figcaption
            className={`label ${styles.proves}`}
            data-reveal=""
            data-reveal-start="top 58%"
            data-reveal-gate={voxel ? `work-${index}` : undefined}
          >
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
