import { useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data/content';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Reveal } from '../components/ui/Reveal';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ProjectSlide } from './work/ProjectSlide';

const Arrow = ({ flip }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={flip ? 'rotate-180' : ''}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const arrowBtn = 'inline-flex items-center justify-center w-11 h-11 bg-surface text-text hover:bg-bloom hover:text-bg transition-colors';

// One project per screen on a native scroll-snap track: swipe, trackpad, tabs, arrow buttons and arrow keys all move it.
export const Work = () => {
  const { projects } = PORTFOLIO_DATA;
  const track = useRef(null);
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const n = projects.length;

  const go = (k) => {
    const t = track.current;
    t.scrollTo({ left: ((k + n) % n) * t.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(i + (e.key === 'ArrowRight' ? 1 : -1)); }
  };

  return (
    <section id="work" aria-labelledby="work-title" className="w-full py-24 lg:py-28">
      <div className="px-5 md:px-12 lg:px-24" onKeyDown={onKey}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 mb-10 lg:mb-14">
          <SectionHeading id="work-title" title="Work" />
          <div className="flex items-center gap-6">
            <nav aria-label="Projects" className="hidden md:flex gap-6">
              {projects.map((p, k) => (
                <a
                  key={p.id}
                  href={`#work-${p.id}`}
                  data-tab
                  aria-current={k === i ? 'true' : undefined}
                  onClick={(e) => { e.preventDefault(); go(k); }}
                  className={`inline-flex items-center justify-center min-h-11 min-w-11 text-base border-b-2 transition-colors ${k === i ? 'text-text border-bloom' : 'text-text-muted border-transparent hover:text-text'}`} /* taste-skill-ignore: current-tab state, not a divider */
                >
                  {p.title}
                </a>
              ))}
            </nav>
            <p className="md:hidden text-sm text-text-muted tabular-nums" aria-live="polite">{i + 1} of {n}</p>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous project" onClick={() => go(i - 1)} className={arrowBtn}><Arrow flip /></button>
              <button type="button" aria-label="Next project" onClick={() => go(i + 1)} className={arrowBtn}><Arrow /></button>
            </div>
          </div>
        </div>
        <Reveal>
          <div
            ref={track}
            data-track
            onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((p, k) => <ProjectSlide key={p.id} p={p} active={k === i} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
