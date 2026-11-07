import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';
import { ExternalLink } from '../components/ui/ExternalLink';

const GithubIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
  </svg>
);

// Placeholder card shown when there are no more real projects
const ComingSoonCard = () => (
  <div className="border-l border-line pl-6 py-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 bg-surface flex items-center justify-center">
        <span className="text-xs text-text-faint" aria-hidden="true">✦</span>
      </div>
      <p
        className="text-lg text-text-muted"
      >
        More coming soon
      </p>
    </div>
    <p
      className="text-sm text-text-muted leading-relaxed"
    >
      Currently cooking. Check back soon or follow on GitHub to stay updated.
    </p>
    <div className="flex flex-wrap gap-1.5 mt-4">
      {['In progress', 'Stay tuned'].map(t => (
        <span
          key={t}
          className="inline-block px-3 py-1 bg-surface text-text-faint text-xs"
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
      id="work"
      aria-labelledby="work-title"
      className="lg:min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full px-5 md:px-12 lg:pl-[38vw] lg:pr-12"
      >
        {/* Header row: label + nav arrows */}
        <Reveal className="flex items-center justify-between mb-6">
          <SectionHeading id="work-title" title="Work" />

          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={prev}
              disabled={page === 0}
              className="w-11 h-11 bg-surface flex items-center justify-center text-sm text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous project"
            >
              ‹
            </button>
            <span
              className="text-xs text-text-faint tabular-nums min-w-12 text-center"
            >
              {page + 1} / {TOTAL}
            </span>
            <button
              onClick={next}
              disabled={page === TOTAL - 1}
              className="w-11 h-11 bg-surface flex items-center justify-center text-sm text-text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next project"
            >
              ›
            </button>
          </div>
        </Reveal>

        {/* Project card — animated slide on page change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {project ? (
              <div className="group border-l border-line pl-6 hover:border-text-faint transition-colors duration-500">
                <div className="flex items-baseline justify-between mb-3">
                  <h3
                    className="text-xl text-text"
                  >
                    {project.title}
                  </h3>
                  {project.repo && (
                    <ExternalLink
                      href={project.repo}
                      className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors duration-300"
                    >
                      <GithubIcon />
                      <span>Source</span>
                    </ExternalLink>
                  )}
                </div>

                <p
                  className="text-base text-text-muted leading-loose mb-5"
                >
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <Chip key={tag}>{tag}</Chip>
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
