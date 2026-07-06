import { useEffect, useRef } from 'react';

/** Tracks the cursor in normalized device coordinates (pointer-fine only). */
export function usePointerNdc() {
  const ndcRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      ndcRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return ndcRef;
}
