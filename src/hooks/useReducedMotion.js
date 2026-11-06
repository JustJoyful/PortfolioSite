import { useSyncExternalStore } from 'react';

const Q = '(prefers-reduced-motion: reduce)';
const subscribe = (cb) => {
  const m = matchMedia(Q);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

export const useReducedMotion = () => useSyncExternalStore(subscribe, () => matchMedia(Q).matches, () => false);
