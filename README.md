# Omer Attias — Portfolio

**Interfaces with muscle memory.** A single-page portfolio for a React Native /
motion engineer, built to demonstrate its own thesis: quiet on the surface,
obsessively engineered underneath.

## Concept

The site tells one story — *origin → mastery* — and the hero **is** that story:

- In 2022, Omer hand-placed his initials into a flat CSS grid, cell by cell
  ([the original](https://omeratt.github.io/intro/)).
- The hero renders **that exact bitmap** ([`src/three/oaGrid.ts`](src/three/oaGrid.ts))
  as ~256 WebGL voxels that fly in and assemble on load. One data file feeds the
  3D monogram, the flat homage in the Story section, the header mark, and the
  favicon. *Same cells — more depth.*
- Scrolling away scatters the voxels; scrolling back reassembles them. The cursor
  bends them gently.

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
  effects; **React Three Fiber** with `frameloop="demand"` — the canvas renders
  only while the hero is on screen, and three.js is lazy-loaded so the copy never
  waits for WebGL.
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
