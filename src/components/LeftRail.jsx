import { useActiveSection } from '../hooks/useActiveSection';
import { motion } from 'framer-motion';

const IDS = ['hero', 'about', 'work', 'contact'];

export const LeftRail = () => {
  const activeId = useActiveSection(IDS);
  const active = IDS.indexOf(activeId);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-full z-20 flex flex-col items-center justify-between py-12 px-4 pointer-events-none select-none hidden lg:flex"
      style={{ width: '64px' }}
    >
      {/* Vertical name */}
      <div
        className="text-xs text-text-faint"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Joydeep Das
      </div>

      {/* Section dots */}
      <div className="flex flex-col items-center gap-3">
        {IDS.map((_, idx) => (
          <div
            key={idx}
            className="transition-all duration-500"
            style={{
              width: active === idx ? '2px' : '2px',
              height: active === idx ? '24px' : '6px',
              borderRadius: '2px',
              background: active === idx
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(255,255,255,0.2)',
              transition: 'height 0.4s ease, background 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Bottom thin line */}
      <div className="text-xs text-text-faint" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        ©2025
      </div>
    </motion.aside>
  );
};
