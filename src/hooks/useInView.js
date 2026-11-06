import { useCallback, useState } from 'react';

// One observer for every Reveal; each element fires once, then is released.
const callbacks = new WeakMap();
let io;
const observer = () => (io ??= new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    callbacks.get(e.target)?.();
    callbacks.delete(e.target);
    io.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -8% 0px' }));

export const useInView = () => {
  const [seen, setSeen] = useState(false);
  const ref = useCallback((el) => {
    if (!el) return;
    callbacks.set(el, () => setSeen(true));
    observer().observe(el);
  }, []);
  return [ref, seen];
};
