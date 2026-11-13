import { useEffect, useState } from 'react';

// One IntersectionObserver per ids list, shared by every consumer.
const shared = new Map();

function subscribe(ids, fn) {
  const key = ids.join();
  let s = shared.get(key);
  if (!s) {
    s = { fns: new Set(), active: ids[0] };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) s.active = e.target.id;
      s.fns.forEach((f) => f(s.active));
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    s.io = io;
    shared.set(key, s);
  }
  s.fns.add(fn);
  fn(s.active);
  return () => {
    s.fns.delete(fn);
    if (!s.fns.size) { s.io.disconnect(); shared.delete(key); }
  };
}

export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => subscribe(ids, setActive), [ids.join()]);
  return active;
}
