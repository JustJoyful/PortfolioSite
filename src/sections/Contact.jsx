import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ExternalLink } from '../components/ui/ExternalLink';

const ContactRow = ({ label, value, href, delay }) => {
  const Link = href.startsWith('http') ? ExternalLink : 'a';
  return (
  <Reveal stagger={delay} className="flex items-baseline gap-5 group">
    <span
      className="text-xs text-text-faint shrink-0 w-16"
    >
      {label}
    </span>
    <Link
      href={href}
      className="text-sm text-text-muted hover:bg-text hover:text-bg truncate"
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
          className="font-display text-2xl text-text mb-12"
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
          className="mt-20 pt-8 border-t border-line"
        >
          <p
            className="text-xs text-text-faint"
          >
            Joydeep Das — NSEC CSE 2025–29
          </p>
        </Reveal>
      </div>
    </section>
  );
};
