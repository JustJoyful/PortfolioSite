import { useEffect, useRef } from 'react';

const link = 'inline-flex items-center min-h-11 px-3 text-sm text-text-muted';

export const MobileNav = () => {
  const bar = useRef(null);
  const line = useRef(null);

  useEffect(() => {
    let last = scrollY;
    const show = (on) => { bar.current.style.transform = on ? 'none' : 'translateY(-100%)'; };
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      line.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (y < 10 || y < last) show(true);
      else if (y > last) show(false);
      last = y;
    };
    const onFocus = () => show(true);
    const el = bar.current;
    addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('focusin', onFocus);
    onScroll();
    return () => { removeEventListener('scroll', onScroll); el.removeEventListener('focusin', onFocus); };
  }, []);

  return (
    <header
      ref={bar}
      className="fixed top-0 inset-x-0 z-30 lg:hidden bg-bg"
      style={{ paddingTop: 'env(safe-area-inset-top)', transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <nav aria-label="Primary" className="flex items-center justify-between px-2">
        <a href="#hero" aria-label="Joydeep Das, top of page" className="inline-flex items-center min-h-11 px-3 font-display text-lg text-text">JD</a>
        <span className="flex">
          <a href="#about" className={link}>About</a>
          <a href="#work" className={link}>Work</a>
          <a href="#contact" className={link}>Contact</a>
        </span>
      </nav>
      <div ref={line} aria-hidden="true" className="absolute bottom-0 left-0 w-full h-px origin-left" /* taste-skill-ignore: progress line, a gauge */ style={{ background: 'var(--bloom)', transform: 'scaleX(0)' }} />
    </header>
  );
};
