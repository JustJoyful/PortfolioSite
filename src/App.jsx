import { useEffect } from 'react';
import { BackgroundSketch } from './components/BackgroundSketch';
import { Sky } from './components/Sky';
import { HeroName } from './components/HeroName';
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

function App() {
  const section = useActiveSection(IDS);

  // Engine loads lazily; re-apply the current section once it exists.
  useEffect(() => {
    const apply = () => getEngine()?.setSection(section);
    apply();
    window.addEventListener('engine:change', apply);
    return () => window.removeEventListener('engine:change', apply);
  }, [section]);

  return (
    <div className="relative w-full min-h-full text-white bg-black">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:px-4 focus:py-3 text-text">Skip to content</a>
      <CustomCursor />

      {/* Layers: 0 Sky (stars), 1 the name (h1), 2 the flower (transparent WebGL canvas plus embers), 10 main. */}
      <Sky />
      <HeroName />
      <div
        id="flower"
        className="fixed inset-0 pointer-events-auto"
        style={{ willChange: 'transform', zIndex: 2 }}
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
