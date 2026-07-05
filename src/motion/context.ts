import { createContext } from 'react';
import type Lenis from 'lenis';

export interface MotionCtx {
  /** Fonts are in — entrance choreography may start. */
  ready: boolean;
  /** prefers-reduced-motion: everything settles instantly. */
  reduced: boolean;
  lenis: Lenis | null;
  scrollTo: (selector: string) => void;
}

export const MotionContext = createContext<MotionCtx | null>(null);
