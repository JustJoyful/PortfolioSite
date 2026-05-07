import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { createSketch } from '../sketch/flowerSketch';
import { motion, AnimatePresence } from 'framer-motion';

export const BackgroundSketch = () => {
  const containerRef = useRef(null);
  const p5Instance = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (p5Instance.current) p5Instance.current.remove();

    const sketch = createSketch(() => setIsLoaded(true));
    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      if (p5Instance.current) p5Instance.current.remove();
    };
  }, []);

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
                className="absolute w-14 h-14 rounded-full border border-white/20"
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
