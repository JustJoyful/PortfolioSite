import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '../data/content';

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

const Label = ({ children }) => (
  <p
    className="text-white/55 uppercase mb-6"
    style={{ fontSize: '9px', letterSpacing: '0.45em', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400 }}
  >
    {children}
  </p>
);

const GithubIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
  </svg>
);

// Placeholder card shown when there are no more real projects
const ComingSoonCard = () => (
  <div className="border-l border-white/10 pl-6 py-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded border border-white/15 flex items-center justify-center">
        <span className="text-white/20" style={{ fontSize: '10px' }}>✦</span>
      </div>
      <p
        className="text-white/30 font-light"
        style={{ fontSize: '18px', letterSpacing: '-0.01em' }}
      >
        More coming soon
      </p>
    </div>
    <p
      className="text-white/20 leading-relaxed"
      style={{ fontSize: '13px', fontWeight: 300 }}
    >
      Currently cooking. Check back soon or follow on GitHub to stay updated.
    </p>
    <div className="flex flex-wrap gap-1.5 mt-4">
      {['In progress', 'Stay tuned'].map(t => (
        <span
          key={t}
          className="px-2.5 py-1 rounded-full border border-dashed border-white/10 text-white/25"
          style={{ fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'monospace' }}
        >
          {t}
        </span>
      ))}
    </div>
  </div>
);

const REAL_COUNT = PORTFOLIO_DATA.projects.length;
// Total pages = real projects + 1 placeholder
const TOTAL = REAL_COUNT + 1;

export const Projects = () => {
  const [page, setPage] = useState(0);

  const prev = () => setPage(p => Math.max(0, p - 1));
  const next = () => setPage(p => Math.min(TOTAL - 1, p + 1));

  const project = page < REAL_COUNT ? PORTFOLIO_DATA.projects[page] : null;

  return (
    <section
      id="projects"
      className="min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full pr-10 md:pr-20"
        style={{ paddingLeft: 'clamp(1.5rem, 45vw, 52vw)' }}
      >
        {/* Header row: label + nav arrows */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="flex items-center justify-between mb-6"
        >
          <Label>02 — Projects</Label>

          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={prev}
              disabled={page === 0}
              className="w-7 h-7 rounded border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
              style={{ fontSize: '12px' }}
              aria-label="Previous project"
            >
              ‹
            </button>
            <span
              className="text-white/25 tabular-nums"
              style={{ fontSize: '9px', letterSpacing: '0.2em', fontFamily: 'monospace', minWidth: '3rem', textAlign: 'center' }}
            >
              {page + 1} / {TOTAL}
            </span>
            <button
              onClick={next}
              disabled={page === TOTAL - 1}
              className="w-7 h-7 rounded border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
              style={{ fontSize: '12px' }}
              aria-label="Next project"
            >
              ›
            </button>
          </div>
        </motion.div>

        {/* Project card — animated slide on page change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {project ? (
              <div className="group border-l border-white/20 pl-6 hover:border-white/50 transition-colors duration-500">
                <div className="flex items-baseline justify-between mb-3">
                  <h3
                    className="text-white/95 font-light"
                    style={{ fontSize: 'clamp(20px, 3vw, 28px)', letterSpacing: '-0.01em' }}
                  >
                    {project.title}
                  </h3>
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors duration-300"
                      style={{ fontSize: '10px', letterSpacing: '0.1em' }}
                    >
                      <GithubIcon />
                      <span>Source</span>
                    </a>
                  )}
                </div>

                <p
                  className="text-white/75 leading-relaxed mb-5"
                  style={{ fontSize: '14px', fontWeight: 300 }}
                >
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full border border-white/20 text-white/60"
                      style={{ fontSize: '10px', letterSpacing: '0.12em', fontFamily: 'monospace' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <ComingSoonCard />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
