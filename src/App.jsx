import { useEffect } from 'react';
import { BackgroundSketch } from './components/BackgroundSketch';
import { LeftRail } from './components/LeftRail';
import { CustomCursor } from './components/CustomCursor';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Projects } from './sections/Projects';
import { Contact } from './sections/Contact';
import { useActiveSection } from './hooks/useActiveSection';
import { getEngine } from './engine/handle';

const IDS = ['hero', 'about', 'work', 'contact'];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = CSS.supports('animation-timeline: scroll()');

function App() {
  const section = useActiveSection(IDS);

  // Engine loads lazily; re-apply the current section once it exists.
  useEffect(() => {
    const apply = () => getEngine()?.setSection(section);
    apply();
    window.addEventListener('engine:change', apply);
    return () => window.removeEventListener('engine:change', apply);
  }, [section]);

  // JS fallback for the scroll slide when CSS scroll-driven animation is unsupported.
  useEffect(() => {
    if (reduced || css) return;
    const el = document.getElementById('flower');
    const onScroll = () => {
      if (innerWidth < 1024) { el.style.transform = ''; return; }
      const p = Math.min(1, scrollY / innerHeight);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      el.style.transform = `translateX(${-31 * e}vw)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full min-h-full text-white bg-black">
      <CustomCursor />

      {/* Layer 0 — bloom engine (slid left on desktop via CSS scroll timeline, see index.css) */}
      <div
        id="flower"
        className="fixed inset-0 pointer-events-auto z-0"
        style={{ willChange: 'transform' }}
      >
        <BackgroundSketch />
      </div>

      <LeftRail />

      <div className="relative z-10 w-full flex flex-col bg-black/40 lg:bg-transparent">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </div>
    </div>
  );
}

export default App;
