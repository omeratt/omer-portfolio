import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeCtx {
  theme: Theme;
  /** Pass the toggle's screen position to get the circular reveal. */
  toggle: (origin?: { x: number; y: number }) => void;
}

export const ThemeContext = createContext<ThemeCtx | null>(null);
