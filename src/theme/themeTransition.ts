type VTDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/**
 * Day flips to night as a circle expanding from the toggle itself —
 * View Transitions API when available, instant swap otherwise.
 */
export function runThemeTransition(
  origin: { x: number; y: number } | undefined,
  apply: () => void,
) {
  const doc = document as VTDocument;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!origin || reduced || typeof doc.startViewTransition !== 'function') {
    apply();
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  doc
    .startViewTransition(apply)
    .ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 640,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      /* transition was skipped by the browser — state already applied */
    });
}
