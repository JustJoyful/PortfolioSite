import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { createSketch } from '../sketch/flowerSketch';
import { motion, AnimatePresence } from 'framer-motion';
import { createBloom } from '../engine';

const params = new URLSearchParams(window.location.search);
const USE_BLOOM = params.get('engine') === 'bloom'; // temporary route until the engine becomes the default

export const BackgroundSketch = ({ paused = false }) => {
  const containerRef = useRef(null);
  const p5Instance = useRef(null);
  const bloomRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!USE_BLOOM || !containerRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full block';
    containerRef.current.appendChild(canvas);
    const seed = params.get('seed');
    const engine = createBloom(canvas, { seed: seed == null ? undefined : Number(seed), onReady: () => setIsLoaded(true) });
    bloomRef.current = engine;
    if (params.has('debug')) window.__bloom = engine;
    return () => { engine.destroy(); canvas.remove(); bloomRef.current = null; };
  }, []);

  useEffect(() => {
    if (USE_BLOOM || !containerRef.current) return;
    if (p5Instance.current) p5Instance.current.remove();

    const sketch = createSketch(() => setIsLoaded(true));
    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      if (p5Instance.current) p5Instance.current.remove();
    };
  }, []);

  useEffect(() => {
    bloomRef.current?.setActive(!paused);
    if (p5Instance.current && p5Instance.current.setActive) {
      p5Instance.current.setActive(!paused);
    }
  }, [paused]);

  return (
    <>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center"
          >
            {/* Monogram */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative flex items-center justify-center"
            >
              {/* Expanding ring */}
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-14 h-14 border border-white/20"
              />
              <span
                className="text-white/60 tracking-[0.6em] uppercase pl-[0.6em]"
                style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300 }}
              >
                JD
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P5 Canvas — fills the parent shifted container in App.jsx */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-auto"
      />
    </>
  );
};
