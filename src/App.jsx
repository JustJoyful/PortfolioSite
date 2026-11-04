import { useEffect, useRef, useState } from 'react';
import { BackgroundSketch } from './components/BackgroundSketch';
import { StarField } from './components/StarField';
import { LeftRail } from './components/LeftRail';
import { CustomCursor } from './components/CustomCursor';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Projects } from './sections/Projects';
import { Contact } from './sections/Contact';

function App() {
  const flowerContainerRef = useRef(null);
  const [sketchPaused, setSketchPaused] = useState(false);

  useEffect(() => {
    const vh = window.innerHeight;
    const TARGET_X = -31; // vw units (exactly centers in the 38vw left space)

    const onScroll = () => {
      const scrollY = window.scrollY;

      // Pause p5 when scrolled deep past ~2.8 viewports — saves GPU/battery
      setSketchPaused(scrollY > vh * 2.8);

      // Disable flower translation below lg (< 1024px)
      if (window.innerWidth < 1024) return;

      const progress = Math.min(1, scrollY / vh);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const xVw = TARGET_X * eased;
      if (flowerContainerRef.current) {
        flowerContainerRef.current.style.transform = `translateX(${xVw}vw)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full min-h-full text-white bg-black">
      {/* Custom cursor — hidden on touch devices */}
      <CustomCursor />

      {/* Layer 0 — P5.js flower animation (scroll-shifted on desktop, static/dimmed on mobile) */}
      <div
        ref={flowerContainerRef}
        className="fixed inset-0 pointer-events-auto z-0 md:z-0 -z-10 lg:opacity-100 opacity-30"
        style={{ transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)', willChange: 'transform' }}
      >
        <BackgroundSketch paused={sketchPaused} />
      </div>

      {/* Layer 1 — Starfield */}
      <StarField />

      {/* Layer 2 — Fixed left rail (desktop only) */}
      <LeftRail />

      {/* Layer 3 — Scrollable content with mobile glassmorphism backdrop */}
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
