import { PORTFOLIO_DATA } from '../data/content';
import { ExternalLink } from './ui/ExternalLink';

export const Footer = () => (
  <footer className="relative z-10 px-5 md:px-12 lg:pl-[38vw] lg:pr-12 pb-12">
    <div className="lg:max-w-[680px] flex flex-wrap items-baseline justify-between gap-4 text-sm">
      <p className="text-text-faint">© {new Date().getFullYear()} Joydeep Das</p>
      <ExternalLink href={PORTFOLIO_DATA.contact.sourceUrl} className="min-h-11 inline-flex items-center text-text-muted hover:text-text">
        Source
      </ExternalLink>
    </div>
  </footer>
);
