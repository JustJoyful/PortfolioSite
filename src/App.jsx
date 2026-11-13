import { useEffect } from 'react';
import { BackgroundSketch } from './components/BackgroundSketch';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { LeftRail } from './components/LeftRail';
import { CustomCursor } from './components/CustomCursor';
import { Annotations } from './components/Annotations';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Work } from './sections/Work';
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
    if (css) return;
    const el = document.getElementById('flower');
    const onScroll = () => {
      if (innerWidth < 1024) { el.style.transform = ''; return; }
      const p = Math.min(1, scrollY / innerHeight);
      const e = reduced ? +(p >= 1) : p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      el.style.transform = `translateX(${-11 * e}vw)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full min-h-full text-white bg-black">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:px-4 focus:py-3 text-text">Skip to content</a>
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
      <MobileNav />
      <Annotations />

      <main id="main" className="relative z-10 w-full flex flex-col">
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
