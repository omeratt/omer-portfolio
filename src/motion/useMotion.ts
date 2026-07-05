import { useContext } from 'react';
import { MotionContext } from './context';

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used inside <MotionProvider>');
  return ctx;
}
