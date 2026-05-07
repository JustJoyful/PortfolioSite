import { motion } from 'framer-motion';
import { PORTFOLIO_DATA } from '../data/content';

export const Hero = () => {
  return (
    <section
      id="hero"
      className="relative h-[100dvh] w-full flex flex-col justify-end items-center pb-20 pointer-events-none select-none overflow-hidden"
    >
      {/* Bottom vignette — soft fade into next section */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '35vh',
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
        }}
      />

      {/* Tagline — lower third, above vignette */}
      <motion.div
        className="text-center z-10 px-4 mb-4"
        initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 2.4, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          className="text-white/50 uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.6em',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 300,
          }}
        >
          {PORTFOLIO_DATA.hero.subtitle}
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 1 }}
      >
        <motion.div
          animate={{ height: [20, 44, 20], opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[1px] bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>
    </section>
  );
};
