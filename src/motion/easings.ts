import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

/**
 * The house curves. These exact values are printed in the Craft section —
 * the page demonstrably runs on what it preaches.
 */
export const BEZIER = {
  snap: '0.16, 1, 0.3, 1',
  arc: '0.34, 1.56, 0.64, 1',
} as const;

// "rebound": a drop with two decaying bounces — the dribble.
export const REBOUND_PATH =
  'M0,0 C0.11,0 0.2,1 0.25,1 C0.32,1 0.34,0.72 0.42,0.72 ' +
  'C0.5,0.72 0.52,1 0.58,1 C0.64,1 0.66,0.93 0.7,0.93 C0.76,0.93 0.78,1 1,1';

CustomEase.create('snap', BEZIER.snap.replaceAll(' ', ''));
CustomEase.create('arc', BEZIER.arc.replaceAll(' ', ''));
CustomEase.create('rebound', REBOUND_PATH);

/** Lenis-friendly JS easing (matches the feel of `snap`). */
export const easeExpoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Sample a registered GSAP ease into [0..1] points — used to draw the Craft curves. */
export function sampleEase(name: string, steps = 48): { t: number; v: number }[] {
  const fn = gsap.parseEase(name);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { t, v: fn(t) };
  });
}
