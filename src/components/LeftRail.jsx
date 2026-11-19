import { useEffect, useRef } from 'react';
import { useActiveSection } from '../hooks/useActiveSection';

export const SECTIONS = [['hero', 'Home'], ['about', 'About'], ['work', 'Work'], ['contact', 'Contact']];
const IDS = SECTIONS.map(([id]) => id);

export const LeftRail = () => {
  const activeId = useActiveSection(IDS);
  const gauge = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      gauge.current.style.transform = `scaleY(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => removeEventListener('scroll', onScroll);
  }, []);
  const vertical = { writingMode: 'vertical-rl', transform: 'rotate(180deg)' };

  return (
    <aside className="fixed left-0 top-0 h-full w-16 z-20 hidden lg:flex flex-col items-center justify-between py-12 pointer-events-none select-none">
      {/* taste-skill-ignore: scroll gauge (information), same as the mobile progress line */}
      <div ref={gauge} aria-hidden="true" className="absolute right-0 top-0 h-full w-0.5 origin-top bg-leaf" style={{ transform: 'scaleY(0)' }} />
      <div className="text-xs text-text-faint" style={vertical}>Joydeep Das</div>

      <nav aria-label="Sections" className="flex flex-col items-center pointer-events-auto">
        {SECTIONS.map(([id, name]) => {
          const on = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-label={name}
              aria-current={on ? 'location' : undefined}
              className="group relative flex items-center justify-center w-11 h-11"
            >
              <span
                aria-hidden="true"
                className="block w-0.5 rounded-sm"
                style={{ height: on ? 24 : 6, background: on ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', transition: 'height 0.4s ease, background 0.4s ease' }}
              />
              <span aria-hidden="true" className="absolute left-full ml-1 px-2 text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                {name}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="text-xs text-text-faint tabular-nums" style={vertical}>{new Date().getFullYear()}</div>
    </aside>
  );
};
