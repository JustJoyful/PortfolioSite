import { useEffect } from 'react';
import { PORTFOLIO_DATA } from '../data/content';

// The name's boxes in page px (equal to viewport px at scroll 0): the first letter, and the cap-height band of line one.
// Bricolage's cap height is 0.66em and its ascent 0.93em, so the cap top sits 0.27em below the inline box top.
export function measureName() {
  const h1 = document.getElementById('hero-title'), text = h1?.firstChild;
  if (!text) return null;
  const range = document.createRange();
  range.setStart(text, 0); range.setEnd(text, 1);
  const j = range.getBoundingClientRect(), box = h1.getBoundingClientRect(), fs = parseFloat(getComputedStyle(h1).fontSize);
  return {
    left: box.left, bottom: box.bottom + scrollY,
    J: { left: j.left, width: j.width, capTop: j.top + scrollY + 0.27 * fs, capH: 0.66 * fs },
  };
}

// Layer 1: the real h1, under the flower. It is absolute (scrolls with the page); its left edge is published as --hero-x
// and its bottom as --hero-bottom, so the sentence and buttons in Hero sit under it.
export const HeroName = () => {
  useEffect(() => {
    const set = () => {
      const m = measureName();
      if (!m) return;
      const root = document.documentElement.style;
      root.setProperty('--hero-x', `${Math.round(m.left)}px`);
      root.setProperty('--hero-bottom', `${Math.round(m.bottom)}px`);
    };
    set();
    document.fonts?.ready.then(set);
    addEventListener('resize', set);
    return () => removeEventListener('resize', set);
  }, []);

  return (
    <header className="absolute top-0 left-0 w-full h-[100svh] z-[1] pointer-events-none">
      <div className="absolute left-5 md:left-12 lg:left-auto lg:right-12 top-[var(--hero-top)]">
        <h1 id="hero-title" className="font-display font-semibold text-hero text-text tracking-[-0.045em] lg:w-min">
          {PORTFOLIO_DATA.hero.name}
        </h1>
      </div>
    </header>
  );
};
