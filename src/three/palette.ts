import type { Theme } from '../theme/context';

export interface ScenePalette {
  cube: string;
  orange: string;
  /** the 2022 yellow — the homage grid keeps its original color, verbatim */
  heritage: string;
  ambient: string;
  ambientIntensity: number;
  key: string;
  keyIntensity: number;
  rim: string;
  rimIntensity: number;
}

/**
 * Light = sunlit court: warm porcelain cubes under a high sun.
 * Dark = night court: graphite cubes under cool floodlights,
 * a low orange rim like sodium lamps off-court.
 */
export const SCENE: Record<Theme, ScenePalette> = {
  light: {
    cube: '#fbf7ef',
    orange: '#f4541d',
    heritage: '#f7ba3e',
    ambient: '#fff1dd',
    ambientIntensity: 1.05,
    key: '#ffffff',
    keyIntensity: 1.9,
    rim: '#ffd9a8',
    rimIntensity: 18,
  },
  dark: {
    cube: '#2e2e35',
    orange: '#ff6a2e',
    heritage: '#f7ba3e',
    ambient: '#8f9bd6',
    ambientIntensity: 0.52,
    key: '#eef2ff',
    keyIntensity: 2.7,
    rim: '#ff7a3c',
    rimIntensity: 30,
  },
};
