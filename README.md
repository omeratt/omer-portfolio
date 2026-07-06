# Omer Attias — Portfolio

**Interfaces you can feel.** A single-page portfolio for a mobile / motion
engineer, built to demonstrate its own thesis: quiet on the surface,
obsessively engineered underneath.

## Concept

The site tells one story — *origin → mastery* — and the monogram **is** that
story, riding the entire scroll:

- In 2022, Omer hand-placed his initials into a flat CSS grid, cell by cell
  ([the original](https://omeratt.github.io/intro/)).
- The hero renders **that exact bitmap** ([`src/three/oaGrid.ts`](src/three/oaGrid.ts))
  as ~256 WebGL voxels that fly in and assemble on load. One data file feeds the
  3D monogram, the flat homage in the Story section, the header mark, and the
  favicon. *Same cells — more depth.*
- **The letters never leave — they become each chapter**
  ([`src/three/formation.ts`](src/three/formation.ts) +
  [`formations.ts`](src/three/formations.ts)): beside the 2022 homage they
  **flatten back into the original flat grid** (the scroll travels back in
  time); at Craft they unwind into a **shot-arc with a wave running through
  it** — the cubes literally become the curve the section preaches; at Work
  they gather into a **slowly spinning ball** floating in the top corner; at
  the contact sign-off they pull whole again. Between chapters they drift as
  a loose constellation, receded into depth so the copy always reads clean.
  Full circle.
- The cursor bends them gently — and a **click detonates them**: an impulse
  radiates from the click point ([`src/three/blastSim.ts`](src/three/blastSim.ts)),
  cubes tumble through drag-damped free flight, then a magnet wakes in a wave and
  every cube springs home — home being *wherever the journey currently wants
  them*, flat, loose or whole. Click again mid-flight and the new blast rides
  the current motion.

Basketball stays a hint, never a theme: the **orange** (a redhead's hair, a ball),
an orange period that *dribbles* into every heading, a shot-arc easing family, a
latent court-line background drifting behind the page, and a theme toggle where
the ball hops the fence — **sunlit court ↔ night court** (in dark mode, a
floodlight follows the cursor).

## Motion decisions

- **One reveal grammar** ([`src/motion/useReveal.ts`](src/motion/useReveal.ts)):
  masked heading lines, fade-up blocks, self-drawing hairlines, a dribbling dot.
  Every section enters with the same rhythm — that consistency *is* the polish.
- **The curves are the content.** Three custom eases (`snap`, `arc`, `rebound`)
  are registered once ([`src/motion/easings.ts`](src/motion/easings.ts)), used
  everywhere, and *printed + demoed live* in the Craft section. The page runs on
  the exact values it preaches.
- **Lenis + GSAP ScrollTrigger** on a single ticker for smooth scroll and scrubbed
  effects; **React Three Fiber** with `frameloop="demand"`, and three.js is
  lazy-loaded so the copy never waits for WebGL. Every section's content glides
  slightly slower than the page ([`src/motion/useDrift.ts`](src/motion/useDrift.ts)),
  the two-layer court background drifts at two more speeds, and the three-point
  arc draws itself across the full scroll — one page, four depth planes.
- **Shatter physics is pure, dependency-free math** (impulse + drag + underdamped
  return springs, dt-clamped so background tabs can't blow up the integration),
  which makes it directly testable off-screen. Mid-scroll blasts stay honest: cubes
  magnetize to wherever the scroll currently wants them, not to a stale home.
- **Theme flip as a view transition**: a circle expanding from the toggle itself
  (View Transitions API, with a graceful fallback).
- **`prefers-reduced-motion`** is honored end-to-end: no smooth scroll, no
  parallax, no loops; everything renders settled.

## Stack

Vite · React 19 · TypeScript (strict) · three.js + @react-three/fiber ·
GSAP (+ ScrollTrigger, CustomEase) · Lenis · self-hosted variable fonts
(Sora / Inter / JetBrains Mono). No UI kit, no CSS framework — design tokens in
[`src/styles/tokens.css`](src/styles/tokens.css), CSS Modules per component.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the build
```

> Deploying under a sub-path (e.g. GitHub Pages)? Build with
> `npm run build -- --base=/your-repo/`.

## Structure

```
src/
├── styles/      tokens (both themes), base, type + reveal grammar
├── theme/       ThemeProvider, circular view-transition
├── motion/      Lenis+GSAP provider, eases, useReveal / useMagnetic
├── three/       oaGrid (the 2022 bitmap), voxel sim, hero canvas
├── components/  header, theme toggle, grid mark, magnetic link, …
├── sections/    hero, story, craft (easing cards), work (+motifs), contact
└── data/        projects — blurbs, "proves" lines, honest link tags
```

Every file ≤150 lines. Accessibility: semantic landmarks, keyboard-reachable
everything, `aria` on controls, skip-link to the work.

---

© Omer Attias · omeratt1405@gmail.com · [github.com/omeratt](https://github.com/omeratt)
