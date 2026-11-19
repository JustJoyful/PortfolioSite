import { useEffect, useRef, useState } from 'react';
import { setEngine } from '../engine/handle';
import { measureName } from './HeroName';

const params = new URLSearchParams(window.location.search);
const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 1));

export const BackgroundSketch = ({ paused = false }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false, engine = null;
    let place = null; // the hero geometry, loaded with the engine
    const layout = () => {
      const m = engine && place && measureName();
      if (!m) return;
      const W = innerWidth, H = innerHeight, d = W >= 1024;
      const L = (d ? place.desktopLayout : place.mobileLayout)({ W, H, J: m.J, variant: engine.stats().variant });
      engine.setLayout({
        centerX: L.centerX, centerY: L.centerY, scale: L.scale, falloff: d, stem: d,
        column: d ? { centerX: 32 + place.COLUMN.x * W, centerY: null, scale: place.COLUMN.scale } : null,
      });
      engine.setScroll(scrollY / H);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; engine?.setScroll(scrollY / innerHeight); });
    };
    let t;
    let w = innerWidth, h = innerHeight;
    const onResize = () => {
      const small = matchMedia('(pointer: coarse)').matches && innerWidth === w && Math.abs(innerHeight - h) < 160;
      if (small) return; // URL-bar show/hide
      w = innerWidth; h = innerHeight;
      clearTimeout(t); t = setTimeout(layout, 150);
    };

    const id = idle(async () => {
      if (dead) return;
      const { createBloom } = await import('../engine/index.js');
      const { accentFor, leafFor } = await import('../engine/flower.js');
      place = await import('../engine/heroLayout.js');
      if (dead) return;
      const seed = params.get('seed');
      engine = createBloom(canvasRef.current, {
        seed: seed == null ? undefined : Number(seed),
        breakShader: params.has('breakshader'),
        debug: params.has('debug'),
        tier: params.get('tier') ?? undefined,
        variant: params.has('variant') ? Number(params.get('variant')) : undefined,
        onVariant: (v) => {
          const root = document.documentElement.style;
          root.setProperty('--bloom', accentFor(v));
          root.setProperty('--leaf', leafFor(v));
          layout(); // the bloom's size differs per variant
        },
        onReady: () => setReady(true),
      });
      engineRef.current = engine;
      setEngine(engine);
      if (params.has('debug')) window.__bloom = engine;
      layout();
      document.fonts?.ready.then(layout);
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
    }, { timeout: 300 });

    return () => {
      dead = true;
      window.cancelIdleCallback?.(id);
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      if (engine) { engine.destroy(); setEngine(null); }
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setActive(!paused);
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full block"
      style={{ touchAction: 'pan-y pinch-zoom', opacity: ready ? 1 : 0, transition: 'opacity 600ms ease' }}
    />
  );
};
