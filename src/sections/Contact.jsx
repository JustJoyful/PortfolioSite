import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ExternalLink } from '../components/ui/ExternalLink';

const ContactRow = ({ label, value, href, delay }) => {
  const Link = href.startsWith('http') ? ExternalLink : 'a';
  return (
  <Reveal stagger={delay} className="flex items-baseline gap-5 group">
    <span
      className="text-white/45 shrink-0"
      style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: 'monospace', width: '4rem' }}
    >
      {label}
    </span>
    <Link
      href={href}
      className="text-white/75 hover:bg-white hover:text-black hover:border-white truncate"
      style={{ fontSize: '13px', fontWeight: 300, fontFamily: "'Courier New', monospace" }}
    >
      {value}
    </Link>
  </Reveal>
  );
};

export const Contact = () => {
  const { contact } = PORTFOLIO_DATA;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="lg:min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full px-5 md:px-12 lg:pl-[38vw] lg:pr-12"
      >
        <SectionHeading id="contact-title" title="Contact" className="mb-6" />

        <Reveal
          as="p"
          stagger={1}
          className="text-white/85 font-light mb-12 tracking-tight"
          style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}
        >
          Let's build something.
        </Reveal>

        <div className="flex flex-col gap-5">
          <ContactRow label="github"   value={contact.github}        href={contact.githubUrl}               delay={2} />
          <ContactRow label="linkedin" value={contact.linkedin}      href={contact.linkedinUrl}             delay={3} />
          <ContactRow label="email"    value={contact.emailPersonal} href={`mailto:${contact.emailPersonal}`} delay={4} />
          <ContactRow label="student"  value={contact.emailStudent}  href={`mailto:${contact.emailStudent}`}  delay={5} />
        </div>

        <Reveal
          stagger={7}
          className="mt-20 pt-8 border-t border-white/15"
        >
          <p
            className="text-white/50"
            style={{ fontSize: '9px', letterSpacing: '0.3em', fontFamily: 'monospace' }}
          >
            JOYDEEP DAS — NSEC CSE 2025–29
          </p>
        </Reveal>
      </div>
    </section>
  );
};
