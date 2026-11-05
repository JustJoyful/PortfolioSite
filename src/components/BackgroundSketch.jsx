import { useEffect, useRef, useState } from 'react';
import { setEngine } from '../engine/handle';

const params = new URLSearchParams(window.location.search);
const LEGACY = params.get('engine') === 'legacy';
const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 1));

export const BackgroundSketch = ({ paused = false }) => {
  const canvasRef = useRef(null);
  const legacyRef = useRef(null);
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false, p5i = null, engine = null;
    const layout = () => engine?.setLayout({ falloffX: innerWidth >= 1024 ? 0.69 * innerWidth : 0 });
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(layout, 150); };

    const id = idle(async () => {
      if (dead) return;
      if (LEGACY) {
        const [{ default: p5 }, { createSketch }] = await Promise.all([import('p5'), import('../sketch/flowerSketch.js')]);
        if (dead) return;
        p5i = new p5(createSketch(() => setReady(true)), legacyRef.current);
        legacyRef.current.p5 = p5i;
        return;
      }
      const { createBloom } = await import('../engine/index.js');
      if (dead) return;
      const seed = params.get('seed');
      engine = createBloom(canvasRef.current, {
        seed: seed == null ? undefined : Number(seed),
        breakShader: params.has('breakshader'),
        tier: params.get('tier') ?? undefined,
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
      p5i?.remove();
      if (engine) { engine.destroy(); setEngine(null); }
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setActive(!paused);
    legacyRef.current?.p5?.setActive?.(!paused);
  }, [paused]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full block"
        style={{ touchAction: 'pan-y', opacity: ready ? 1 : 0, transition: 'opacity 600ms ease', display: LEGACY ? 'none' : 'block' }}
      />
      {LEGACY && <div ref={legacyRef} className="absolute inset-0 pointer-events-auto" />}
    </>
  );
};
