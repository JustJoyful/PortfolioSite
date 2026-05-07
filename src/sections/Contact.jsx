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
    className="text-white/55 uppercase mb-6"
    style={{ fontSize: '9px', letterSpacing: '0.45em', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400 }}
  >
    {children}
  </p>
);

const ContactRow = ({ label, value, href, delay }) => (
  <motion.div
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    className="flex items-baseline gap-5 group"
  >
    <span
      className="text-white/45 shrink-0"
      style={{ fontSize: '9px', letterSpacing: '0.25em', fontFamily: 'monospace', width: '4rem' }}
    >
      {label}
    </span>
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="text-white/75 hover:text-white transition-colors duration-300 truncate"
      style={{ fontSize: '13px', fontWeight: 300 }}
    >
      {value}
    </a>
  </motion.div>
);

export const Contact = () => {
  const { contact } = PORTFOLIO_DATA;

  return (
    <section
      id="contact"
      className="min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full pr-10 md:pr-20"
        style={{ paddingLeft: 'clamp(1.5rem, 45vw, 52vw)' }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          <Label>03 — Contact</Label>
        </motion.div>

        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-white/85 font-light mb-12"
          style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.01em' }}
        >
          Let's build something.
        </motion.h2>

        <div className="flex flex-col gap-5">
          <ContactRow label="github"   value={contact.github}        href={contact.githubUrl}               delay={2} />
          <ContactRow label="linkedin" value={contact.linkedin}      href={contact.linkedinUrl}             delay={3} />
          <ContactRow label="email"    value={contact.emailPersonal} href={`mailto:${contact.emailPersonal}`} delay={4} />
          <ContactRow label="student"  value={contact.emailStudent}  href={`mailto:${contact.emailStudent}`}  delay={5} />
        </div>

        <motion.div
          custom={7}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-20 pt-8 border-t border-white/15"
        >
          <p
            className="text-white/50"
            style={{ fontSize: '9px', letterSpacing: '0.3em', fontFamily: 'monospace' }}
          >
            JOYDEEP DAS — NSEC CSE 2025–29
          </p>
        </motion.div>
      </div>
    </section>
  );
};
