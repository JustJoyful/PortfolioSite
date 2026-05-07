import { useEffect, useRef } from 'react';
import { BackgroundSketch } from './components/BackgroundSketch';
import { StarField } from './components/StarField';
import { LeftRail } from './components/LeftRail';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Projects } from './sections/Projects';
import { Contact } from './sections/Contact';

function App() {
  const flowerContainerRef = useRef(null);

  useEffect(() => {
    const vh = window.innerHeight;
    const TARGET_X = -27.5; // vw units (moves from 50vw center to 22.5vw, exactly centering it in the 45vw left space)

    const onScroll = () => {
      const scrollY = window.scrollY;
      // Progress 0→1 over the first viewport height
      const progress = Math.min(1, scrollY / vh);
      // Ease: smooth cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const xVw = TARGET_X * eased;
      // Write directly to DOM — zero React re-renders
      if (flowerContainerRef.current) {
        flowerContainerRef.current.style.transform = `translateX(${xVw}vw)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once to set initial position
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full min-h-full text-white bg-black">
      {/* Layer 0 — P5.js flower animation (scroll-shifted) */}
      <div
        ref={flowerContainerRef}
        className="fixed inset-0 z-0 pointer-events-auto"
        style={{ transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)', willChange: 'transform' }}
      >
        <BackgroundSketch />
      </div>

      {/* Layer 1 — Starfield */}
      <StarField />

      {/* Layer 2 — Fixed left rail */}
      <LeftRail />

      {/* Layer 3 — Scrollable content */}
      <div className="relative z-10 w-full flex flex-col">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </div>
    </div>
  );
}

export default App;
