import type { JourneyState } from '../three/formation';

/**
 * The monogram's chapter dials — one shared object. The pinned scene
 * timelines (desktop) or the flow ScrollTriggers (small screens) write it;
 * the WebGL canvas and the stage-opacity ticker read it every frame.
 */
export const journey: JourneyState = { hero: 1, flat: 0, arc: 0, sphere: 0, contact: 0 };

export type Dial = keyof JourneyState;
