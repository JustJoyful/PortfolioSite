import { Reveal } from './Reveal';

export const SectionHeading = ({ id, title, className = '' }) => (
  <h2 id={id} className={`font-display font-medium text-section text-text tracking-[-0.035em] ${className}`}>
    <Reveal as="span" variant="lines" className="block">{title}</Reveal>
  </h2>
);
