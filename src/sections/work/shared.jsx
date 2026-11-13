import { ExternalLink } from '../../components/ui/ExternalLink';

export const STATUS = { active: 'Active', complete: 'Complete', hackathon: 'Hackathon' };
export const KIND = { ai: 'AI', research: 'Research', backend: 'Backend' };
export const meta = (p) => `${STATUS[p.status]} · ${p.year}`;

export const Stack = ({ stack, ...rest }) => (
  <p className="text-sm text-text-muted" {...rest}>{stack.join(', ')}</p>
);

export const Links = ({ links }) => (
  <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text">
    {links.source && <ExternalLink href={links.source} className="inline-flex items-center min-h-11">Source ↗</ExternalLink>}
    {links.model && <ExternalLink href={links.model} className="inline-flex items-center min-h-11">Model ↗</ExternalLink>}
    {links.demo && <ExternalLink href={links.demo} className="inline-flex items-center min-h-11">Demo ↗</ExternalLink>}
  </p>
);

// Title and status on the left, the reading text on the right; shared by the featured and research exhibits.
export const Caption = ({ p, stack = false, titleProps }) => (
  <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
    <div>
      <h3 {...titleProps} className="font-display text-xl text-text tracking-[-0.02em] leading-[1.05]">{p.title}</h3>
      <p className="text-sm text-text-muted tabular-nums mt-2">{meta(p)}</p>
    </div>
    <div className="flex flex-col gap-3 max-w-[40rem]">
      <p className="text-base text-text">{p.oneLiner}</p>
      <p className="text-base text-text-muted">{p.result}</p>
      {stack && <Stack stack={p.stack} />}
      <Links links={p.links} />
    </div>
  </div>
);
