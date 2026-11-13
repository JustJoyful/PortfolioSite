import { useEffect, useRef, useState } from 'react';
import { setEngine } from '../engine/handle';

const params = new URLSearchParams(window.location.search);
const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 1));

export const BackgroundSketch = ({ paused = false }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false, engine = null;
    const layout = () => {
      const d = innerWidth >= 1024;
      engine?.setLayout({
        falloffX: d ? 0.55 * innerWidth : 0,
        // Optical centre of the free field between the 64px rail and the hero text at 56vw.
        centerX: d ? 32 + 0.28 * innerWidth : null,
        centerY: d ? null : 0.36 * innerHeight,
      });
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
      const { accentFor } = await import('../engine/flower.js');
      if (dead) return;
      const seed = params.get('seed');
      engine = createBloom(canvasRef.current, {
        seed: seed == null ? undefined : Number(seed),
        breakShader: params.has('breakshader'),
        tier: params.get('tier') ?? undefined,
        onVariant: (v) => document.documentElement.style.setProperty('--bloom', accentFor(v)),
        onReady: () => setReady(true),
      });
      engineRef.current = engine;
      setEngine(engine);
      if (params.has('debug')) window.__bloom = engine;
      layout();
      window.addEventListener('resize', onResize);
    }, { timeout: 300 });

    return () => {
      dead = true;
      window.cancelIdleCallback?.(id);
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
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
