import { motion } from 'framer-motion';
import { PORTFOLIO_DATA } from '../data/content';

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

const Label = ({ children }) => (
  <p
    className="text-white/70 uppercase mb-5 tracking-[0.3em]"
    style={{ fontSize: 'clamp(11px, 1.3vw, 14px)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}
  >
    {children}
  </p>
);

const Tag = ({ children }) => (
  <span
    className="inline-block px-3 py-1 border border-white/25 text-white/80 hover:bg-white hover:text-black hover:border-white cursor-default"
    style={{ fontSize: '11px', letterSpacing: '0.1em', fontFamily: "'Courier New', monospace", fontWeight: 400 }}
  >
    {children}
  </span>
);

export const About = () => {
  const allTags = [
    ...PORTFOLIO_DATA.skills.languages,
    ...PORTFOLIO_DATA.skills.markup,
  ];

  return (
    <section
      id="about"
      className="min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full pr-8 md:pr-16"
        style={{ paddingLeft: 'clamp(1.5rem, 38vw, 48vw)' }}
      >
        {/* Section label — first */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <Label>01 — About</Label>
        </motion.div>

        {/* Portrait + Name */}
        <motion.div
          custom={0.5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="mb-10"
        >
          {/* Portrait card */}
          <div
            className="overflow-hidden border border-white/15 mb-5"
            style={{ width: '160px', height: '213px', background: 'rgba(255,255,255,0.04)' }}
          >
            {PORTFOLIO_DATA.about.portrait ? (
              <img
                src={PORTFOLIO_DATA.about.portrait}
                alt="Joydeep Das"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>PHOTO</span>
              </div>
            )}
          </div>

          {/* Name + subtitle below portrait */}
          <h1
            className="text-white/90 font-light tracking-tight"
            style={{ fontSize: 'clamp(22px, 3vw, 36px)', lineHeight: 1.1 }}
          >
            Joydeep Das
          </h1>
          <p
            className="text-white/35 mt-1"
            style={{ fontSize: '10px', letterSpacing: '0.25em', fontFamily: 'monospace' }}
          >
            NSEC · CSE 2025–29
          </p>
        </motion.div>

        {/* Bio */}
        <div className="space-y-5 mb-10">
          {PORTFOLIO_DATA.about.bio.map((para, idx) => (
            <motion.p
              key={idx}
              custom={idx + 2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="text-white/85 leading-loose"
              style={{ fontSize: '15px', fontWeight: 300, fontFamily: "'Courier New', monospace" }}
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Stack */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="mb-3"
        >
          <Label>Stack</Label>
        </motion.div>
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag, i) => (
            <motion.div
              key={tag}
              custom={4 + i * 0.3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Tag>{tag}</Tag>
            </motion.div>
          ))}
        </div>

        {/* Spoken */}
        <motion.div
          custom={6}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-3"
        >
          <Label>Spoken</Label>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          {PORTFOLIO_DATA.skills.spoken.map(lang => <Tag key={lang}>{lang}</Tag>)}
        </div>
      </div>
    </section>
  );
};
