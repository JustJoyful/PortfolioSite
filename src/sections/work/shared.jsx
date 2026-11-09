import { Chip } from '../../components/ui/Chip';
import { ExternalLink } from '../../components/ui/ExternalLink';

export const STATUS = { active: 'Active', complete: 'Complete', hackathon: 'Hackathon' };
export const KIND = { ai: 'AI', research: 'Research', backend: 'Backend' };
export const meta = (p) => `${STATUS[p.status]} · ${p.year}`;

export const Stack = ({ stack, ...rest }) => (
  <div className="flex flex-wrap gap-2" {...rest}>
    {stack.map((s) => <Chip key={s}>{s}</Chip>)}
  </div>
);

export const Links = ({ links }) => (
  <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text">
    {links.source && <ExternalLink href={links.source} className="inline-flex items-center min-h-11">Source ↗</ExternalLink>}
    {links.model && <ExternalLink href={links.model} className="inline-flex items-center min-h-11">Model ↗</ExternalLink>}
    {links.demo && <ExternalLink href={links.demo} className="inline-flex items-center min-h-11">Demo ↗</ExternalLink>}
  </p>
);
