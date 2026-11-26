import { ExternalLink } from '../../components/ui/ExternalLink';

export const STATUS = { active: 'Active', complete: 'Complete', hackathon: 'Hackathon' };
// Live work is marked with a leaf-coloured dot and status word.
export const Meta = ({ p }) => (
  <p className="flex items-center gap-2 text-sm text-text-muted tabular-nums mt-2">
    {p.status === 'active' && <span aria-hidden="true" className="size-1.5 rounded-full bg-leaf" />}
    <span><span className={p.status === 'active' ? 'text-leaf' : undefined}>{STATUS[p.status]}</span> · {p.year}</span>
  </p>
);

export const Stack = ({ stack, ...rest }) => (
  <p className="text-sm text-text-muted" {...rest}>{stack.join(', ')}</p>
);

export const Links = ({ links }) => (
  <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text">
    {links.source && <ExternalLink href={links.source} className="inline-flex items-center min-h-11">Source ↗</ExternalLink>}
    {links.model && <ExternalLink href={links.model} className="inline-flex items-center min-h-11">Model ↗</ExternalLink>}
    {links.demo && <ExternalLink href={links.demo} className="inline-flex items-center min-h-11">Demo ↗</ExternalLink>}
    {links.app && <ExternalLink href={links.app} className="inline-flex items-center min-h-11">App source ↗</ExternalLink>}
  </p>
);
