import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { ExternalLink } from '../components/ui/ExternalLink';

const icon = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const GithubIcon = () => (
  <svg {...icon}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
  </svg>
);
const LinkedinIcon = () => (
  <svg {...icon}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
  </svg>
);

const iconLink = 'inline-flex items-center justify-center w-11 h-11 text-text-muted hover:text-text focus-visible:text-text';

export const Hero = () => {
  const { hero, resumeUrl, contact } = PORTFOLIO_DATA;
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative min-h-[100svh] w-full flex flex-col justify-end lg:justify-center pointer-events-none px-5 md:px-12 pb-16 lg:pb-0 lg:pl-[56vw] lg:pr-12"
    >
      <div className="pointer-events-auto">
        <h1 id="hero-title" className="font-display text-display text-text tracking-[-0.02em]">
          <Reveal as="span" variant="lines" className="block pb-[0.15em] -mb-[0.15em]">{hero.name}</Reveal>
        </h1>
        <div>
          <p className="text-lg text-text mt-4">{hero.role}</p>
          <p className="text-base text-text-muted mt-1">{hero.degree}</p>
          <p className="text-base text-text mt-6 max-w-[34rem]">{hero.sentence}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 mt-6">
          <a href="#work" className="ext-link inline-flex items-center min-h-11 text-base text-text">Work</a>
          <a href="#contact" className="ext-link inline-flex items-center min-h-11 text-base text-text">Contact</a>
          {resumeUrl && <ExternalLink href={resumeUrl} className="inline-flex items-center min-h-11 text-base text-text">Résumé</ExternalLink>}
          <span className="flex">
            <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={iconLink}><GithubIcon /></a>
            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={iconLink}><LinkedinIcon /></a>
          </span>
        </div>
      </div>
    </section>
  );
};
