import { useEffect, useRef, useState } from 'react';
import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ExternalLink } from '../components/ui/ExternalLink';

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" data-check>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const EmailRow = ({ label, address, delay }) => {
  const [copied, setCopied] = useState(false);
  const addressRef = useRef(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      // Throws when navigator.clipboard is missing, so the fallback below covers it too.
      await navigator.clipboard.writeText(address);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // No check on failure: drop any check from an earlier success, then select the address.
      clearTimeout(timer.current);
      setCopied(false);
      const range = document.createRange();
      range.selectNodeContents(addressRef.current);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
  };

  return (
    <Reveal stagger={delay} className="flex items-center gap-4 min-w-0">
      <span className="text-sm text-text-muted shrink-0 w-28">{label}</span>
      <a
        ref={addressRef}
        data-address
        href={`mailto:${address}`}
        className="min-w-0 min-h-11 inline-flex items-center text-lg text-text hover:text-bloom transition-colors [overflow-wrap:anywhere]"
      >
        {address}
      </a>
      <button
        type="button"
        aria-label={`Copy ${address}`}
        onClick={copy}
        data-copied={copied || undefined}
        className="shrink-0 inline-flex items-center justify-center h-11 w-11 text-text-muted hover:text-text"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </Reveal>
  );
};

const ContactRow = ({ label, value, href, delay }) => (
  <Reveal stagger={delay} className="flex items-center gap-4 min-w-0">
    <span className="text-sm text-text-muted shrink-0 w-28">{label}</span>
    <ExternalLink href={href} className="min-w-0 min-h-11 inline-flex items-center text-lg text-text hover:text-bloom transition-colors [overflow-wrap:anywhere]">
      {value}
    </ExternalLink>
  </Reveal>
);

export const Contact = () => {
  const { contact } = PORTFOLIO_DATA;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="lg:min-h-[100svh] w-full lg:grid lg:grid-cols-[38vw_minmax(0,1fr)] items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full px-5 md:px-12 lg:px-0 lg:pr-24 lg:col-start-2"
      >
        <SectionHeading id="contact-title" title="Contact" className="mb-6" />

        <Reveal as="p" stagger={1} className="font-sans text-lg text-text mb-12">
          The best way to reach me is email.
        </Reveal>

        <div className="flex flex-col gap-5">
          <EmailRow label="Email" address={contact.emailPersonal} delay={2} />
          <EmailRow label="Student email" address={contact.emailStudent} delay={3} />
          <ContactRow label="GitHub" value={contact.github} href={contact.githubUrl} delay={4} />
          <ContactRow label="LinkedIn" value={contact.linkedin} href={contact.linkedinUrl} delay={5} />
        </div>

      </div>
    </section>
  );
};
