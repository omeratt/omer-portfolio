import type { CSSProperties } from 'react';
import { CELLS, GRID_COLS, GRID_ROWS } from '../three/oaGrid';
import styles from './GridMark.module.css';

interface Props {
  /** cell size in px */
  cell: number;
  gap?: number;
  tone?: 'ink' | 'accent' | 'ghost' | 'heritage';
  /** cells flash orange in a wave on hover (header mark) */
  shimmer?: boolean;
  /** cells assemble on scroll via the reveal grammar (story homage) */
  build?: boolean;
  className?: string;
}

/**
 * The 2022 intro, verbatim: the monogram as a flat CSS grid.
 * Same bitmap the WebGL hero is built from.
 */
export default function GridMark({
  cell,
  gap,
  tone = 'ink',
  shimmer = false,
  build = false,
  className,
}: Props) {
  const g = gap ?? Math.max(1, Math.round(cell / 3.2));
  return (
    <div
      className={[styles.grid, styles[tone], shimmer ? styles.shimmer : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, ${cell}px)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, ${cell}px)`,
        gap: g,
      }}
      {...(build ? { 'data-grid-build': '' } : {})}
      aria-hidden="true"
    >
      {CELLS.map(({ col, row }) => (
        <span
          key={`${col}-${row}`}
          style={
            {
              gridColumn: col + 1,
              gridRow: row + 1,
              '--d': `${col * 26}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
